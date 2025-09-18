"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.symbolToMeta = symbolToMeta;
exports.looksLikeMint = looksLikeMint;
// Registry of supported tokens with their mint addresses and decimal precision
const registry = {
    USDC: { mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", decimals: 6 },
    SOL: { mint: "So11111111111111111111111111111111111111112", decimals: 9 },
};
// Get token metadata from its symbol (case-insensitive)
function symbolToMeta(sym) {
    if (!sym)
        return undefined;
    return registry[sym.toUpperCase()];
}
// Check if a string looks like a valid Solana mint address (base58 + length ≥ 32)
function looksLikeMint(s) {
    return !!(typeof s === "string" &&
        /^[1-9A-HJ-NP-Za-km-z]+$/.test(s) &&
        s.length >= 32);
}
