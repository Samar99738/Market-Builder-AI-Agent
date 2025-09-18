"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.twoHopSwapQuoteFromSwapQuotes = twoHopSwapQuoteFromSwapQuotes;
function twoHopSwapQuoteFromSwapQuotes(swapQuoteOne, swapQuoteTwo) {
    const amountSpecifiedIsInput = swapQuoteOne.amountSpecifiedIsInput;
    let [amount, otherAmountThreshold] = amountSpecifiedIsInput
        ? [swapQuoteOne.amount, swapQuoteTwo.otherAmountThreshold]
        : [swapQuoteTwo.amount, swapQuoteOne.otherAmountThreshold];
    return {
        amount,
        otherAmountThreshold,
        amountSpecifiedIsInput,
        aToBOne: swapQuoteOne.aToB,
        aToBTwo: swapQuoteTwo.aToB,
        sqrtPriceLimitOne: swapQuoteOne.sqrtPriceLimit,
        sqrtPriceLimitTwo: swapQuoteTwo.sqrtPriceLimit,
        tickArrayOne0: swapQuoteOne.tickArray0,
        tickArrayOne1: swapQuoteOne.tickArray1,
        tickArrayOne2: swapQuoteOne.tickArray2,
        tickArrayTwo0: swapQuoteTwo.tickArray0,
        tickArrayTwo1: swapQuoteTwo.tickArray1,
        tickArrayTwo2: swapQuoteTwo.tickArray2,
        supplementalTickArraysOne: swapQuoteOne.supplementalTickArrays,
        supplementalTickArraysTwo: swapQuoteTwo.supplementalTickArrays,
        swapOneEstimates: { ...swapQuoteOne },
        swapTwoEstimates: { ...swapQuoteTwo },
    };
}
//# sourceMappingURL=two-hop-swap-quote.js.map