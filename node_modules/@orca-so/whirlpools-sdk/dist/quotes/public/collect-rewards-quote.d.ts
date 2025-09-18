import { BN } from "@coral-xyz/anchor";
import type { PositionData, TickData, WhirlpoolData } from "../../types/public";
import type { TokenExtensionContextForReward } from "../../utils/public/token-extension-util";
export type CollectRewardsQuoteParam = {
    whirlpool: WhirlpoolData;
    position: PositionData;
    tickLower: TickData;
    tickUpper: TickData;
    tokenExtensionCtx: TokenExtensionContextForReward;
    timeStampInSeconds?: BN;
};
export type CollectRewardsQuote = {
    rewardOwed: [BN | undefined, BN | undefined, BN | undefined];
    transferFee: {
        deductedFromRewardOwed: [BN | undefined, BN | undefined, BN | undefined];
    };
};
export declare function collectRewardsQuote(param: CollectRewardsQuoteParam): CollectRewardsQuote;
