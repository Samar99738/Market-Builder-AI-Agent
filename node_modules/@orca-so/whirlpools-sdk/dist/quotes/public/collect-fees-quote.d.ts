import type { BN } from "@coral-xyz/anchor";
import type { PositionData, TickData, WhirlpoolData } from "../../types/public";
import type { TokenExtensionContextForPool } from "../../utils/public/token-extension-util";
export type CollectFeesQuoteParam = {
    whirlpool: WhirlpoolData;
    position: PositionData;
    tickLower: TickData;
    tickUpper: TickData;
    tokenExtensionCtx: TokenExtensionContextForPool;
};
export type CollectFeesQuote = {
    feeOwedA: BN;
    feeOwedB: BN;
    transferFee: {
        deductedFromFeeOwedA: BN;
        deductedFromFeeOwedB: BN;
    };
};
export declare function collectFeesQuote(param: CollectFeesQuoteParam): CollectFeesQuote;
