"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.USDC_DEVNET = exports.USDC_MAINNET = exports.SOL_DECIMALS = exports.SOL_MINT = void 0;
exports.inputMintForCurrency = inputMintForCurrency;
exports.resolveTokenMeta = resolveTokenMeta;
exports.getQuoteSummary = getQuoteSummary;
const web3_js_1 = require("@solana/web3.js");
const spl_token_1 = require("@solana/spl-token");
const tokenmap_1 = require("./tokenmap");
const tokenRegistry_1 = require("./tokenRegistry");
const jupiter_1 = require("./jupiter");
const solana_1 = require("./solana");
const retry_1 = require("./retry");
exports.SOL_MINT = "So11111111111111111111111111111111111111112";
exports.SOL_DECIMALS = 9;
exports.USDC_MAINNET = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
exports.USDC_DEVNET = "Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr";
function inputMintForCurrency(currency, network) {
    if (currency === "SOL")
        return { mint: exports.SOL_MINT, decimals: exports.SOL_DECIMALS };
    return { mint: network === "mainnet" ? exports.USDC_MAINNET : exports.USDC_DEVNET, decimals: 6 };
}
// Cache mint decimals per run
const perRunMintCache = new Map();
async function resolveTokenMeta(token, network = "devnet") {
    // If token looks like a mint, fetch decimals via on-chain
    if ((0, tokenmap_1.looksLikeMint)(token)) {
        const key = `${network}:${token}`;
        const cached = perRunMintCache.get(key);
        if (cached)
            return { mint: token, decimals: cached.decimals };
        const conn = (0, solana_1.getConnection)(network);
        const mintInfo = await (0, retry_1.withRetry)(() => (0, spl_token_1.getMint)(conn, new web3_js_1.PublicKey(token)));
        perRunMintCache.set(key, { decimals: mintInfo.decimals });
        return { mint: token, decimals: mintInfo.decimals };
    }
    // Try local symbol map
    const local = (0, tokenmap_1.symbolToMeta)(token);
    if (local)
        return local;
    // Try Jupiter token registry for the correct cluster
    const reg = await (0, tokenRegistry_1.resolveSymbolViaRegistry)(token, network);
    if (reg)
        return reg;
    throw new Error(`Unknown token symbol or mint: ${token}`);
}
async function getQuoteSummary(fromCurrencyOrMint, to, amount, slippageBps = 50, network = "devnet") {
    // Resolve input mint/decimals
    let fromMeta;
    if (fromCurrencyOrMint === "USDC" || fromCurrencyOrMint === "SOL") {
        fromMeta = inputMintForCurrency(fromCurrencyOrMint, network);
    }
    else {
        fromMeta = await resolveTokenMeta(fromCurrencyOrMint, network);
    }
    const toMeta = await resolveTokenMeta(to, network);
    const amountAtomic = Math.max(1, Math.round(amount * 10 ** fromMeta.decimals)).toString();
    const data = await (0, jupiter_1.getQuote)({
        inputMint: fromMeta.mint,
        outputMint: toMeta.mint,
        amount: amountAtomic,
        slippageBps,
    });
    const best = data?.data?.[0] ?? data?.data ?? data;
    const outAmountAtomic = String(best?.outAmount ?? "");
    if (!outAmountAtomic)
        throw new Error("No outAmount in quote");
    const outDecimals = toMeta.decimals;
    const outAmountHuman = Number(outAmountAtomic) / 10 ** outDecimals;
    return {
        routeCount: Array.isArray(data?.data) ? data.data.length : 1,
        outAmountAtomic,
        outDecimals,
        outAmountHuman,
    };
}
//# sourceMappingURL=functions.js.map