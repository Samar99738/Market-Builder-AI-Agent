import { Keypair } from "@solana/web3.js";
import bs58 from "bs58";

// Load a Solana wallet from the environment variable (base58 encoded private key)
export function loadWallet(): Keypair {
  // Get private key string from environment
  const secret = process.env.FOLLOWER_PRIVATE_KEY_BASE58;
  if (!secret) {
    // Throw error if key is missing
    throw new Error("FOLLOWER_PRIVATE_KEY_BASE58 is missing in .env");
  }
  // Decode base58 private key and return as a Solana Keypair
  return Keypair.fromSecretKey(bs58.decode(secret));
}
