"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withRetry = withRetry;
function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
}
async function withRetry(fn, opts = {}) {
    const { retries = 6, minDelayMs = 1000, maxDelayMs = 12000, factor = 2, jitterPct = 0.3, shouldRetry = (e) => {
        const msg = typeof e?.message === "string" ? e.message : String(e);
        return (msg.includes("429") ||
            /too many requests|rate/i.test(msg) ||
            /ENOTFOUND|ECONNRESET|ETIMEDOUT/i.test(msg) ||
            /network|fetch failed/i.test(msg));
    }, onRetry, } = opts;
    let attempt = 0;
    let delay = minDelayMs;
    while (true) {
        try {
            return await fn();
        }
        catch (e) {
            attempt++;
            if (attempt > retries || !shouldRetry(e)) {
                const msg = e instanceof Error ? e.message : String(e);
                throw new Error(`Request failed after ${retries} retries: ${msg}`);
            }
            const jitter = 1 + (Math.random() * 2 - 1) * jitterPct;
            const useDelay = Math.min(Math.round(delay * jitter), maxDelayMs);
            if (onRetry)
                onRetry(e, attempt, useDelay);
            await sleep(useDelay);
            delay = Math.min(delay * factor, maxDelayMs);
        }
    }
}
//# sourceMappingURL=retry.js.map