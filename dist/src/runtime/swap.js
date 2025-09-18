"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildSwapTransaction = buildSwapTransaction;
exports.refreshRecentBlockhash = refreshRecentBlockhash;
exports.sendAndConfirm = sendAndConfirm;
exports.loadKeypairFromBase58 = loadKeypairFromBase58;
const web3_js_1 = require("@solana/web3.js");
const bs58_1 = __importDefault(require("bs58"));
const cross_fetch_1 = __importDefault(require("cross-fetch"));
const retry_1 = require("./retry");
// Build a swap transaction using Jupiter's Swap API and sign it with the user's keypair
async function buildSwapTransaction({ connection, user, quoteResponse, wrapAndUnwrapSol = true, environment, }) {
    const url = "https://quote-api.jup.ag/v6/swap";
    // Payload for Jupiter swap transaction with preferences for reliability on devnet
    const payload = {
        quoteResponse,
        userPublicKey: user.publicKey.toBase58(),
        // Let Jupiter handle SOL wrapping inside the swap when needed
        wrapAndUnwrapSol: true,
        asLegacyTransaction: true,
        dynamicComputeUnitLimit: false,
        dynamicSlippage: false,
        prioritizationFeeLamports: "auto",
        maxAccounts: 22,
        useTokenLedger: false,
    };
    if (environment)
        payload.environment = environment;
    // Send request to Jupiter API with retry logic
    const res = await (0, retry_1.withRetry)(async () => {
        const r = await (0, cross_fetch_1.default)(url, {
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
    const txb64 = json?.swapTransaction;
    if (!txb64)
        throw new Error("Missing swapTransaction in Jupiter response");
    const buf = Buffer.from(txb64, "base64");
    const tx = web3_js_1.VersionedTransaction.deserialize(buf);
    // Sign transaction with user's keypair
    tx.sign([user]);
    return tx;
}
// Refresh a transaction with the latest blockhash before resending
async function refreshRecentBlockhash(connection, tx) {
    const { blockhash } = await connection.getLatestBlockhash("confirmed");
    tx.message.recentBlockhash = blockhash;
    return tx;
}
// Send a transaction to the network and confirm it; includes error handling for oversized transactions
async function sendAndConfirm(connection, tx) {
    try {
        const sig = await (0, retry_1.withRetry)(() => connection.sendTransaction(tx, {
            maxRetries: 6,
            preflightCommitment: "confirmed",
            skipPreflight: false,
        }));
        const conf = await connection.confirmTransaction(sig, "confirmed");
        if (conf?.value?.err) {
            throw new Error(`Transaction failed: ${JSON.stringify(conf.value.err)}`);
        }
        return sig;
    }
    catch (e) {
        const msg = String(e?.message || e);
        if (/too large/i.test(msg) || /max.*encoded\/raw/i.test(msg)) {
            throw new Error("TX_TOO_LARGE: Route produced an oversized transaction. Try a smaller amount or a token with a direct SOL route on devnet.");
        }
        if (/Unsupported program id/i.test(msg) || /Program .* is not supported/i.test(msg)) {
            throw new Error("UNSUPPORTED_PROGRAM_ID_DEVNET: The built route includes a program not executable on devnet (often the Jupiter aggregator). Use simulation mode on devnet, switch to mainnet (set ALLOW_MAINNET=1), or implement a direct AMM swap (e.g., Orca Whirlpool) instead.");
        }
        throw e;
    }
}
// Load a Solana Keypair from a Base58-encoded secret key
function loadKeypairFromBase58(secret) {
    const bytes = bs58_1.default.decode(secret);
    return web3_js_1.Keypair.fromSecretKey(bytes);
}
