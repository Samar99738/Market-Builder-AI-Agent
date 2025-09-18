"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadWallet = loadWallet;
const web3_js_1 = require("@solana/web3.js");
const bs58_1 = __importDefault(require("bs58"));
// Load a Solana wallet from the environment variable (base58 encoded private key)
function loadWallet() {
    // Get private key string from environment
    const secret = process.env.FOLLOWER_PRIVATE_KEY_BASE58;
    if (!secret) {
        // Throw error if key is missing
        throw new Error("FOLLOWER_PRIVATE_KEY_BASE58 is missing in .env");
    }
    // Decode base58 private key and return as a Solana Keypair
    return web3_js_1.Keypair.fromSecretKey(bs58_1.default.decode(secret));
}
