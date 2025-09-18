"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.collectRewardsQuote = collectRewardsQuote;
const anchor_1 = require("@coral-xyz/anchor");
const common_sdk_1 = require("@orca-so/common-sdk");
const tiny_invariant_1 = __importDefault(require("tiny-invariant"));
const public_1 = require("../../types/public");
const bit_math_1 = require("../../utils/math/bit-math");
const pool_utils_1 = require("../../utils/public/pool-utils");
const token_extension_util_1 = require("../../utils/public/token-extension-util");
function collectRewardsQuote(param) {
    const { whirlpool, position, tickLower, tickUpper, timeStampInSeconds, tokenExtensionCtx, } = param;
    const { tickCurrentIndex, rewardInfos: whirlpoolRewardsInfos, rewardLastUpdatedTimestamp, } = whirlpool;
    const { tickLowerIndex, tickUpperIndex, liquidity, rewardInfos: positionRewardInfos, } = position;
    const currTimestampInSeconds = timeStampInSeconds ?? new anchor_1.BN(Date.now()).div(new anchor_1.BN(1000));
    const timestampDelta = currTimestampInSeconds.sub(new anchor_1.BN(rewardLastUpdatedTimestamp));
    const rewardOwed = [
        undefined,
        undefined,
        undefined,
    ];
    const transferFee = [
        undefined,
        undefined,
        undefined,
    ];
    for (let i = 0; i < public_1.NUM_REWARDS; i++) {
        const rewardInfo = whirlpoolRewardsInfos[i];
        const positionRewardInfo = positionRewardInfos[i];
        (0, tiny_invariant_1.default)(!!rewardInfo, "whirlpoolRewardsInfos cannot be undefined");
        const isRewardInitialized = pool_utils_1.PoolUtil.isRewardInitialized(rewardInfo);
        if (!isRewardInitialized) {
            continue;
        }
        let adjustedRewardGrowthGlobalX64 = rewardInfo.growthGlobalX64;
        if (!whirlpool.liquidity.isZero()) {
            const rewardGrowthDelta = bit_math_1.BitMath.mulDiv(timestampDelta, rewardInfo.emissionsPerSecondX64, whirlpool.liquidity, 128);
            adjustedRewardGrowthGlobalX64 =
                rewardInfo.growthGlobalX64.add(rewardGrowthDelta);
        }
        const tickLowerRewardGrowthsOutsideX64 = tickLower.rewardGrowthsOutside[i];
        const tickUpperRewardGrowthsOutsideX64 = tickUpper.rewardGrowthsOutside[i];
        let rewardGrowthsBelowX64 = adjustedRewardGrowthGlobalX64;
        if (tickLower.initialized) {
            rewardGrowthsBelowX64 =
                tickCurrentIndex < tickLowerIndex
                    ? common_sdk_1.MathUtil.subUnderflowU128(adjustedRewardGrowthGlobalX64, tickLowerRewardGrowthsOutsideX64)
                    : tickLowerRewardGrowthsOutsideX64;
        }
        let rewardGrowthsAboveX64 = new anchor_1.BN(0);
        if (tickUpper.initialized) {
            rewardGrowthsAboveX64 =
                tickCurrentIndex < tickUpperIndex
                    ? tickUpperRewardGrowthsOutsideX64
                    : common_sdk_1.MathUtil.subUnderflowU128(adjustedRewardGrowthGlobalX64, tickUpperRewardGrowthsOutsideX64);
        }
        const rewardGrowthInsideX64 = common_sdk_1.MathUtil.subUnderflowU128(common_sdk_1.MathUtil.subUnderflowU128(adjustedRewardGrowthGlobalX64, rewardGrowthsBelowX64), rewardGrowthsAboveX64);
        const amountOwedX64 = positionRewardInfo.amountOwed.shln(64);
        const amountOwed = amountOwedX64
            .add(common_sdk_1.MathUtil.subUnderflowU128(rewardGrowthInsideX64, positionRewardInfo.growthInsideCheckpoint).mul(liquidity))
            .shrn(64);
        const transferFeeExcluded = token_extension_util_1.TokenExtensionUtil.calculateTransferFeeExcludedAmount(amountOwed, tokenExtensionCtx.rewardTokenMintsWithProgram[i], tokenExtensionCtx.currentEpoch);
        rewardOwed[i] = transferFeeExcluded.amount;
        transferFee[i] = transferFeeExcluded.fee;
    }
    return {
        rewardOwed,
        transferFee: {
            deductedFromRewardOwed: transferFee,
        },
    };
}
//# sourceMappingURL=collect-rewards-quote.js.map