import {
  WhirlpoolContext,
  ORCA_WHIRLPOOL_PROGRAM_ID,
  ORCA_WHIRLPOOLS_CONFIG,
  buildWhirlpoolClient,
  PDAUtil,
  WhirlpoolIx,
  IGNORE_CACHE,
  swapQuoteByInputToken,
} from "@orca-so/whirlpools-sdk";
import { Connection, Keypair, PublicKey, TransactionMessage, VersionedTransaction, TransactionInstruction } from "@solana/web3.js";
import BN from "bn.js";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { Wallet } from "@coral-xyz/anchor";
import { Percentage } from "@orca-so/common-sdk";

export type WhirlpoolSwapArgs = {
  connection: Connection;
  user: Keypair;
  inputMint: string;
  outputMint: string;
  amountIn: string; // atomic units
  slippageBps?: number;
  network: "devnet" | "mainnet";
  poolAddress: string; // known Whirlpool pool address
};

class KeypairWallet implements Wallet {
  constructor(public payer: Keypair) {}
  get publicKey() { return this.payer.publicKey; }
  async signTransaction(tx: any) { tx.sign([this.payer]); return tx; }
  async signAllTransactions(txs: any[]) { txs.forEach(t => t.sign([this.payer])); return txs; }
}

export async function swapViaOrcaWhirlpool({
  connection,
  user,
  inputMint,
  outputMint,
  amountIn,
  slippageBps = 100,
  network,
  poolAddress,
}: WhirlpoolSwapArgs): Promise<string> {
  // Allow override via env (useful for devnet where program id can differ)
  const overrideProgram = process.env.ORCA_WHIRLPOOL_PROGRAM_ID;
  let programId = new PublicKey(overrideProgram || ORCA_WHIRLPOOL_PROGRAM_ID);
  // Config (global) account – must exist or no pools can be fetched. Allow override.
  const overrideConfig = process.env.ORCA_WHIRLPOOLS_CONFIG;
  const configPk = new PublicKey(overrideConfig || ORCA_WHIRLPOOLS_CONFIG);
  const wallet = new KeypairWallet(user);

  // Verify global config exists (helps diagnose missing devnet deployment)
  const cfgInfo = await connection.getAccountInfo(configPk);
  if (!cfgInfo) {
    throw new Error(
      `WHIRLPOOL_CONFIG_MISSING: Global config ${configPk.toBase58()} not found on ${network}. ` +
      `No Whirlpool pools are available. Provide valid ORCA_WHIRLPOOLS_CONFIG & ORCA_WHIRLPOOL_PROGRAM_ID env values ` +
      `for this cluster, or switch network (e.g. mainnet) / disable Whirlpool fallback.`
    );
  }
  if (!cfgInfo.executable && cfgInfo.data.length === 0) {
    // Extremely unlikely, but indicates placeholder
    throw new Error(`WHIRLPOOL_CONFIG_INVALID: Config account ${configPk.toBase58()} has no data on ${network}.`);
  }

  // Optional: auto-detect program id from pool account owner if mismatch
  const poolPk = new PublicKey(poolAddress);
  const poolAcct = await connection.getAccountInfo(poolPk);
  if (!poolAcct) {
    throw new Error(`Whirlpool pool account not found on ${network}: ${poolAddress}`);
  }
  const actualOwner = poolAcct.owner;
  if (!actualOwner.equals(programId)) {
    // Rebuild context with detected owner (most likely correct program id for this pool)
    programId = actualOwner;
  }

  let ctx = WhirlpoolContext.from(connection, wallet, programId);
  let client = buildWhirlpoolClient(ctx);

  let whirlpool;
  try {
    whirlpool = await client.getPool(poolPk, IGNORE_CACHE);
  } catch (e: any) {
    // Provide richer diagnostics and retry once if we haven't tried the detected owner yet
    const diag = `Failed to fetch Whirlpool. UsedProgram=${programId.toBase58()} PoolOwner=${actualOwner.toBase58()} Err=${e?.message || e}`;
    throw new Error(`Unable to fetch Whirlpool at address ${poolAddress}. ${diag}`);
  }

  // Prepare ATA accounts
  const owner = user.publicKey;
  const inAta = getAssociatedTokenAddressSync(new PublicKey(inputMint), owner, false);
  const outAta = getAssociatedTokenAddressSync(new PublicKey(outputMint), owner, false);

  const isAInput = inputMint === whirlpool.getTokenAInfo().mint.toBase58();
  const amount = new BN(amountIn);
  const quote = await swapQuoteByInputToken(
    whirlpool,
    amount,
    isAInput,
    Percentage.fromFraction(slippageBps, 10_000),
    ctx.program.programId,
    ctx.fetcher,
    IGNORE_CACHE,
  );
  const rawIx: any = WhirlpoolIx.swapIx(ctx.program, {
    amount: quote.amount,
    otherAmountThreshold: quote.otherAmountThreshold,
    sqrtPriceLimit: quote.sqrtPriceLimit,
    amountSpecifiedIsInput: true,
    aToB: isAInput,
    whirlpool: whirlpool.getAddress(),
    tokenAuthority: owner,
    tokenOwnerAccountA: inAta,
    tokenOwnerAccountB: outAta,
    tokenVaultA: whirlpool.getTokenVaultAInfo().address,
    tokenVaultB: whirlpool.getTokenVaultBInfo().address,
    tickArray0: quote.tickArray0,
    tickArray1: quote.tickArray1,
    tickArray2: quote.tickArray2,
    oracle: PDAUtil.getOracle(programId, whirlpool.getAddress()).publicKey,
  });
  const ixs: TransactionInstruction[] = (rawIx as any).instructions ?? [rawIx as any];

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
  const msg = new TransactionMessage({
    payerKey: owner,
    recentBlockhash: blockhash,
  instructions: ixs,
  }).compileToV0Message();
  const tx = new VersionedTransaction(msg);
  tx.sign([user]);

  const sig = await connection.sendTransaction(tx, { maxRetries: 6 });
  const conf = await connection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight }, "confirmed");
  if (conf.value.err) throw new Error(`ORCA_SWAP_FAILED: ${JSON.stringify(conf.value.err)}`);
  return sig;
}
