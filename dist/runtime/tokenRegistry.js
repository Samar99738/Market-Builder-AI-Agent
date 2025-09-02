"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRegistry = getRegistry;
exports.resolveSymbolViaRegistry = resolveSymbolViaRegistry;
const cross_fetch_1 = __importDefault(require("cross-fetch"));
let cache = null;
async function getRegistry(network) {
    if (cache?.cluster === network)
        return { bySymbol: cache.bySymbol };
    const url = network === "devnet"
        ? "https://token.jup.ag/strict?cluster=devnet"
        : "https://token.jup.ag/strict?cluster=mainnet";
    const res = await (0, cross_fetch_1.default)(url);
    if (!res.ok)
        throw new Error(`Failed to load token registry (${network}): ${res.status}`);
    const list = (await res.json());
    const bySymbol = {};
    for (const t of list) {
        if (t.symbol)
            bySymbol[(t.symbol || "").toUpperCase()] = t;
    }
    cache = { cluster: network, bySymbol };
    return { bySymbol };
}
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
//# sourceMappingURL=tokenRegistry.js.map