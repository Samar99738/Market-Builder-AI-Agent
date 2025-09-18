"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.collectFeesQuote = collectFeesQuote;
const common_sdk_1 = require("@orca-so/common-sdk");
const token_extension_util_1 = require("../../utils/public/token-extension-util");
function collectFeesQuote(param) {
    const { whirlpool, position, tickLower, tickUpper, tokenExtensionCtx } = param;
    const { tickCurrentIndex, feeGrowthGlobalA: feeGrowthGlobalAX64, feeGrowthGlobalB: feeGrowthGlobalBX64, } = whirlpool;
    const { tickLowerIndex, tickUpperIndex, liquidity, feeOwedA, feeOwedB, feeGrowthCheckpointA: feeGrowthCheckpointAX64, feeGrowthCheckpointB: feeGrowthCheckpointBX64, } = position;
    const { feeGrowthOutsideA: tickLowerFeeGrowthOutsideAX64, feeGrowthOutsideB: tickLowerFeeGrowthOutsideBX64, } = tickLower;
    const { feeGrowthOutsideA: tickUpperFeeGrowthOutsideAX64, feeGrowthOutsideB: tickUpperFeeGrowthOutsideBX64, } = tickUpper;
    let feeGrowthBelowAX64 = null;
    let feeGrowthBelowBX64 = null;
    if (tickCurrentIndex < tickLowerIndex) {
        feeGrowthBelowAX64 = common_sdk_1.MathUtil.subUnderflowU128(feeGrowthGlobalAX64, tickLowerFeeGrowthOutsideAX64);
        feeGrowthBelowBX64 = common_sdk_1.MathUtil.subUnderflowU128(feeGrowthGlobalBX64, tickLowerFeeGrowthOutsideBX64);
    }
    else {
        feeGrowthBelowAX64 = tickLowerFeeGrowthOutsideAX64;
        feeGrowthBelowBX64 = tickLowerFeeGrowthOutsideBX64;
    }
    let feeGrowthAboveAX64 = null;
    let feeGrowthAboveBX64 = null;
    if (tickCurrentIndex < tickUpperIndex) {
        feeGrowthAboveAX64 = tickUpperFeeGrowthOutsideAX64;
        feeGrowthAboveBX64 = tickUpperFeeGrowthOutsideBX64;
    }
    else {
        feeGrowthAboveAX64 = common_sdk_1.MathUtil.subUnderflowU128(feeGrowthGlobalAX64, tickUpperFeeGrowthOutsideAX64);
        feeGrowthAboveBX64 = common_sdk_1.MathUtil.subUnderflowU128(feeGrowthGlobalBX64, tickUpperFeeGrowthOutsideBX64);
    }
    const feeGrowthInsideAX64 = common_sdk_1.MathUtil.subUnderflowU128(common_sdk_1.MathUtil.subUnderflowU128(feeGrowthGlobalAX64, feeGrowthBelowAX64), feeGrowthAboveAX64);
    const feeGrowthInsideBX64 = common_sdk_1.MathUtil.subUnderflowU128(common_sdk_1.MathUtil.subUnderflowU128(feeGrowthGlobalBX64, feeGrowthBelowBX64), feeGrowthAboveBX64);
    const feeOwedADelta = common_sdk_1.MathUtil.subUnderflowU128(feeGrowthInsideAX64, feeGrowthCheckpointAX64)
        .mul(liquidity)
        .shrn(64);
    const feeOwedBDelta = common_sdk_1.MathUtil.subUnderflowU128(feeGrowthInsideBX64, feeGrowthCheckpointBX64)
        .mul(liquidity)
        .shrn(64);
    const updatedFeeOwedA = feeOwedA.add(feeOwedADelta);
    const transferFeeExcludedAmountA = token_extension_util_1.TokenExtensionUtil.calculateTransferFeeExcludedAmount(updatedFeeOwedA, tokenExtensionCtx.tokenMintWithProgramA, tokenExtensionCtx.currentEpoch);
    const updatedFeeOwedB = feeOwedB.add(feeOwedBDelta);
    const transferFeeExcludedAmountB = token_extension_util_1.TokenExtensionUtil.calculateTransferFeeExcludedAmount(updatedFeeOwedB, tokenExtensionCtx.tokenMintWithProgramB, tokenExtensionCtx.currentEpoch);
    return {
        feeOwedA: transferFeeExcludedAmountA.amount,
        feeOwedB: transferFeeExcludedAmountB.amount,
        transferFee: {
            deductedFromFeeOwedA: transferFeeExcludedAmountA.fee,
            deductedFromFeeOwedB: transferFeeExcludedAmountB.fee,
        },
    };
}
//# sourceMappingURL=collect-fees-quote.js.map