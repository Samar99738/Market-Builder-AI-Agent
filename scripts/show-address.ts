import "dotenv/config";
import bs58 from "bs58";
import { Keypair } from "@solana/web3.js";

// Main function to read private key from environment and display its public key
function main() {
  // Get private key from environment variable
  const secret = process.env.FOLLOWER_PRIVATE_KEY_BASE58 || "";
  if (!secret) {
    // Exit if private key is not provided
    console.error("Error: FOLLOWER_PRIVATE_KEY_BASE58 is not set in environment.");
    process.exit(1);
  }
  try {
    // Decode private key from base58 and create Solana Keypair
    const kp = Keypair.fromSecretKey(bs58.decode(secret));
    // Print corresponding public address
    console.log("Execution wallet public address:");
    console.log(kp.publicKey.toBase58());
  } catch (e: any) {
    // Handle decoding errors
    console.error("Failed to decode FOLLOWER_PRIVATE_KEY_BASE58:", e?.message || String(e));
    process.exit(1);
  }
}

// Run the main function
main();
