import { BN } from "@coral-xyz/anchor";
import type { Percentage } from "@orca-so/common-sdk";
import Decimal from "decimal.js";
export declare class PriceMath {
    static priceToSqrtPriceX64(price: Decimal, decimalsA: number, decimalsB: number): BN;
    static sqrtPriceX64ToPrice(sqrtPriceX64: BN, decimalsA: number, decimalsB: number): Decimal;
    static tickIndexToSqrtPriceX64(tickIndex: number): BN;
    static sqrtPriceX64ToTickIndex(sqrtPriceX64: BN): number;
    static tickIndexToPrice(tickIndex: number, decimalsA: number, decimalsB: number): Decimal;
    static priceToTickIndex(price: Decimal, decimalsA: number, decimalsB: number): number;
    static priceToInitializableTickIndex(price: Decimal, decimalsA: number, decimalsB: number, tickSpacing: number): number;
    static invertPrice(price: Decimal, decimalsA: number, decimalsB: number): Decimal;
    static invertSqrtPriceX64(sqrtPriceX64: BN): BN;
    static getSlippageBoundForSqrtPrice(sqrtPriceX64: BN, slippage: Percentage): {
        lowerBound: [BN, number];
        upperBound: [BN, number];
    };
}
