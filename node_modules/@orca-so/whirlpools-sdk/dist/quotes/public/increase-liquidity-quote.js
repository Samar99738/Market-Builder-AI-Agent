"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.increaseLiquidityQuoteByInputTokenUsingPriceSlippage = increaseLiquidityQuoteByInputTokenUsingPriceSlippage;
exports.increaseLiquidityQuoteByInputTokenWithParamsUsingPriceSlippage = increaseLiquidityQuoteByInputTokenWithParamsUsingPriceSlippage;
exports.increaseLiquidityQuoteByLiquidityWithParams = increaseLiquidityQuoteByLiquidityWithParams;
exports.increaseLiquidityQuoteByInputToken = increaseLiquidityQuoteByInputToken;
exports.increaseLiquidityQuoteByInputTokenWithParams = increaseLiquidityQuoteByInputTokenWithParams;
const common_sdk_1 = require("@orca-so/common-sdk");
const bn_js_1 = __importDefault(require("bn.js"));
const tiny_invariant_1 = __importDefault(require("tiny-invariant"));
const position_util_1 = require("../../utils/position-util");
const public_1 = require("../../utils/public");
const token_extension_util_1 = require("../../utils/public/token-extension-util");
function increaseLiquidityQuoteByInputTokenUsingPriceSlippage(inputTokenMint, inputTokenAmount, tickLower, tickUpper, slippageTolerance, whirlpool, tokenExtensionCtx) {
    const data = whirlpool.getData();
    const tokenAInfo = whirlpool.getTokenAInfo();
    const tokenBInfo = whirlpool.getTokenBInfo();
    const inputMint = common_sdk_1.AddressUtil.toPubKey(inputTokenMint);
    const inputTokenInfo = inputMint.equals(tokenAInfo.mint)
        ? tokenAInfo
        : tokenBInfo;
    return increaseLiquidityQuoteByInputTokenWithParamsUsingPriceSlippage({
        inputTokenMint: inputMint,
        inputTokenAmount: common_sdk_1.DecimalUtil.toBN(inputTokenAmount, inputTokenInfo.decimals),
        tickLowerIndex: public_1.TickUtil.getInitializableTickIndex(tickLower, data.tickSpacing),
        tickUpperIndex: public_1.TickUtil.getInitializableTickIndex(tickUpper, data.tickSpacing),
        slippageTolerance,
        tokenExtensionCtx,
        ...data,
    });
}
function increaseLiquidityQuoteByInputTokenWithParamsUsingPriceSlippage(param) {
    (0, tiny_invariant_1.default)(public_1.TickUtil.checkTickInBounds(param.tickLowerIndex), "tickLowerIndex is out of bounds.");
    (0, tiny_invariant_1.default)(public_1.TickUtil.checkTickInBounds(param.tickUpperIndex), "tickUpperIndex is out of bounds.");
    (0, tiny_invariant_1.default)(param.inputTokenMint.equals(param.tokenMintA) ||
        param.inputTokenMint.equals(param.tokenMintB), `input token mint ${param.inputTokenMint.toBase58()} does not match any tokens in the provided pool.`);
    const liquidity = getLiquidityFromInputToken(param);
    if (liquidity.eq(common_sdk_1.ZERO)) {
        return {
            liquidityAmount: common_sdk_1.ZERO,
            tokenMaxA: common_sdk_1.ZERO,
            tokenMaxB: common_sdk_1.ZERO,
            tokenEstA: common_sdk_1.ZERO,
            tokenEstB: common_sdk_1.ZERO,
            transferFee: {
                deductingFromTokenMaxA: common_sdk_1.ZERO,
                deductingFromTokenMaxB: common_sdk_1.ZERO,
                deductingFromTokenEstA: common_sdk_1.ZERO,
                deductingFromTokenEstB: common_sdk_1.ZERO,
            },
        };
    }
    return increaseLiquidityQuoteByLiquidityWithParams({
        liquidity,
        tickCurrentIndex: param.tickCurrentIndex,
        sqrtPrice: param.sqrtPrice,
        tickLowerIndex: param.tickLowerIndex,
        tickUpperIndex: param.tickUpperIndex,
        slippageTolerance: param.slippageTolerance,
        tokenExtensionCtx: param.tokenExtensionCtx,
    });
}
function getLiquidityFromInputToken(params) {
    const { inputTokenMint, inputTokenAmount, tickLowerIndex, tickUpperIndex, sqrtPrice, tokenExtensionCtx, } = params;
    (0, tiny_invariant_1.default)(tickLowerIndex < tickUpperIndex, `tickLowerIndex(${tickLowerIndex}) must be less than tickUpperIndex(${tickUpperIndex})`);
    if (inputTokenAmount.eq(common_sdk_1.ZERO)) {
        return common_sdk_1.ZERO;
    }
    const isTokenA = params.tokenMintA.equals(inputTokenMint);
    const sqrtPriceLowerX64 = public_1.PriceMath.tickIndexToSqrtPriceX64(tickLowerIndex);
    const sqrtPriceUpperX64 = public_1.PriceMath.tickIndexToSqrtPriceX64(tickUpperIndex);
    const positionStatus = position_util_1.PositionUtil.getStrictPositionStatus(sqrtPrice, tickLowerIndex, tickUpperIndex);
    if (positionStatus === position_util_1.PositionStatus.BelowRange) {
        if (!isTokenA) {
            return common_sdk_1.ZERO;
        }
        const transferFeeExcludedInputTokenAmount = token_extension_util_1.TokenExtensionUtil.calculateTransferFeeExcludedAmount(inputTokenAmount, tokenExtensionCtx.tokenMintWithProgramA, tokenExtensionCtx.currentEpoch);
        return (0, position_util_1.getLiquidityFromTokenA)(transferFeeExcludedInputTokenAmount.amount, sqrtPriceLowerX64, sqrtPriceUpperX64, false);
    }
    if (positionStatus === position_util_1.PositionStatus.AboveRange) {
        if (isTokenA) {
            return common_sdk_1.ZERO;
        }
        const transferFeeExcludedInputTokenAmount = token_extension_util_1.TokenExtensionUtil.calculateTransferFeeExcludedAmount(inputTokenAmount, tokenExtensionCtx.tokenMintWithProgramB, tokenExtensionCtx.currentEpoch);
        return (0, position_util_1.getLiquidityFromTokenB)(transferFeeExcludedInputTokenAmount.amount, sqrtPriceLowerX64, sqrtPriceUpperX64, false);
    }
    if (isTokenA) {
        const transferFeeExcludedInputTokenAmount = token_extension_util_1.TokenExtensionUtil.calculateTransferFeeExcludedAmount(inputTokenAmount, tokenExtensionCtx.tokenMintWithProgramA, tokenExtensionCtx.currentEpoch);
        return (0, position_util_1.getLiquidityFromTokenA)(transferFeeExcludedInputTokenAmount.amount, sqrtPrice, sqrtPriceUpperX64, false);
    }
    else {
        const transferFeeExcludedInputTokenAmount = token_extension_util_1.TokenExtensionUtil.calculateTransferFeeExcludedAmount(inputTokenAmount, tokenExtensionCtx.tokenMintWithProgramB, tokenExtensionCtx.currentEpoch);
        return (0, position_util_1.getLiquidityFromTokenB)(transferFeeExcludedInputTokenAmount.amount, sqrtPriceLowerX64, sqrtPrice, false);
    }
}
function increaseLiquidityQuoteByLiquidityWithParams(params) {
    if (params.liquidity.eq(common_sdk_1.ZERO)) {
        return {
            liquidityAmount: common_sdk_1.ZERO,
            tokenMaxA: common_sdk_1.ZERO,
            tokenMaxB: common_sdk_1.ZERO,
            tokenEstA: common_sdk_1.ZERO,
            tokenEstB: common_sdk_1.ZERO,
            transferFee: {
                deductingFromTokenMaxA: common_sdk_1.ZERO,
                deductingFromTokenMaxB: common_sdk_1.ZERO,
                deductingFromTokenEstA: common_sdk_1.ZERO,
                deductingFromTokenEstB: common_sdk_1.ZERO,
            },
        };
    }
    const { tokenEstA, tokenEstB } = getTokenEstimatesFromLiquidity(params);
    const { lowerBound: [sLowerSqrtPrice, sLowerIndex], upperBound: [sUpperSqrtPrice, sUpperIndex], } = public_1.PriceMath.getSlippageBoundForSqrtPrice(params.sqrtPrice, params.slippageTolerance);
    const { tokenEstA: tokenEstALower, tokenEstB: tokenEstBLower } = getTokenEstimatesFromLiquidity({
        ...params,
        sqrtPrice: sLowerSqrtPrice,
        tickCurrentIndex: sLowerIndex,
    });
    const { tokenEstA: tokenEstAUpper, tokenEstB: tokenEstBUpper } = getTokenEstimatesFromLiquidity({
        ...params,
        sqrtPrice: sUpperSqrtPrice,
        tickCurrentIndex: sUpperIndex,
    });
    const tokenMaxA = bn_js_1.default.max(bn_js_1.default.max(tokenEstA, tokenEstALower), tokenEstAUpper);
    const tokenMaxB = bn_js_1.default.max(bn_js_1.default.max(tokenEstB, tokenEstBLower), tokenEstBUpper);
    const tokenExtensionCtx = params.tokenExtensionCtx;
    const tokenMaxAIncluded = token_extension_util_1.TokenExtensionUtil.calculateTransferFeeIncludedAmount(tokenMaxA, tokenExtensionCtx.tokenMintWithProgramA, tokenExtensionCtx.currentEpoch);
    const tokenEstAIncluded = token_extension_util_1.TokenExtensionUtil.calculateTransferFeeIncludedAmount(tokenEstA, tokenExtensionCtx.tokenMintWithProgramA, tokenExtensionCtx.currentEpoch);
    const tokenMaxBIncluded = token_extension_util_1.TokenExtensionUtil.calculateTransferFeeIncludedAmount(tokenMaxB, tokenExtensionCtx.tokenMintWithProgramB, tokenExtensionCtx.currentEpoch);
    const tokenEstBIncluded = token_extension_util_1.TokenExtensionUtil.calculateTransferFeeIncludedAmount(tokenEstB, tokenExtensionCtx.tokenMintWithProgramB, tokenExtensionCtx.currentEpoch);
    return {
        liquidityAmount: params.liquidity,
        tokenMaxA: tokenMaxAIncluded.amount,
        tokenMaxB: tokenMaxBIncluded.amount,
        tokenEstA: tokenEstAIncluded.amount,
        tokenEstB: tokenEstBIncluded.amount,
        transferFee: {
            deductingFromTokenMaxA: tokenMaxAIncluded.fee,
            deductingFromTokenMaxB: tokenMaxBIncluded.fee,
            deductingFromTokenEstA: tokenEstAIncluded.fee,
            deductingFromTokenEstB: tokenEstBIncluded.fee,
        },
    };
}
function getTokenEstimatesFromLiquidity(params) {
    const { liquidity, sqrtPrice, tickLowerIndex, tickUpperIndex } = params;
    if (liquidity.eq(common_sdk_1.ZERO)) {
        throw new Error("liquidity must be greater than 0");
    }
    let tokenEstA = common_sdk_1.ZERO;
    let tokenEstB = common_sdk_1.ZERO;
    const lowerSqrtPrice = public_1.PriceMath.tickIndexToSqrtPriceX64(tickLowerIndex);
    const upperSqrtPrice = public_1.PriceMath.tickIndexToSqrtPriceX64(tickUpperIndex);
    const positionStatus = position_util_1.PositionUtil.getStrictPositionStatus(sqrtPrice, tickLowerIndex, tickUpperIndex);
    if (positionStatus === position_util_1.PositionStatus.BelowRange) {
        tokenEstA = (0, position_util_1.getTokenAFromLiquidity)(liquidity, lowerSqrtPrice, upperSqrtPrice, true);
    }
    else if (positionStatus === position_util_1.PositionStatus.InRange) {
        tokenEstA = (0, position_util_1.getTokenAFromLiquidity)(liquidity, sqrtPrice, upperSqrtPrice, true);
        tokenEstB = (0, position_util_1.getTokenBFromLiquidity)(liquidity, lowerSqrtPrice, sqrtPrice, true);
    }
    else {
        tokenEstB = (0, position_util_1.getTokenBFromLiquidity)(liquidity, lowerSqrtPrice, upperSqrtPrice, true);
    }
    return { tokenEstA, tokenEstB };
}
function increaseLiquidityQuoteByInputToken(inputTokenMint, inputTokenAmount, tickLower, tickUpper, slippageTolerance, whirlpool, tokenExtensionCtx) {
    const data = whirlpool.getData();
    const tokenAInfo = whirlpool.getTokenAInfo();
    const tokenBInfo = whirlpool.getTokenBInfo();
    const inputMint = common_sdk_1.AddressUtil.toPubKey(inputTokenMint);
    const inputTokenInfo = inputMint.equals(tokenAInfo.mint)
        ? tokenAInfo
        : tokenBInfo;
    return increaseLiquidityQuoteByInputTokenWithParams({
        inputTokenMint: inputMint,
        inputTokenAmount: common_sdk_1.DecimalUtil.toBN(inputTokenAmount, inputTokenInfo.decimals),
        tickLowerIndex: public_1.TickUtil.getInitializableTickIndex(tickLower, data.tickSpacing),
        tickUpperIndex: public_1.TickUtil.getInitializableTickIndex(tickUpper, data.tickSpacing),
        slippageTolerance,
        tokenExtensionCtx,
        ...data,
    });
}
function increaseLiquidityQuoteByInputTokenWithParams(param) {
    (0, tiny_invariant_1.default)(public_1.TickUtil.checkTickInBounds(param.tickLowerIndex), "tickLowerIndex is out of bounds.");
    (0, tiny_invariant_1.default)(public_1.TickUtil.checkTickInBounds(param.tickUpperIndex), "tickUpperIndex is out of bounds.");
    (0, tiny_invariant_1.default)(param.inputTokenMint.equals(param.tokenMintA) ||
        param.inputTokenMint.equals(param.tokenMintB), `input token mint ${param.inputTokenMint.toBase58()} does not match any tokens in the provided pool.`);
    const positionStatus = position_util_1.PositionUtil.getStrictPositionStatus(param.sqrtPrice, param.tickLowerIndex, param.tickUpperIndex);
    switch (positionStatus) {
        case position_util_1.PositionStatus.BelowRange:
            return quotePositionBelowRange(param);
        case position_util_1.PositionStatus.InRange:
            return quotePositionInRange(param);
        case position_util_1.PositionStatus.AboveRange:
            return quotePositionAboveRange(param);
        default:
            throw new Error(`type ${positionStatus} is an unknown PositionStatus`);
    }
}
function quotePositionBelowRange(param) {
    const { tokenMintA, inputTokenMint, inputTokenAmount, tickLowerIndex, tickUpperIndex, tokenExtensionCtx, slippageTolerance, } = param;
    if (!tokenMintA.equals(inputTokenMint)) {
        return {
            liquidityAmount: common_sdk_1.ZERO,
            tokenMaxA: common_sdk_1.ZERO,
            tokenMaxB: common_sdk_1.ZERO,
            tokenEstA: common_sdk_1.ZERO,
            tokenEstB: common_sdk_1.ZERO,
            transferFee: {
                deductingFromTokenMaxA: common_sdk_1.ZERO,
                deductingFromTokenMaxB: common_sdk_1.ZERO,
                deductingFromTokenEstA: common_sdk_1.ZERO,
                deductingFromTokenEstB: common_sdk_1.ZERO,
            },
        };
    }
    const sqrtPriceLowerX64 = public_1.PriceMath.tickIndexToSqrtPriceX64(tickLowerIndex);
    const sqrtPriceUpperX64 = public_1.PriceMath.tickIndexToSqrtPriceX64(tickUpperIndex);
    const transferFeeExcludedInputTokenAmount = token_extension_util_1.TokenExtensionUtil.calculateTransferFeeExcludedAmount(inputTokenAmount, tokenExtensionCtx.tokenMintWithProgramA, tokenExtensionCtx.currentEpoch);
    const liquidityAmount = (0, position_util_1.getLiquidityFromTokenA)(transferFeeExcludedInputTokenAmount.amount, sqrtPriceLowerX64, sqrtPriceUpperX64, false);
    const tokenEstA = (0, position_util_1.getTokenAFromLiquidity)(liquidityAmount, sqrtPriceLowerX64, sqrtPriceUpperX64, true);
    const tokenMaxA = (0, position_util_1.adjustForSlippage)(tokenEstA, slippageTolerance, true);
    const tokenMaxAIncluded = token_extension_util_1.TokenExtensionUtil.calculateTransferFeeIncludedAmount(tokenMaxA, tokenExtensionCtx.tokenMintWithProgramA, tokenExtensionCtx.currentEpoch);
    const tokenEstAIncluded = token_extension_util_1.TokenExtensionUtil.calculateTransferFeeIncludedAmount(tokenEstA, tokenExtensionCtx.tokenMintWithProgramA, tokenExtensionCtx.currentEpoch);
    return {
        liquidityAmount,
        tokenMaxA: tokenMaxAIncluded.amount,
        tokenMaxB: common_sdk_1.ZERO,
        tokenEstA: tokenEstAIncluded.amount,
        tokenEstB: common_sdk_1.ZERO,
        transferFee: {
            deductingFromTokenMaxA: tokenMaxAIncluded.fee,
            deductingFromTokenMaxB: common_sdk_1.ZERO,
            deductingFromTokenEstA: tokenEstAIncluded.fee,
            deductingFromTokenEstB: common_sdk_1.ZERO,
        },
    };
}
function quotePositionInRange(param) {
    const { tokenMintA, tokenMintB, sqrtPrice, inputTokenMint, inputTokenAmount, tickLowerIndex, tickUpperIndex, tokenExtensionCtx, slippageTolerance, } = param;
    const sqrtPriceX64 = sqrtPrice;
    const sqrtPriceLowerX64 = public_1.PriceMath.tickIndexToSqrtPriceX64(tickLowerIndex);
    const sqrtPriceUpperX64 = public_1.PriceMath.tickIndexToSqrtPriceX64(tickUpperIndex);
    let tokenEstA;
    let tokenEstB;
    let liquidityAmount;
    if (tokenMintA.equals(inputTokenMint)) {
        const transferFeeExcludedInputTokenAmount = token_extension_util_1.TokenExtensionUtil.calculateTransferFeeExcludedAmount(inputTokenAmount, tokenExtensionCtx.tokenMintWithProgramA, tokenExtensionCtx.currentEpoch);
        liquidityAmount = (0, position_util_1.getLiquidityFromTokenA)(transferFeeExcludedInputTokenAmount.amount, sqrtPriceX64, sqrtPriceUpperX64, false);
        tokenEstA = (0, position_util_1.getTokenAFromLiquidity)(liquidityAmount, sqrtPriceX64, sqrtPriceUpperX64, true);
        tokenEstB = (0, position_util_1.getTokenBFromLiquidity)(liquidityAmount, sqrtPriceLowerX64, sqrtPriceX64, true);
    }
    else if (tokenMintB.equals(inputTokenMint)) {
        const transferFeeExcludedInputTokenAmount = token_extension_util_1.TokenExtensionUtil.calculateTransferFeeExcludedAmount(inputTokenAmount, tokenExtensionCtx.tokenMintWithProgramB, tokenExtensionCtx.currentEpoch);
        liquidityAmount = (0, position_util_1.getLiquidityFromTokenB)(transferFeeExcludedInputTokenAmount.amount, sqrtPriceLowerX64, sqrtPriceX64, false);
        tokenEstA = (0, position_util_1.getTokenAFromLiquidity)(liquidityAmount, sqrtPriceX64, sqrtPriceUpperX64, true);
        tokenEstB = (0, position_util_1.getTokenBFromLiquidity)(liquidityAmount, sqrtPriceLowerX64, sqrtPriceX64, true);
    }
    else {
        throw new Error("invariant violation");
    }
    const tokenMaxA = (0, position_util_1.adjustForSlippage)(tokenEstA, slippageTolerance, true);
    const tokenMaxB = (0, position_util_1.adjustForSlippage)(tokenEstB, slippageTolerance, true);
    const tokenMaxAIncluded = token_extension_util_1.TokenExtensionUtil.calculateTransferFeeIncludedAmount(tokenMaxA, tokenExtensionCtx.tokenMintWithProgramA, tokenExtensionCtx.currentEpoch);
    const tokenEstAIncluded = token_extension_util_1.TokenExtensionUtil.calculateTransferFeeIncludedAmount(tokenEstA, tokenExtensionCtx.tokenMintWithProgramA, tokenExtensionCtx.currentEpoch);
    const tokenMaxBIncluded = token_extension_util_1.TokenExtensionUtil.calculateTransferFeeIncludedAmount(tokenMaxB, tokenExtensionCtx.tokenMintWithProgramB, tokenExtensionCtx.currentEpoch);
    const tokenEstBIncluded = token_extension_util_1.TokenExtensionUtil.calculateTransferFeeIncludedAmount(tokenEstB, tokenExtensionCtx.tokenMintWithProgramB, tokenExtensionCtx.currentEpoch);
    return {
        liquidityAmount,
        tokenMaxA: tokenMaxAIncluded.amount,
        tokenMaxB: tokenMaxBIncluded.amount,
        tokenEstA: tokenEstAIncluded.amount,
        tokenEstB: tokenEstBIncluded.amount,
        transferFee: {
            deductingFromTokenMaxA: tokenMaxAIncluded.fee,
            deductingFromTokenMaxB: tokenMaxBIncluded.fee,
            deductingFromTokenEstA: tokenEstAIncluded.fee,
            deductingFromTokenEstB: tokenEstBIncluded.fee,
        },
    };
}
function quotePositionAboveRange(param) {
    const { tokenMintB, inputTokenMint, inputTokenAmount, tickLowerIndex, tickUpperIndex, tokenExtensionCtx, slippageTolerance, } = param;
    if (!tokenMintB.equals(inputTokenMint)) {
        return {
            liquidityAmount: common_sdk_1.ZERO,
            tokenMaxA: common_sdk_1.ZERO,
            tokenMaxB: common_sdk_1.ZERO,
            tokenEstA: common_sdk_1.ZERO,
            tokenEstB: common_sdk_1.ZERO,
            transferFee: {
                deductingFromTokenMaxA: common_sdk_1.ZERO,
                deductingFromTokenMaxB: common_sdk_1.ZERO,
                deductingFromTokenEstA: common_sdk_1.ZERO,
                deductingFromTokenEstB: common_sdk_1.ZERO,
            },
        };
    }
    const sqrtPriceLowerX64 = public_1.PriceMath.tickIndexToSqrtPriceX64(tickLowerIndex);
    const sqrtPriceUpperX64 = public_1.PriceMath.tickIndexToSqrtPriceX64(tickUpperIndex);
    const transferFeeExcludedInputTokenAmount = token_extension_util_1.TokenExtensionUtil.calculateTransferFeeExcludedAmount(inputTokenAmount, tokenExtensionCtx.tokenMintWithProgramB, tokenExtensionCtx.currentEpoch);
    const liquidityAmount = (0, position_util_1.getLiquidityFromTokenB)(transferFeeExcludedInputTokenAmount.amount, sqrtPriceLowerX64, sqrtPriceUpperX64, false);
    const tokenEstB = (0, position_util_1.getTokenBFromLiquidity)(liquidityAmount, sqrtPriceLowerX64, sqrtPriceUpperX64, true);
    const tokenMaxB = (0, position_util_1.adjustForSlippage)(tokenEstB, slippageTolerance, true);
    const tokenMaxBIncluded = token_extension_util_1.TokenExtensionUtil.calculateTransferFeeIncludedAmount(tokenMaxB, tokenExtensionCtx.tokenMintWithProgramB, tokenExtensionCtx.currentEpoch);
    const tokenEstBIncluded = token_extension_util_1.TokenExtensionUtil.calculateTransferFeeIncludedAmount(tokenEstB, tokenExtensionCtx.tokenMintWithProgramB, tokenExtensionCtx.currentEpoch);
    return {
        liquidityAmount,
        tokenMaxA: common_sdk_1.ZERO,
        tokenMaxB: tokenMaxBIncluded.amount,
        tokenEstA: common_sdk_1.ZERO,
        tokenEstB: tokenEstBIncluded.amount,
        transferFee: {
            deductingFromTokenMaxA: common_sdk_1.ZERO,
            deductingFromTokenMaxB: tokenMaxBIncluded.fee,
            deductingFromTokenEstA: common_sdk_1.ZERO,
            deductingFromTokenEstB: tokenEstBIncluded.fee,
        },
    };
}
//# sourceMappingURL=increase-liquidity-quote.js.map