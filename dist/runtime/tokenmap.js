"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.symbolToMeta = symbolToMeta;
exports.looksLikeMint = looksLikeMint;
const registry = {
    USDC: { mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", decimals: 6 },
    SOL: { mint: "So11111111111111111111111111111111111111112", decimals: 9 },
};
function symbolToMeta(sym) {
    if (!sym)
        return undefined;
    return registry[sym.toUpperCase()];
}
function looksLikeMint(s) {
    return !!(typeof s === "string" &&
        /^[1-9A-HJ-NP-Za-km-z]+$/.test(s) &&
        s.length >= 32);
}
//# sourceMappingURL=tokenmap.js.map