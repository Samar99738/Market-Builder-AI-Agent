import { Connection, clusterApiUrl, LAMPORTS_PER_SOL, Keypair, PublicKey } from "@solana/web3.js";

let mainnetConn: Connection | null = null;
let devnetConn: Connection | null = null;

// get a cached or new connection to either devnet or mainnet
export function getConnection(network: "devnet" | "mainnet"): Connection {
  if (network === "mainnet") {
    if (!mainnetConn) {
      const url =
        process.env.SOLANA_MAINNET_RPC_URL ||
        clusterApiUrl("mainnet-beta", process.env.SOLANA_COMMITMENT as any);
      mainnetConn = new Connection(url, {
        commitment: (process.env.SOLANA_COMMITMENT as any) || "confirmed",
      });
    }
    return mainnetConn;
  }

  if (!devnetConn) {
    const url =
      process.env.SOLANA_DEVNET_RPC_URL ||
      clusterApiUrl("devnet", process.env.SOLANA_COMMITMENT as any);
    devnetConn = new Connection(url, {
      commitment: (process.env.SOLANA_COMMITMENT as any) || "confirmed",
    });
  }
  return devnetConn;
}

// check if devnet wallet has enough funds, if not request airdrop
export async function ensureDevnetFunds(conn: Connection, kp: Keypair, minSol = 0.05) {
  const balance = await conn.getBalance(kp.publicKey);
  if (balance >= minSol * LAMPORTS_PER_SOL) return;
  const need = Math.max(1 * LAMPORTS_PER_SOL - balance, 0.5 * LAMPORTS_PER_SOL);
  const sig = await conn.requestAirdrop(kp.publicKey, Math.ceil(need));
  await conn.confirmTransaction(sig, "confirmed");
}

// get wallet balance in lamports
export async function getBalance(conn: Connection, pubkey: PublicKey) {
  return conn.getBalance(pubkey);
}
