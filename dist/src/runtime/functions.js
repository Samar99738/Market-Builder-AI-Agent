"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMarketCap = getMarketCap;
exports.localSymbolToMeta = localSymbolToMeta;
exports.inputMintForCurrency = inputMintForCurrency;
exports.resolveTokenMeta = resolveTokenMeta;
exports.getQuoteSummary = getQuoteSummary;
const node_fetch_1 = __importDefault(require("node-fetch"));
const web3_js_1 = require("@solana/web3.js");
const spl_token_1 = require("@solana/spl-token");
const jupiter_1 = require("./jupiter");
const tokenRegistry_1 = require("./tokenRegistry");
/**
 * Fetches real-time market cap for a token symbol and quote (e.g., 'JUP', 'USDC')
 * Returns marketCap in USD if available, else null
 */
async function getMarketCap(symbol, quote = "USDC") {
    try {
        const url = `https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(symbol)}/${encodeURIComponent(quote)}`;
        const resp = await (0, node_fetch_1.default)(url);
        if (!resp.ok)
            throw new Error(`Dexscreener API error: ${resp.status}`);
        const data = await resp.json();
        // Find the first pair with a marketCap field
        const pair = Array.isArray(data.pairs) ? data.pairs.find(p => typeof p.marketCap === "number") : null;
        return pair?.marketCap ?? null;
    }
    catch (err) {
        console.error("[getMarketCap]", err);
        return null;
    }
}
// Helper: returns a Solana RPC connection for the given network
function getConn(network) {
    const endpoint = network === "mainnet"
        ? process.env.SOLANA_MAINNET_RPC_URL || (0, web3_js_1.clusterApiUrl)("mainnet-beta")
        : process.env.SOLANA_DEVNET_RPC_URL || (0, web3_js_1.clusterApiUrl)("devnet");
    return new web3_js_1.Connection(endpoint, "confirmed");
}
// Helper: checks if a string looks like a valid mint address
function looksLikeMint(s) {
    try {
        const pk = new web3_js_1.PublicKey(s);
        return pk.toBase58() === s;
    }
    catch {
        return false;
    }
}
// Local fallback mapping for common tokens (SOL, USDC)
// Used when registry lookup fails or isn’t available
function localSymbolToMeta(symbol, network) {
    const sym = (symbol || "").toUpperCase();
    if (sym === "SOL") {
        return { symbol: "SOL", mint: "So11111111111111111111111111111111111111112", decimals: 9 };
    }
    if (sym === "USDC") {
        if (network === "mainnet") {
            return {
                symbol: "USDC",
                mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
                decimals: 6,
            };
        }
        // Devnet fallback
        return {
            symbol: "USDC",
            mint: "Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr",
            decimals: 6,
        };
    }
    if (sym === "JUP") {
        if (network === "mainnet") {
            return {
                symbol: "JUP",
                mint: "JUPy4wrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",
                decimals: 6,
            };
        }
        // Devnet fallback (Jupiter devnet mint)
        return {
            symbol: "JUP",
            mint: "JUPy4wrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",
            decimals: 6,
        };
    }
    return null;
}
// Fetch decimals for a token mint directly from chain
async function getDecimalsForMint(mint, network) {
    const conn = getConn(network);
    const mi = await (0, spl_token_1.getMint)(conn, new web3_js_1.PublicKey(mint));
    return mi.decimals;
}
// Ensure the mint exists on the cluster and return its decimals. Throws if not found.
async function verifyMintOnCluster(mint, network) {
    const conn = getConn(network);
    const info = await conn.getAccountInfo(new web3_js_1.PublicKey(mint));
    if (!info) {
        throw new Error(`Mint not found on ${network}: ${mint}`);
    }
    // Owner must be either SPL Token or Token-2022 program
    const owner = info.owner.toBase58();
    const okOwner = owner === spl_token_1.TOKEN_PROGRAM_ID.toBase58() || owner === spl_token_1.TOKEN_2022_PROGRAM_ID.toBase58();
    if (!okOwner) {
        throw new Error(`Invalid mint owner (${owner}) for ${mint} on ${network}`);
    }
    // getMint also validates account layout and returns decimals
    const mi = await (0, spl_token_1.getMint)(conn, new web3_js_1.PublicKey(mint));
    return mi.decimals;
}
// Registry wrapper: attempts to resolve symbol via external token registry
// Returns null if not found or registry call fails
async function resolveViaRegistry(symbol, network) {
    try {
        const reg = await (0, tokenRegistry_1.resolveSymbolViaRegistry)(symbol, network);
        if (!reg)
            return null;
        return { symbol: symbol.toUpperCase(), mint: reg.mint, decimals: reg.decimals };
    }
    catch {
        return null;
    }
}
// Exported: helper to resolve input mint for a given currency (SOL or USDC)
function inputMintForCurrency(currency, network) {
    if (currency === "SOL") {
        return { mint: "So11111111111111111111111111111111111111112", decimals: 9 };
    }
    // USDC resolution for mainnet/devnet
    if (network === "mainnet") {
        return { mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", decimals: 6 };
    }
    return { mint: "Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr", decimals: 6 };
}
// Exported: resolves metadata (symbol, mint, decimals) for a given token
// Resolution order: literal mint → registry lookup → local fallback
async function resolveTokenMeta(token, network) {
    // 1) If token is a literal mint address, fetch decimals from chain
    if (looksLikeMint(token)) {
        const decimals = await getDecimalsForMint(token, network);
        return { symbol: token, mint: token, decimals };
    }
    const sym = token.toUpperCase().trim();
    // 2) Try registry lookup
    const reg = await resolveViaRegistry(sym, network);
    if (reg) {
        // Guard against using mainnet USDC on devnet
        if (network === "devnet" &&
            sym === "USDC" &&
            reg.mint === "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v") {
            throw new Error("USDC maps to mainnet mint on devnet; use the devnet USDC test mint (Gh9Z...) or switch to mainnet.");
        }
        // Guard: block mainnet-only mints on devnet
        if (network === "devnet" &&
            reg.mint &&
            (
            // Mainnet RAY mint
            (sym === "RAY" && reg.mint === "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R") ||
                // Add more mainnet-only mints here as needed
                false)) {
            throw new Error(`network-mismatch mint: ${sym} is not available on devnet. Use a devnet-listed token or switch to mainnet.`);
        }
        // Verify mint exists on this cluster and fetch authoritative decimals from chain
        const decimals = await verifyMintOnCluster(reg.mint, network);
        return { symbol: sym, mint: reg.mint, decimals };
    }
    // 3) Local fallback for core tokens
    const local = localSymbolToMeta(sym, network);
    if (local) {
        // Verify local fallback mint exists and fetch authoritative decimals
        const decimals = await verifyMintOnCluster(local.mint, network);
        return { symbol: sym, mint: local.mint, decimals };
    }
    // Throw explicit error if symbol isn’t found for given network
    if (network === "devnet") {
        throw new Error(`Unknown token symbol or not listed on devnet: ${sym}. Try a devnet-listed symbol, switch to mainnet, or use a mint address.`);
    }
    throw new Error(`Unknown token symbol or mint: ${sym}`);
}
// Exported: fetches swap quote summary using Jupiter
// Returns route count, output amounts (atomic & human-readable), and decimals
async function getQuoteSummary(currency, token, amount, slippageBps, network) {
    const inMeta = inputMintForCurrency(currency, network);
    const outMeta = await resolveTokenMeta(token, network);
    const amountAtomic = String(Math.max(1, Math.round(amount * 10 ** inMeta.decimals)));
    // Get best swap route from Jupiter
    const route = await (0, jupiter_1.getBestRoute)({
        inputMint: inMeta.mint,
        outputMint: outMeta.mint,
        amount: amountAtomic,
        slippageBps,
        environment: network === "mainnet" ? "mainnet-beta" : "devnet",
    });
    // Extract output amount (different Jupiter versions may store it in different fields)
    const outAmountAtomic = String(route?.outAmount ??
        route?.outAmountWithSlippage ??
        route?.otherAmountThreshold ??
        "0");
    const outDecimals = outMeta.decimals ?? 6;
    const outAmountHuman = Number(outAmountAtomic) / 10 ** outDecimals;
    return {
        routeCount: Array.isArray(route?.routes) ? route.routes.length : 1,
        outAmountAtomic,
        outDecimals,
        outAmountHuman,
    };
}
