"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getQuote = getQuote;
exports.getBestRoute = getBestRoute;
const cross_fetch_1 = __importDefault(require("cross-fetch"));
const retry_1 = require("./retry");
async function getQuote(params) {
    const { inputMint, outputMint, amount, slippageBps = 50 } = params;
    const base = "https://quote-api.jup.ag/v6/quote";
    const qs = new URLSearchParams({
        inputMint,
        outputMint,
        amount,
        slippageBps: String(slippageBps),
        // Compact routes tuned for legacy swap
        onlyDirectRoutes: "true",
        asLegacyTransaction: "true",
        maxAccounts: "16",
    });
    const url = `${base}?${qs.toString()}`;
    const preDelay = 150 + Math.floor(Math.random() * 250);
    return (0, retry_1.withRetry)(async () => {
        await new Promise((r) => setTimeout(r, preDelay));
        const res = await (0, cross_fetch_1.default)(url);
        if (!res.ok) {
            const text = await res.text().catch(() => "");
            throw new Error(`Jupiter quote error ${res.status}${text ? `: ${text}` : ""}`);
        }
        return res.json();
    });
}
async function getBestRoute(params) {
    const data = await getQuote(params);
    const best = Array.isArray(data?.data) ? data.data[0] : data?.data || data;
    if (!best)
        throw new Error("No best route");
    return best;
}
//# sourceMappingURL=jupiter.js.map