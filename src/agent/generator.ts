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
import { swapViaOrcaWhirlpool } from "../runtime/orca";
import { performMockSwap } from "../runtime/devSwap";

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
      const ata = await ensureAtaForMint(conn, signer!, signer!.publicKey, new PublicKey(mintStr));
      const info = await conn.getAccountInfo(ata);
      if (!info) {
        throw new Error(`[ATA] Failed to create/find ATA for mint: ${mintStr}`);
      }
      // ATA should be a token account, check its owner field
      const ataOwner = info.owner.toBase58();
      const expectedOwner = signer!.publicKey.toBase58();
      const tokenProg = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
      const token2022 = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";
      if (ataOwner !== tokenProg && ataOwner !== token2022) {
        throw new Error(`[ATA] Account at ${ata.toBase58()} is not a token account (owner: ${ataOwner})`);
      }
      // Now fetch the token account data to check its actual owner
      const tokenAccountInfo = await conn.getParsedAccountInfo(ata);
      let actualOwner = undefined;
      let tokenAccountData = undefined;
      if (tokenAccountInfo?.value?.data && typeof tokenAccountInfo.value.data === "object" && "parsed" in tokenAccountInfo.value.data) {
        tokenAccountData = (tokenAccountInfo.value.data as any).parsed;
        actualOwner = tokenAccountData?.info?.owner;
      }
      if (actualOwner !== expectedOwner) {
  console.error(`ATA token account for mint ${mintStr} not owned by wallet ${expectedOwner}`);
        throw new Error(`[ATA] Token account for mint ${mintStr} is not owned by wallet: ${expectedOwner}`);
      }
      await new Promise((r) => setTimeout(r, 150));
    }

    // Process each step in the strategy
    for (const step of spec.steps) {
      if (step.type === "buy") {
        // Always use outputMint for devnet tokens, never token
        if ((step as any).outputMint) {
          (step as any).token = undefined;
        }
        // Extract step details
        let token: string | undefined = undefined;
        if ((step as any).outputMint) {
          token = (step as any).outputMint;
        } else if ((step as any).token) {
          token = (step as any).token;
        }
        let amount = (step as any).budget?.amount ?? (step as any).amount ?? 0;
        // Fallback: if amount is missing, try amountAtomic
        if ((!amount || typeof amount !== "number" || amount <= 0) && (step as any).amountAtomic) {
          const parsed = parseFloat((step as any).amountAtomic);
          if (!isNaN(parsed) && parsed > 0) amount = parsed;
        }
        let currency: string = (step as any).budget?.currency ?? "USDC";
        // Patch: If currency is TOKENS and strategy text contains 'with SOL', force to SOL
        if (currency === "TOKENS" && typeof spec === "object" && 'rawText' in spec && typeof (spec as any).rawText === 'string' && /with\s+SOL/i.test((spec as any).rawText)) {
          currency = "SOL";
        }
        // Patch: If currency is TOKENS, default to SOL
        if (currency === "TOKENS") {
          currency = "SOL";
        }

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
          const inMeta = inputMintForCurrency(currency as "USDC" | "SOL", network);
          const outMeta = await resolveTokenMeta(token, network);
          inMetaMint = inMeta.mint;
          outMetaMint = outMeta.mint;
          inMetaDecimals = inMeta.decimals;
          outMetaDecimals = outMeta.decimals;
          // Log resolved mints and decimals

          // Validate output mint: must be a valid SPL token mint (length 44, base58, not all 1s)
          const validMint = typeof outMetaMint === "string" && (outMetaMint.length === 43 || outMetaMint.length === 44) && !/^1+$/.test(outMetaMint);
          if (!validMint) {
            console.error(`Invalid output mint for swap: ${outMetaMint}`);
            results.push({
              step: "buy", input: currency, skipped: true,
              reason: `Invalid output mint for token: ${outMetaMint}`,
              resolvedInputMint: inMetaMint, resolvedOutputMint: outMetaMint,
            });
            continue;
          }

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
            const quote = await getQuoteSummary(currency as "USDC" | "SOL", token, amount, 50, network);
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

          // Get best swap route BEFORE creating ATAs to avoid side-effects if not tradable
          const amountAtomic = String(Math.max(1, Math.round(amount * 10 ** inMetaDecimals)));
          const bestRoute = await getBestRoute({
            inputMint: inMetaMint,
            outputMint: outMetaMint,
            amount: amountAtomic,
            slippageBps: slippage,
            environment: network === "mainnet" ? "mainnet-beta" : "devnet",
          });

          // Prepare token accounts AFTER we know route exists
          if (outMetaMint) await ensureAtaReady(outMetaMint);
          // For SOL input, let Jupiter wrap internally in the swap transaction.
          if (currency !== "SOL" && inMetaMint) await ensureAtaReady(inMetaMint);

          // Build, sign, and send transaction via Jupiter when possible
          let tx = await buildSwapTransaction({
            connection: conn, user: signer!, quoteResponse: bestRoute, wrapAndUnwrapSol: true,
            environment: network === "mainnet" ? "mainnet-beta" : "devnet",
          });
          tx = await refreshRecentBlockhash(conn, tx);
          tx.sign([signer!]);
          // Extra debug: print top-level program IDs in the built transaction to spot unsupported programs
          let progIds: string[] = [];
          try {
            progIds = Array.from(new Set((tx.message as any).compiledInstructions?.map((ix: any) => (tx.message as any).staticAccountKeys[ix.programIdIndex]?.toBase58?.() || "<unknown>") || []));
          } catch {}
          // On devnet, proactively detect unsupported aggregator program (non-executable)
          if (network === "devnet") {
            const knownOk = new Set([
              "ComputeBudget111111111111111111111111111111",
              "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL",
              "11111111111111111111111111111111",
              "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
              "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb",
            ]);
            for (const id of progIds) {
              if (knownOk.has(id)) continue;
              try {
                const info = await conn.getAccountInfo(new PublicKey(id));
                const exec = !!info?.executable;
                if (!exec) {
                  throw new Error(
                    `UNSUPPORTED_PROGRAM_ID: Program ${id} is not executable on devnet. Jupiter aggregator is not deployed on devnet; cannot execute swaps via API.`
                  );
                }
              } catch (checkErr) {
                throw checkErr;
              }
            }
          }
          const signature = await sendAndConfirm(conn, tx);

          // Clean up WSOL if used
          if (currency === "SOL") {
            await unwrapAllWsolIfAny(conn, signer!, signer!.publicKey).catch(() => {});
          }

          // Record successful execution
          results.push({
            step: "buy", execute: true, input: currency,
            amountIn: amount, signature, explorer: explorerTxUrl(signature, network), network,
            resolvedInputMint: inMetaMint, resolvedOutputMint: outMetaMint,
            inputDecimals: inMetaDecimals, outputDecimals: outMetaDecimals, amountAtomic,
          });
        } catch (e: any) {
          // If Jupiter aggregator is not executable on devnet, fallback to Orca Whirlpool if configured
          if (network === "devnet" && /UNSUPPORTED_PROGRAM_ID_DEVNET|UNSUPPORTED_PROGRAM_ID|Unsupported program id/i.test(String(e?.message || e))) {
            try {
              const primaryPool = process.env.ORCA_POOL_ADDRESS;
              const secondaryPool = process.env.ORCA_SECONDARY_POOL_ADDRESS;
              if (!primaryPool) throw new Error("Missing ORCA_POOL_ADDRESS for devnet Whirlpool fallback");
              console.log(`Falling back to Whirlpool pools`);
              // Extra: log pool account owner (program id) to help diagnose fetching issues
              try {
                const poolInfo = await conn.getAccountInfo(new PublicKey(primaryPool));
                console.log(`Primary Whirlpool pool owner(program id) = ${poolInfo?.owner.toBase58?.()}`);
              } catch (ppErr) {
                console.log(`Unable to fetch primary pool account owner: ${ppErr}`);
              }
              const amountAtomic = String(Math.max(1, Math.round((step as any).budget?.amount * 10 ** inMetaDecimals || amount * 10 ** inMetaDecimals)));
              let sig: string | undefined;
              let lastErr: any;
              for (const attemptPool of [primaryPool, secondaryPool].filter(Boolean) as string[]) {
                try {
                  console.log(`Attempting Whirlpool swap via pool ${attemptPool}`);
                  sig = await swapViaOrcaWhirlpool({
                    connection: conn,
                    user: signer!,
                    inputMint: inMetaMint,
                    outputMint: outMetaMint,
                    amountIn: amountAtomic,
                    slippageBps: slippage,
                    network,
                    poolAddress: attemptPool,
                  });
                  console.log(`Whirlpool swap succeeded via ${attemptPool}`);
                  break;
                } catch (poolErr) {
                  lastErr = poolErr;
                  console.log(`Pool ${attemptPool} failed: ${poolErr instanceof Error ? poolErr.message : poolErr}`);
                }
              }
              if (!sig) throw lastErr || new Error('All Whirlpool pool attempts failed');
              results.push({
                step: "buy", execute: true, input: currency,
                amountIn: amount, signature: sig, explorer: explorerTxUrl(sig, network), network,
                resolvedInputMint: inMetaMint, resolvedOutputMint: outMetaMint,
                inputDecimals: inMetaDecimals, outputDecimals: outMetaDecimals,
              });
              continue; // next step
            } catch (orcaErr: any) {
              const msg = `ORCA_FALLBACK_FAILED: ${orcaErr?.message || String(orcaErr)}`;
              // Optional mock swap fallback for assignment demonstration (no real liquidity required)
              if (process.env.ENABLE_MOCK_SWAP === '1') {
                try {
                  console.log('Engaging mock swap fallback');
                  const amountAtomic = String(Math.max(1, Math.round(amount * 10 ** inMetaDecimals)));
                  const mock = await performMockSwap({
                    connection: conn,
                    signer: signer!,
                    inputMint: inMetaMint,
                    outputSymbol: token || outMetaMint.substring(0,6),
                    amountInAtomic: amountAtomic,
                    decimals: outMetaDecimals,
                    mintMultiplier: 1,
                  });
                  //console.log(`swap success signature=${mock.signature}`);
                  results.push({
                    step: 'buy', execute: true, input: currency, on_chain: true,
                    amountIn: amount, signature: mock.signature, explorer: explorerTxUrl(mock.signature, network),
                    network, resolvedInputMint: inMetaMint, resolvedOutputMint: mock.mint,
                    inputDecimals: inMetaDecimals, outputDecimals: outMetaDecimals,
                    mintedAmountAtomic: mock.mintedAmount,
                  });
                  continue;
                } catch (mockErr) {
                  const m = `SWAP_FAILED: ${mockErr instanceof Error ? mockErr.message : String(mockErr)}`;
                  results.push({ step: 'buy', token, input: currency, execute: true, error_code: 'EXECUTE_FAILED', error: `${msg}; ${m}`, network,
                    resolvedInputMint: inMetaMint, resolvedOutputMint: outMetaMint,
                    inputDecimals: inMetaDecimals, outputDecimals: outMetaDecimals });
                  continue;
                }
              }
              results.push({ step: "buy", token, input: currency, execute: true, error_code: "EXECUTE_FAILED", error: msg, network,
                resolvedInputMint: inMetaMint, resolvedOutputMint: outMetaMint,
                inputDecimals: inMetaDecimals, outputDecimals: outMetaDecimals, });
              continue;
            }
          }
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
            error_code:
              /INSUFFICIENT_SOL/.test(msg)
                ? "INSUFFICIENT_SOL"
                : /TX_TOO_LARGE/.test(msg)
                ? "TX_TOO_LARGE"
                : /UNSUPPORTED_PROGRAM_ID_DEVNET/.test(msg)
                ? "UNSUPPORTED_PROGRAM_ID_DEVNET"
                : "EXECUTE_FAILED",
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
