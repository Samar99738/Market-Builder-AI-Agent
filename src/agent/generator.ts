import { StrategySpec } from "../schema";
import {
  getQuoteSummary,
  resolveTokenMeta,
  inputMintForCurrency,
} from "../runtime/functions";
import { getBestRoute } from "../runtime/jupiter";
import { getConnection, ensureDevnetFunds } from "../runtime/solana";
import {
  buildSwapTransaction,
  sendAndConfirm,
  loadKeypairFromBase58,
  refreshRecentBlockhash,
} from "../runtime/swap";
import { PublicKey, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { ensureAtaForMint } from "../runtime/ata";
import { wrapSol, unwrapAllWsolIfAny } from "../runtime/wsol";

// Types for execution results
type StepResult = { step: string; [k: string]: any };
type RunOutput = StepResult[];
type RunFunction = () => Promise<RunOutput>;

// Helper to enforce required secrets for execution mode
function requireExecuteSecrets(network: "devnet" | "mainnet"): string {
  if (process.env.EXECUTE_STRICT !== "1") {
    throw new Error("Execution disabled: set EXECUTE_STRICT=1 to allow on-chain swaps");
  }
  const key = process.env.FOLLOWER_PRIVATE_KEY_BASE58;
  if (!key) {
    throw new Error("Missing FOLLOWER_PRIVATE_KEY_BASE58 for execute mode");
  }
  if (network === "mainnet" && process.env.ALLOW_MAINNET !== "1") {
    throw new Error("Mainnet execute blocked. Set ALLOW_MAINNET=1 to enable at your own risk.");
  }
  return key;
}

// Helper to build explorer URL for a given transaction signature
function explorerTxUrl(signature: string, network: "devnet" | "mainnet") {
  const cluster = network === "devnet" ? "?cluster=devnet" : "";
  return `https://explorer.solana.com/tx/${signature}${cluster}`;
}

// Main generator: creates an async function that executes a given strategy
export function generateExecutable(
  spec: StrategySpec,
  opts?: {
    network?: "devnet" | "mainnet";
    execute?: boolean;
    slippageBps?: number;
  }
): RunFunction {
  const network = opts?.network ?? "devnet";
  // Slightly higher slippage for execute mode; simulation stays at 50bps
  const slippage = opts?.slippageBps ?? (opts?.execute ? 75 : 50);
  const doExecute = !!opts?.execute;

  // Safety limits for trade sizes
  const MAX_USDC_PER_TRADE = Number(
    process.env.MAX_USDC_PER_TRADE || (network === "mainnet" ? 50 : 5)
  );
  const MAX_SOL_PER_TRADE = Number(
    process.env.MAX_SOL_PER_TRADE || (network === "mainnet" ? 0.5 : 0.1)
  );

  // Returned async run function that executes or simulates each step
  return async function run(): Promise<RunOutput> {
    const results: RunOutput = [];
    const conn = getConnection(network);

    // Load signer if in execute mode, and fund on devnet if needed
    let signer: Keypair | undefined;
    if (doExecute) {
      const secret = requireExecuteSecrets(network);
      signer = loadKeypairFromBase58(secret);

      if (network === "devnet") {
        const min = Number(process.env.MIN_DEVNET_SOL || 0.05);
        try {
          await ensureDevnetFunds(conn, signer!, min);
        } catch (e) {
          console.warn("[devnet] ensureDevnetFunds warning:", e);
        }
      }
    }

    // Ensure Associated Token Account is ready before trading
    async function ensureAtaReady(mintStr: string) {
      await ensureAtaForMint(conn, signer!, signer!.publicKey, new PublicKey(mintStr));
      await new Promise((r) => setTimeout(r, 150));
    }

    // Process each step in the strategy
    for (const step of spec.steps) {
      if (step.type === "buy") {
        // Extract step details
        const token = (step as any).token as string | undefined;
        const amount = (step as any).budget?.amount ?? (step as any).amount ?? 0;
        const currency = ((step as any).budget?.currency ?? "USDC") as "USDC" | "SOL";

        // Validate inputs and enforce safety limits
        if (!token || !amount || typeof amount !== "number" || amount <= 0) {
          results.push({ step: "buy", skipped: true, reason: "missing token or amount" });
          continue;
        }
        if (currency === "USDC" && amount > MAX_USDC_PER_TRADE) {
          results.push({ step: "buy", skipped: true, reason: `amount exceeds limit: ${amount}USDC > ${MAX_USDC_PER_TRADE}USDC` });
          continue;
        }
        if (currency === "SOL" && amount > MAX_SOL_PER_TRADE) {
          results.push({ step: "buy", skipped: true, reason: `amount exceeds limit: ${amount}SOL > ${MAX_SOL_PER_TRADE}SOL` });
          continue;
        }

        // Resolve token metadata
        let inMetaMint = "";
        let outMetaMint = "";
        let inMetaDecimals = 0;
        let outMetaDecimals = 0;

        try {
          const inMeta = inputMintForCurrency(currency, network);
          const outMeta = await resolveTokenMeta(token, network);
          inMetaMint = inMeta.mint;
          outMetaMint = outMeta.mint;
          inMetaDecimals = inMeta.decimals;
          outMetaDecimals = outMeta.decimals;

          // Prevent self-swaps
          if (inMetaMint === outMetaMint) {
            results.push({
              step: "buy",
              token, input: currency, skipped: true,
              reason: "Input and output tokens are identical; route not allowed.",
              resolvedInputMint: inMetaMint, resolvedOutputMint: outMetaMint,
            });
            continue;
          }

          // Prevent non-tradable devnet USDC
          if (
            network === "devnet" &&
            currency === "USDC" &&
            inMetaMint === "Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr"
          ) {
            results.push({
              step: "buy", token, input: currency, skipped: true,
              reason: "Devnet USDC (Gh9Z...) is often not tradable. Use SOL as input, switch to mainnet, or a devnet-tradable mint.",
              resolvedInputMint: inMetaMint, resolvedOutputMint: outMetaMint,
            });
            continue;
          }
        } catch (e) {
          results.push({ step: "buy", token, input: currency, error_code: "RESOLVE_FAILED", error: e instanceof Error ? e.message : String(e) });
          continue;
        }

        // Simulation mode: only get quotes
        if (!doExecute) {
          try {
            const quote = await getQuoteSummary(currency, token, amount, 50, network);
            results.push({
              step: "buy", token, simulate: true, amount, input: currency, quote,
              resolvedInputMint: inMetaMint, resolvedOutputMint: outMetaMint,
              inputDecimals: inMetaDecimals, outputDecimals: outMetaDecimals,
            });
          } catch (e) {
            results.push({
              step: "buy", token, input: currency, error_code: "QUOTE_FAILED",
              error: e instanceof Error ? e.message : String(e),
              resolvedInputMint: inMetaMint, resolvedOutputMint: outMetaMint,
            });
          }
          continue;
        }

        // EXECUTION mode: build, sign and send swap transaction
        try {
          // Ensure balance is sufficient
          const payerBal = await conn.getBalance(signer!.publicKey, { commitment: "confirmed" });
          const amountLamports = Math.max(1, Math.round(amount * LAMPORTS_PER_SOL));
          const feeBuffer = Math.ceil(0.02 * LAMPORTS_PER_SOL); 
          const needed = currency === "SOL" ? amountLamports + feeBuffer : feeBuffer;
          if (payerBal < needed) {
            throw new Error(
              `INSUFFICIENT_SOL: wallet has ${payerBal / LAMPORTS_PER_SOL} SOL, needs at least ${(needed / LAMPORTS_PER_SOL).toFixed(3)} SOL to execute`
            );
          }

          // Prepare token accounts
          await ensureAtaReady(outMetaMint);
          if (currency !== "SOL") await ensureAtaReady(inMetaMint);

          // Wrap SOL to WSOL if needed
          if (currency === "SOL") {
            await wrapSol(conn, signer!, signer!.publicKey, amountLamports);
          }

          // Get best swap route
          const amountAtomic = String(Math.max(1, Math.round(amount * 10 ** inMetaDecimals)));
          const bestRoute = await getBestRoute({
            inputMint: inMetaMint, outputMint: outMetaMint, amount: amountAtomic, slippageBps: slippage,
          });

          // Build, sign, and send transaction
          let tx = await buildSwapTransaction({
            connection: conn, user: signer!, quoteResponse: bestRoute, wrapAndUnwrapSol: true,
          });

          tx = await refreshRecentBlockhash(conn, tx);
          tx.sign([signer!]);
          const signature = await sendAndConfirm(conn, tx);

          // Clean up WSOL if used
          if (currency === "SOL") {
            await unwrapAllWsolIfAny(conn, signer!, signer!.publicKey).catch(() => {});
          }

          // Record successful execution
          results.push({
            step: "buy", token, execute: true, input: currency,
            amountIn: amount, signature, explorer: explorerTxUrl(signature, network), network,
            resolvedInputMint: inMetaMint, resolvedOutputMint: outMetaMint,
            inputDecimals: inMetaDecimals, outputDecimals: outMetaDecimals, amountAtomic,
          });
        } catch (e: any) {
          // Error handling with logs if available
          let msg = String(e?.message || e);
          try {
            const logs = (e as any)?.logs || (e as any)?.getLogs?.();
            if (logs) {
              const text = Array.isArray(logs) ? logs.join("\n") : String(await logs);
              if (text && !msg.includes("Logs:")) msg += `\nLogs:\n${text}`;
            }
          } catch {}
          results.push({
            step: "buy", token, input: currency, execute: true,
            error_code: /INSUFFICIENT_SOL/.test(msg) ? "INSUFFICIENT_SOL" : /TX_TOO_LARGE/.test(msg) ? "TX_TOO_LARGE" : "EXECUTE_FAILED",
            error: msg, network,
            resolvedInputMint: inMetaMint, resolvedOutputMint: outMetaMint,
            inputDecimals: inMetaDecimals, outputDecimals: outMetaDecimals,
          });
        }
      } else if (step.type === "wait") {
        // Handle wait step
        results.push({ step: "wait", every: (step as any).every, unit: (step as any).unit, simulate: !doExecute });
      } else {
        // Skip unsupported step types
        results.push({ step: (step as any).type ?? "unknown", skipped: true, reason: "unsupported step type in MVP" });
      }
    }

    return results;
  };
}
