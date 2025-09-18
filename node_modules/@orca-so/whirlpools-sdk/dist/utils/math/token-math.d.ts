import type { Percentage } from "@orca-so/common-sdk";
import BN from "bn.js";
type AmountDeltaU64Valid = {
    type: "Valid";
    value: BN;
};
type AmountDeltaU64ExceedsMax = {
    type: "ExceedsMax";
    error: Error;
};
export declare class AmountDeltaU64 {
    private inner;
    constructor(inner: AmountDeltaU64Valid | AmountDeltaU64ExceedsMax);
    static fromValid(value: BN): AmountDeltaU64;
    static fromExceedsMax(error: Error): AmountDeltaU64;
    lte(other: BN): boolean;
    exceedsMax(): boolean;
    value(): BN;
    unwrap(): BN;
}
export declare function getAmountDeltaA(currSqrtPrice: BN, targetSqrtPrice: BN, currLiquidity: BN, roundUp: boolean): BN;
export declare function tryGetAmountDeltaA(currSqrtPrice: BN, targetSqrtPrice: BN, currLiquidity: BN, roundUp: boolean): AmountDeltaU64;
export declare function getAmountDeltaB(currSqrtPrice: BN, targetSqrtPrice: BN, currLiquidity: BN, roundUp: boolean): BN;
export declare function tryGetAmountDeltaB(currSqrtPrice: BN, targetSqrtPrice: BN, currLiquidity: BN, roundUp: boolean): AmountDeltaU64;
export declare function getNextSqrtPrice(sqrtPrice: BN, currLiquidity: BN, amount: BN, amountSpecifiedIsInput: boolean, aToB: boolean): BN;
export declare function adjustForSlippage(n: BN, { numerator, denominator }: Percentage, adjustUp: boolean): BN;
export {};
