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
async function buildSwapTransaction({ connection, user, quoteResponse, wrapAndUnwrapSol = true, }) {
    const url = "https://quote-api.jup.ag/v6/swap";
    const payload = {
        quoteResponse,
        userPublicKey: user.publicKey.toBase58(),
        wrapAndUnwrapSol: !!wrapAndUnwrapSol,
        asLegacyTransaction: true, // avoid ALT flakiness
        dynamicComputeUnitLimit: false,
        dynamicSlippage: false,
        prioritizationFeeLamports: "auto",
        onlyDirectRoutes: true,
        maxAccounts: 16,
    };
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
    const json = await res.json();
    const txb64 = json?.swapTransaction;
    if (!txb64)
        throw new Error("Missing swapTransaction in Jupiter response");
    const buf = Buffer.from(txb64, "base64");
    const tx = web3_js_1.VersionedTransaction.deserialize(buf);
    // First sign; will re-sign after refreshing blockhash if needed
    tx.sign([user]);
    return tx;
}
// Refresh recent blockhash for legacy/v0 transactions
async function refreshRecentBlockhash(connection, tx) {
    const { blockhash } = await connection.getLatestBlockhash("confirmed");
    tx.message.recentBlockhash = blockhash;
    return tx;
}
async function sendAndConfirm(connection, tx) {
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
function loadKeypairFromBase58(secret) {
    const bytes = bs58_1.default.decode(secret);
    return web3_js_1.Keypair.fromSecretKey(bytes);
}
//# sourceMappingURL=swap.js.map