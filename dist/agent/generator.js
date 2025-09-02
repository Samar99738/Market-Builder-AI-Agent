"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateExecutable = generateExecutable;
const functions_1 = require("../runtime/functions");
const jupiter_1 = require("../runtime/jupiter");
const solana_1 = require("../runtime/solana");
const swap_1 = require("../runtime/swap");
function requireExecuteSecrets(network) {
    if (process.env.EXECUTE_STRICT !== "1") {
        throw new Error("Execution disabled: set EXECUTE_STRICT=1 to allow on-chain swaps");
    }
    const key = process.env.FOLLOWER_PRIVATE_KEY_BASE58;
    if (!key) {
        throw new Error("Missing FOLLOWER_PRIVATE_KEY_BASE58 for execute mode");
    }
    if (network === "mainnet" && process.env.ALLOW_MAINNET !== "1") {
        throw new Error("Mainnet execute blocked. Set ALLOW_MAINNET=1 to enable at your own risk.");
    }
    return key;
}
function generateExecutable(spec, opts) {
    const network = opts?.network ?? "devnet";
    const slippage = opts?.slippageBps ?? 50;
    const doExecute = !!opts?.execute;
    // Optional: small safety caps; override per ENV if desired.
    const MAX_USDC_PER_TRADE = Number(process.env.MAX_USDC_PER_TRADE || (network === "mainnet" ? 50 : 5));
    const MAX_SOL_PER_TRADE = Number(process.env.MAX_SOL_PER_TRADE || (network === "mainnet" ? 0.5 : 0.1));
    return async function run() {
        const results = [];
        const conn = (0, solana_1.getConnection)(network);
        let signer;
        if (doExecute) {
            const secret = requireExecuteSecrets(network);
            signer = (0, swap_1.loadKeypairFromBase58)(secret);
        }
        for (const step of spec.steps) {
            if (step.type === "buy") {
                const token = step.token;
                const amount = step.budget?.amount ?? step.amount ?? 0;
                const currency = (step.budget?.currency ?? "USDC");
                if (!token || !amount || typeof amount !== "number" || amount <= 0) {
                    results.push({ step: "buy", skipped: true, reason: "missing token or amount" });
                    continue;
                }
                // Safety: enforce basic notional limits
                if (currency === "USDC" && amount > MAX_USDC_PER_TRADE) {
                    results.push({
                        step: "buy",
                        skipped: true,
                        reason: `amount exceeds limit: ${amount}USDC > ${MAX_USDC_PER_TRADE}USDC`,
                    });
                    continue;
                }
                if (currency === "SOL" && amount > MAX_SOL_PER_TRADE) {
                    results.push({
                        step: "buy",
                        skipped: true,
                        reason: `amount exceeds limit: ${amount}SOL > ${MAX_SOL_PER_TRADE}SOL`,
                    });
                    continue;
                }
                if (!doExecute) {
                    // SIMULATE (quote)
                    try {
                        const quote = await (0, functions_1.getQuoteSummary)(currency, token, amount, slippage, network);
                        results.push({
                            step: "buy",
                            token,
                            simulate: true,
                            amount,
                            input: currency,
                            quote,
                        });
                    }
                    catch (e) {
                        const msg = e instanceof Error ? e.message : String(e);
                        results.push({
                            step: "buy",
                            token,
                            input: currency,
                            error_code: "QUOTE_FAILED",
                            error: msg,
                        });
                    }
                    continue;
                }
                // EXECUTE
                try {
                    const inMeta = (0, functions_1.inputMintForCurrency)(currency, network);
                    const outMeta = await (0, functions_1.resolveTokenMeta)(token, network);
                    const amountAtomic = String(Math.max(1, Math.round(amount * 10 ** inMeta.decimals)));
                    const bestRoute = await (0, jupiter_1.getBestRoute)({
                        inputMint: inMeta.mint,
                        outputMint: outMeta.mint,
                        amount: amountAtomic,
                        slippageBps: slippage,
                    });
                    let tx = await (0, swap_1.buildSwapTransaction)({
                        connection: conn,
                        user: signer,
                        quoteResponse: bestRoute,
                        wrapAndUnwrapSol: true,
                    });
                    tx = await (0, swap_1.refreshRecentBlockhash)(conn, tx);
                    tx.sign([signer]);
                    const signature = await (0, swap_1.sendAndConfirm)(conn, tx);
                    results.push({
                        step: "buy",
                        token,
                        execute: true,
                        input: currency,
                        amountIn: amount,
                        signature,
                        network,
                    });
                }
                catch (e) {
                    const msg = e instanceof Error ? e.message : String(e);
                    results.push({
                        step: "buy",
                        token,
                        input: currency,
                        execute: true,
                        error_code: "EXECUTE_FAILED",
                        error: msg,
                    });
                }
            }
            else if (step.type === "wait") {
                results.push({
                    step: "wait",
                    every: step.every,
                    unit: step.unit,
                    simulate: !doExecute,
                });
            }
            else {
                results.push({
                    step: step.type,
                    skipped: true,
                    reason: "unsupported step type in MVP",
                });
            }
        }
        return results;
    };
}
//# sourceMappingURL=generator.js.map