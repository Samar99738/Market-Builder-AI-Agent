"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRegistry = getRegistry;
exports.resolveSymbolViaRegistry = resolveSymbolViaRegistry;
const cross_fetch_1 = __importDefault(require("cross-fetch"));
// Simple in-memory cache to avoid fetching registry repeatedly
let cache = null;
// Fetch token registry for a given Solana cluster (devnet/mainnet)
async function getRegistry(network) {
    // Return from cache if already loaded for this cluster
    if (cache?.cluster === network)
        return { bySymbol: cache.bySymbol };
    // Pick registry URL based on network
    const url = network === "devnet"
        ? "https://token.jup.ag/strict?cluster=devnet"
        : "https://token.jup.ag/strict?cluster=mainnet";
    // Fetch registry data
    const res = await (0, cross_fetch_1.default)(url);
    if (!res.ok)
        throw new Error(`Failed to load token registry (${network}): ${res.status}`);
    // Convert list into a symbol → token lookup
    const list = (await res.json());
    const bySymbol = {};
    for (const t of list) {
        if (t.symbol)
            bySymbol[(t.symbol || "").toUpperCase()] = t;
    }
    // Cache results for reuse
    cache = { cluster: network, bySymbol };
    return { bySymbol };
}
// Resolve a token symbol to its mint address + decimals via registry
async function resolveSymbolViaRegistry(symbol, network) {
    if (!symbol)
        return undefined;
    try {
        const reg = await getRegistry(network);
        const t = reg.bySymbol[(symbol || "").toUpperCase()];
        if (!t)
            return undefined;
        return { mint: t.address, decimals: t.decimals };
    }
    catch {
        return undefined;
    }
}
