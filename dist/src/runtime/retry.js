"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withRetry = withRetry;
// Utility function to pause execution for given milliseconds
function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
}
// Generic retry wrapper that executes a function with exponential backoff and jitter
async function withRetry(fn, opts = {}) {
    const { retries = 6, minDelayMs = 1000, maxDelayMs = 12000, factor = 2, jitterPct = 0.3, shouldRetry = (e) => {
        // Determines which errors are retryable (network/rate-limit related)
        const msg = typeof e?.message === "string" ? e.message : String(e);
        return (msg.includes("429") ||
            /too many requests|rate/i.test(msg) ||
            /ENOTFOUND|ECONNRESET|ETIMEDOUT/i.test(msg) ||
            /network|fetch failed/i.test(msg));
    }, onRetry, } = opts;
    let attempt = 0;
    let delay = minDelayMs;
    // Keep retrying until success or retries exhausted
    while (true) {
        try {
            return await fn(); // attempt function execution
        }
        catch (e) {
            attempt++;
            if (attempt > retries || !shouldRetry(e)) {
                // Stop retrying if max attempts reached or error not retryable
                const msg = e instanceof Error ? e.message : String(e);
                throw new Error(`Request failed after ${retries} retries: ${msg}`);
            }
            // Calculate randomized delay with jitter, capped at maxDelayMs
            const jitter = 1 + (Math.random() * 2 - 1) * jitterPct;
            const useDelay = Math.min(Math.round(delay * jitter), maxDelayMs);
            // Invoke callback on retry attempt
            if (onRetry)
                onRetry(e, attempt, useDelay);
            // Wait before next attempt
            await sleep(useDelay);
            // Increase delay for exponential backoff
            delay = Math.min(delay * factor, maxDelayMs);
        }
    }
}
