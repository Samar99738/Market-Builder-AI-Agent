import { Connection, Keypair, VersionedTransaction } from "@solana/web3.js";
import bs58 from "bs58";
import fetch from "cross-fetch";
import { withRetry } from "./retry";

export type BuildSwapArgs = {
  connection: Connection;
  user: Keypair;
  quoteResponse: any; // Best route object from Jupiter quote API
  wrapAndUnwrapSol?: boolean;
};

// Build a swap transaction using Jupiter's Swap API and sign it with the user's keypair
export async function buildSwapTransaction({
  connection,
  user,
  quoteResponse,
  wrapAndUnwrapSol = true,
}: BuildSwapArgs): Promise<VersionedTransaction> {
  const url = "https://quote-api.jup.ag/v6/swap";

  // Payload for Jupiter swap transaction with preferences for reliability on devnet
  const payload = {
    quoteResponse,
    userPublicKey: user.publicKey.toBase58(),
    wrapAndUnwrapSol: !!wrapAndUnwrapSol,
    asLegacyTransaction: true,
    dynamicComputeUnitLimit: false,
    dynamicSlippage: false,
    prioritizationFeeLamports: "auto",
    maxAccounts: 22,
    useTokenLedger: false,
  };

  // Send request to Jupiter API with retry logic
  const res = await withRetry(async () => {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!r.ok) {
      const t = await r.text().catch(() => "");
      throw new Error(`Jupiter swap build error ${r.status}${t ? `: ${t}` : ""}`);
    }
    return r;
  });

  // Parse Jupiter response and build transaction
  const json = await res.json();
  const txb64: string = json?.swapTransaction;
  if (!txb64) throw new Error("Missing swapTransaction in Jupiter response");

  const buf = Buffer.from(txb64, "base64");
  const tx = VersionedTransaction.deserialize(buf);

  // Sign transaction with user's keypair
  tx.sign([user]);
  return tx;
}

// Refresh a transaction with the latest blockhash before resending
export async function refreshRecentBlockhash(
  connection: Connection,
  tx: VersionedTransaction
): Promise<VersionedTransaction> {
  const { blockhash } = await connection.getLatestBlockhash("confirmed");
  (tx.message as any).recentBlockhash = blockhash;
  return tx;
}

// Send a transaction to the network and confirm it; includes error handling for oversized transactions
export async function sendAndConfirm(connection: Connection, tx: VersionedTransaction): Promise<string> {
  try {
    const sig = await withRetry(() =>
      connection.sendTransaction(tx, {
        maxRetries: 6,
        preflightCommitment: "confirmed",
        skipPreflight: false,
      })
    );
    const conf = await connection.confirmTransaction(sig, "confirmed");
    if (conf?.value?.err) {
      throw new Error(`Transaction failed: ${JSON.stringify(conf.value.err)}`);
    }
    return sig;
  } catch (e: any) {
    const msg = String(e?.message || e);
    if (/too large/i.test(msg) || /max.*encoded\/raw/i.test(msg)) {
      throw new Error(
        "TX_TOO_LARGE: Route produced an oversized transaction. Try a smaller amount or a token with a direct SOL route on devnet."
      );
    }
    throw e;
  }
}

// Load a Solana Keypair from a Base58-encoded secret key
export function loadKeypairFromBase58(secret: string): Keypair {
  const bytes = bs58.decode(secret);
  return Keypair.fromSecretKey(bytes);
}
