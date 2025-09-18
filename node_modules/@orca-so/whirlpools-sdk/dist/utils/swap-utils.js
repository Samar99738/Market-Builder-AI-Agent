"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZEROED_TICKS = exports.ZEROED_TICK_DATA = void 0;
exports.getLowerSqrtPriceFromTokenA = getLowerSqrtPriceFromTokenA;
exports.getUpperSqrtPriceFromTokenA = getUpperSqrtPriceFromTokenA;
exports.getLowerSqrtPriceFromTokenB = getLowerSqrtPriceFromTokenB;
exports.getUpperSqrtPriceFromTokenB = getUpperSqrtPriceFromTokenB;
exports.getTickArrayPublicKeysWithStartTickIndex = getTickArrayPublicKeysWithStartTickIndex;
exports.buildZeroedTickArray = buildZeroedTickArray;
const common_sdk_1 = require("@orca-so/common-sdk");
const public_1 = require("../types/public");
const public_2 = require("./public");
function getLowerSqrtPriceFromTokenA(amount, liquidity, sqrtPriceX64) {
    const numerator = liquidity.mul(sqrtPriceX64).shln(64);
    const denominator = liquidity.shln(64).add(amount.mul(sqrtPriceX64));
    return common_sdk_1.MathUtil.divRoundUp(numerator, denominator);
}
function getUpperSqrtPriceFromTokenA(amount, liquidity, sqrtPriceX64) {
    const numerator = liquidity.mul(sqrtPriceX64).shln(64);
    const denominator = liquidity.shln(64).sub(amount.mul(sqrtPriceX64));
    return common_sdk_1.MathUtil.divRoundUp(numerator, denominator);
}
function getLowerSqrtPriceFromTokenB(amount, liquidity, sqrtPriceX64) {
    return sqrtPriceX64.sub(common_sdk_1.MathUtil.divRoundUp(amount.shln(64), liquidity));
}
function getUpperSqrtPriceFromTokenB(amount, liquidity, sqrtPriceX64) {
    return sqrtPriceX64.add(amount.shln(64).div(liquidity));
}
function getTickArrayPublicKeysWithStartTickIndex(tickCurrentIndex, tickSpacing, aToB, programId, whirlpoolAddress) {
    const shift = aToB ? 0 : tickSpacing;
    let offset = 0;
    let tickArrayAddresses = [];
    for (let i = 0; i < public_1.MAX_SWAP_TICK_ARRAYS; i++) {
        let startIndex;
        try {
            startIndex = public_2.TickUtil.getStartTickIndex(tickCurrentIndex + shift, tickSpacing, offset);
        }
        catch {
            return tickArrayAddresses;
        }
        const pda = public_2.PDAUtil.getTickArray(programId, whirlpoolAddress, startIndex);
        tickArrayAddresses.push({
            pubkey: pda.publicKey,
            startTickIndex: startIndex,
        });
        offset = aToB ? offset - 1 : offset + 1;
    }
    return tickArrayAddresses;
}
exports.ZEROED_TICK_DATA = Object.freeze({
    initialized: false,
    liquidityNet: common_sdk_1.ZERO,
    liquidityGross: common_sdk_1.ZERO,
    feeGrowthOutsideA: common_sdk_1.ZERO,
    feeGrowthOutsideB: common_sdk_1.ZERO,
    rewardGrowthsOutside: [common_sdk_1.ZERO, common_sdk_1.ZERO, common_sdk_1.ZERO],
});
exports.ZEROED_TICKS = Array.from({ length: public_1.TICK_ARRAY_SIZE }, () => exports.ZEROED_TICK_DATA);
function buildZeroedTickArray(whirlpool, startTickIndex) {
    return {
        startTickIndex,
        ticks: exports.ZEROED_TICKS,
        whirlpool,
    };
}
//# sourceMappingURL=swap-utils.js.map