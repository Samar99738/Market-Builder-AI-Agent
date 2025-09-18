"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.swapQuoteByInputTokenWithDevFees = swapQuoteByInputTokenWithDevFees;
const errors_1 = require("../../errors/errors");
const swap_quote_1 = require("./swap-quote");
async function swapQuoteByInputTokenWithDevFees(whirlpool, inputTokenMint, tokenAmount, slippageTolerance, programId, fetcher, devFeePercentage, opts) {
    if (devFeePercentage.toDecimal().greaterThanOrEqualTo(1)) {
        throw new errors_1.WhirlpoolsError("Provided devFeePercentage must be less than 100%", errors_1.SwapErrorCode.InvalidDevFeePercentage);
    }
    const devFeeAmount = tokenAmount
        .mul(devFeePercentage.numerator)
        .div(devFeePercentage.denominator);
    const slippageAdjustedQuote = await (0, swap_quote_1.swapQuoteByInputToken)(whirlpool, inputTokenMint, tokenAmount.sub(devFeeAmount), slippageTolerance, programId, fetcher, opts);
    const devFeeAdjustedQuote = {
        ...slippageAdjustedQuote,
        amountSpecifiedIsInput: true,
        estimatedAmountIn: slippageAdjustedQuote.estimatedAmountIn.add(devFeeAmount),
        estimatedFeeAmount: slippageAdjustedQuote.estimatedFeeAmount.add(devFeeAmount),
        estimatedSwapFeeAmount: slippageAdjustedQuote.estimatedFeeAmount,
        devFeeAmount,
    };
    return devFeeAdjustedQuote;
}
//# sourceMappingURL=dev-fee-swap-quote.js.map