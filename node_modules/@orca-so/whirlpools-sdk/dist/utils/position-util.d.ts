import type { BN } from "@coral-xyz/anchor";
import type { Percentage } from "@orca-so/common-sdk";
export declare enum SwapDirection {
    AtoB = "Swap A to B",
    BtoA = "Swap B to A"
}
export declare enum AmountSpecified {
    Input = "Specified input amount",
    Output = "Specified output amount"
}
export declare enum PositionStatus {
    BelowRange = 0,
    InRange = 1,
    AboveRange = 2
}
export declare class PositionUtil {
    static getPositionStatus(tickCurrentIndex: number, tickLowerIndex: number, tickUpperIndex: number): PositionStatus;
    static getStrictPositionStatus(sqrtPriceX64: BN, tickLowerIndex: number, tickUpperIndex: number): PositionStatus;
}
export declare function adjustForSlippage(n: BN, { numerator, denominator }: Percentage, adjustUp: boolean): BN;
export declare function adjustAmountForSlippage(amountIn: BN, amountOut: BN, { numerator, denominator }: Percentage, amountSpecified: AmountSpecified): BN;
export declare function getLiquidityFromTokenA(amount: BN, sqrtPriceLowerX64: BN, sqrtPriceUpperX64: BN, roundUp: boolean): BN;
export declare function getLiquidityFromTokenB(amount: BN, sqrtPriceLowerX64: BN, sqrtPriceUpperX64: BN, roundUp: boolean): BN;
export declare function getAmountFixedDelta(currentSqrtPriceX64: BN, targetSqrtPriceX64: BN, liquidity: BN, amountSpecified: AmountSpecified, swapDirection: SwapDirection): BN;
export declare function getAmountUnfixedDelta(currentSqrtPriceX64: BN, targetSqrtPriceX64: BN, liquidity: BN, amountSpecified: AmountSpecified, swapDirection: SwapDirection): BN;
export declare function getNextSqrtPrice(sqrtPriceX64: BN, liquidity: BN, amount: BN, amountSpecified: AmountSpecified, swapDirection: SwapDirection): BN;
export declare function getTokenAFromLiquidity(liquidity: BN, sqrtPrice0X64: BN, sqrtPrice1X64: BN, roundUp: boolean): BN;
export declare function getTokenBFromLiquidity(liquidity: BN, sqrtPrice0X64: BN, sqrtPrice1X64: BN, roundUp: boolean): BN;
