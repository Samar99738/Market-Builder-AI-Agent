"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const bs58_1 = __importDefault(require("bs58"));
const web3_js_1 = require("@solana/web3.js");
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
        const kp = web3_js_1.Keypair.fromSecretKey(bs58_1.default.decode(secret));
        // Print corresponding public address
        console.log("Execution wallet public address:");
        console.log(kp.publicKey.toBase58());
    }
    catch (e) {
        // Handle decoding errors
        console.error("Failed to decode FOLLOWER_PRIVATE_KEY_BASE58:", e?.message || String(e));
        process.exit(1);
    }
}
// Run the main function
main();
