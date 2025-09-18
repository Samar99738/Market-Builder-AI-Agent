import { BN } from "@coral-xyz/anchor";
import type { Percentage } from "@orca-so/common-sdk";
import type { DecreaseLiquidityInput } from "../../instructions";
import type { TokenExtensionContextForPool } from "../../utils/public/token-extension-util";
import type { Position, Whirlpool } from "../../whirlpool-client";
export type DecreaseLiquidityQuoteParam = {
    liquidity: BN;
    tickCurrentIndex: number;
    sqrtPrice: BN;
    tickLowerIndex: number;
    tickUpperIndex: number;
    tokenExtensionCtx: TokenExtensionContextForPool;
    slippageTolerance: Percentage;
};
export type DecreaseLiquidityQuote = DecreaseLiquidityInput & {
    tokenEstA: BN;
    tokenEstB: BN;
    transferFee: {
        deductedFromTokenEstA: BN;
        deductedFromTokenEstB: BN;
        deductedFromTokenMinA: BN;
        deductedFromTokenMinB: BN;
    };
};
export declare function decreaseLiquidityQuoteByLiquidity(liquidity: BN, slippageTolerance: Percentage, position: Position, whirlpool: Whirlpool, tokenExtensionCtx: TokenExtensionContextForPool): DecreaseLiquidityQuote;
export declare function decreaseLiquidityQuoteByLiquidityWithParams(params: DecreaseLiquidityQuoteParam): DecreaseLiquidityQuote;
export declare function decreaseLiquidityQuoteByLiquidityWithParamsUsingPriceSlippage(params: DecreaseLiquidityQuoteParam): DecreaseLiquidityQuote;
