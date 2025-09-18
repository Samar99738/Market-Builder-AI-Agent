"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AmountDeltaU64 = void 0;
exports.getAmountDeltaA = getAmountDeltaA;
exports.tryGetAmountDeltaA = tryGetAmountDeltaA;
exports.getAmountDeltaB = getAmountDeltaB;
exports.tryGetAmountDeltaB = tryGetAmountDeltaB;
exports.getNextSqrtPrice = getNextSqrtPrice;
exports.adjustForSlippage = adjustForSlippage;
const common_sdk_1 = require("@orca-so/common-sdk");
const bn_js_1 = __importDefault(require("bn.js"));
const errors_1 = require("../../errors/errors");
const public_1 = require("../../types/public");
const bit_math_1 = require("./bit-math");
const tiny_invariant_1 = __importDefault(require("tiny-invariant"));
class AmountDeltaU64 {
    inner;
    constructor(inner) {
        this.inner = inner;
    }
    static fromValid(value) {
        return new AmountDeltaU64({
            type: "Valid",
            value,
        });
    }
    static fromExceedsMax(error) {
        return new AmountDeltaU64({
            type: "ExceedsMax",
            error,
        });
    }
    lte(other) {
        if (this.inner.type === "ExceedsMax") {
            return false;
        }
        return this.inner.value.lte(other);
    }
    exceedsMax() {
        return this.inner.type === "ExceedsMax";
    }
    value() {
        (0, tiny_invariant_1.default)(this.inner.type === "Valid", "Expected valid AmountDeltaU64");
        return this.inner.value;
    }
    unwrap() {
        if (this.inner.type === "Valid") {
            return this.inner.value;
        }
        else {
            throw this.inner.error;
        }
    }
}
exports.AmountDeltaU64 = AmountDeltaU64;
function getAmountDeltaA(currSqrtPrice, targetSqrtPrice, currLiquidity, roundUp) {
    return tryGetAmountDeltaA(currSqrtPrice, targetSqrtPrice, currLiquidity, roundUp).unwrap();
}
function tryGetAmountDeltaA(currSqrtPrice, targetSqrtPrice, currLiquidity, roundUp) {
    let [sqrtPriceLower, sqrtPriceUpper] = toIncreasingPriceOrder(currSqrtPrice, targetSqrtPrice);
    let sqrtPriceDiff = sqrtPriceUpper.sub(sqrtPriceLower);
    let numerator = currLiquidity.mul(sqrtPriceDiff).shln(64);
    let denominator = sqrtPriceLower.mul(sqrtPriceUpper);
    let quotient = numerator.div(denominator);
    let remainder = numerator.mod(denominator);
    let result = roundUp && !remainder.eq(common_sdk_1.ZERO) ? quotient.add(new bn_js_1.default(1)) : quotient;
    if (result.gt(common_sdk_1.U64_MAX)) {
        return AmountDeltaU64.fromExceedsMax(new errors_1.WhirlpoolsError("Results larger than U64", errors_1.TokenErrorCode.TokenMaxExceeded));
    }
    return AmountDeltaU64.fromValid(result);
}
function getAmountDeltaB(currSqrtPrice, targetSqrtPrice, currLiquidity, roundUp) {
    return tryGetAmountDeltaB(currSqrtPrice, targetSqrtPrice, currLiquidity, roundUp).unwrap();
}
function tryGetAmountDeltaB(currSqrtPrice, targetSqrtPrice, currLiquidity, roundUp) {
    let [sqrtPriceLower, sqrtPriceUpper] = toIncreasingPriceOrder(currSqrtPrice, targetSqrtPrice);
    const n0 = currLiquidity;
    const n1 = sqrtPriceUpper.sub(sqrtPriceLower);
    const limit = 128;
    if (n0.eq(common_sdk_1.ZERO) || n1.eq(common_sdk_1.ZERO)) {
        return AmountDeltaU64.fromValid(common_sdk_1.ZERO);
    }
    const p = bit_math_1.BitMath.mul(n0, n1, limit * 2);
    if (bit_math_1.BitMath.isOverLimit(p, limit)) {
        return AmountDeltaU64.fromExceedsMax(new errors_1.WhirlpoolsError(`MulShiftRight overflowed u${limit}.`, errors_1.MathErrorCode.MultiplicationShiftRightOverflow));
    }
    const result = common_sdk_1.MathUtil.fromX64_BN(p);
    const shouldRound = roundUp && p.and(common_sdk_1.U64_MAX).gt(common_sdk_1.ZERO);
    if (shouldRound && result.eq(common_sdk_1.U64_MAX)) {
        return AmountDeltaU64.fromExceedsMax(new errors_1.WhirlpoolsError(`MulShiftRight overflowed u${limit}.`, errors_1.MathErrorCode.MultiplicationOverflow));
    }
    return AmountDeltaU64.fromValid(shouldRound ? result.add(common_sdk_1.ONE) : result);
}
function getNextSqrtPrice(sqrtPrice, currLiquidity, amount, amountSpecifiedIsInput, aToB) {
    if (amountSpecifiedIsInput === aToB) {
        return getNextSqrtPriceFromARoundUp(sqrtPrice, currLiquidity, amount, amountSpecifiedIsInput);
    }
    else {
        return getNextSqrtPriceFromBRoundDown(sqrtPrice, currLiquidity, amount, amountSpecifiedIsInput);
    }
}
function adjustForSlippage(n, { numerator, denominator }, adjustUp) {
    if (adjustUp) {
        return n.mul(denominator.add(numerator)).div(denominator);
    }
    else {
        return n.mul(denominator).div(denominator.add(numerator));
    }
}
function toIncreasingPriceOrder(sqrtPrice0, sqrtPrice1) {
    if (sqrtPrice0.gt(sqrtPrice1)) {
        return [sqrtPrice1, sqrtPrice0];
    }
    else {
        return [sqrtPrice0, sqrtPrice1];
    }
}
function getNextSqrtPriceFromARoundUp(sqrtPrice, currLiquidity, amount, amountSpecifiedIsInput) {
    if (amount.eq(common_sdk_1.ZERO)) {
        return sqrtPrice;
    }
    let p = bit_math_1.BitMath.mul(sqrtPrice, amount, 256);
    let numerator = bit_math_1.BitMath.mul(currLiquidity, sqrtPrice, 256).shln(64);
    if (bit_math_1.BitMath.isOverLimit(numerator, 256)) {
        throw new errors_1.WhirlpoolsError("getNextSqrtPriceFromARoundUp - numerator overflow u256", errors_1.MathErrorCode.MultiplicationOverflow);
    }
    let currLiquidityShiftLeft = currLiquidity.shln(64);
    if (!amountSpecifiedIsInput && currLiquidityShiftLeft.lte(p)) {
        throw new errors_1.WhirlpoolsError("getNextSqrtPriceFromARoundUp - Unable to divide currLiquidityX64 by product", errors_1.MathErrorCode.DivideByZero);
    }
    let denominator = amountSpecifiedIsInput
        ? currLiquidityShiftLeft.add(p)
        : currLiquidityShiftLeft.sub(p);
    let price = bit_math_1.BitMath.divRoundUp(numerator, denominator);
    if (price.lt(new bn_js_1.default(public_1.MIN_SQRT_PRICE))) {
        throw new errors_1.WhirlpoolsError("getNextSqrtPriceFromARoundUp - price less than min sqrt price", errors_1.TokenErrorCode.TokenMinSubceeded);
    }
    else if (price.gt(new bn_js_1.default(public_1.MAX_SQRT_PRICE))) {
        throw new errors_1.WhirlpoolsError("getNextSqrtPriceFromARoundUp - price less than max sqrt price", errors_1.TokenErrorCode.TokenMaxExceeded);
    }
    return price;
}
function getNextSqrtPriceFromBRoundDown(sqrtPrice, currLiquidity, amount, amountSpecifiedIsInput) {
    let amountX64 = amount.shln(64);
    let delta = bit_math_1.BitMath.divRoundUpIf(amountX64, currLiquidity, !amountSpecifiedIsInput);
    if (amountSpecifiedIsInput) {
        sqrtPrice = sqrtPrice.add(delta);
    }
    else {
        sqrtPrice = sqrtPrice.sub(delta);
    }
    return sqrtPrice;
}
//# sourceMappingURL=token-math.js.map