"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConnection = getConnection;
exports.ensureDevnetFunds = ensureDevnetFunds;
exports.getBalance = getBalance;
const web3_js_1 = require("@solana/web3.js");
let mainnetConn = null;
let devnetConn = null;
function getConnection(network) {
    if (network === "mainnet") {
        if (!mainnetConn) {
            const url = process.env.SOLANA_MAINNET_RPC_URL ||
                (0, web3_js_1.clusterApiUrl)("mainnet-beta", process.env.SOLANA_COMMITMENT);
            mainnetConn = new web3_js_1.Connection(url, {
                commitment: process.env.SOLANA_COMMITMENT || "confirmed",
            });
        }
        return mainnetConn;
    }
    if (!devnetConn) {
        const url = process.env.SOLANA_DEVNET_RPC_URL ||
            (0, web3_js_1.clusterApiUrl)("devnet", process.env.SOLANA_COMMITMENT);
        devnetConn = new web3_js_1.Connection(url, {
            commitment: process.env.SOLANA_COMMITMENT || "confirmed",
        });
    }
    return devnetConn;
}
// ensure wallet has minimal funds on devnet (helper)
async function ensureDevnetFunds(conn, kp, minSol = 0.05) {
    const balance = await conn.getBalance(kp.publicKey);
    if (balance >= minSol * web3_js_1.LAMPORTS_PER_SOL)
        return;
    const need = Math.max(1 * web3_js_1.LAMPORTS_PER_SOL - balance, 0.5 * web3_js_1.LAMPORTS_PER_SOL);
    const sig = await conn.requestAirdrop(kp.publicKey, Math.ceil(need));
    await conn.confirmTransaction(sig, "confirmed");
}
async function getBalance(conn, pubkey) {
    return conn.getBalance(pubkey);
}
//# sourceMappingURL=solana.js.map