import type { Program } from "@coral-xyz/anchor";
import type { Instruction } from "@orca-so/common-sdk";
import type { PublicKey } from "@solana/web3.js";
import type BN from "bn.js";
import type { Whirlpool } from "../artifacts/whirlpool";
export type SwapParams = SwapInput & {
    whirlpool: PublicKey;
    tokenOwnerAccountA: PublicKey;
    tokenOwnerAccountB: PublicKey;
    tokenVaultA: PublicKey;
    tokenVaultB: PublicKey;
    oracle: PublicKey;
    tokenAuthority: PublicKey;
};
export type SwapInput = {
    amount: BN;
    otherAmountThreshold: BN;
    sqrtPriceLimit: BN;
    amountSpecifiedIsInput: boolean;
    aToB: boolean;
    tickArray0: PublicKey;
    tickArray1: PublicKey;
    tickArray2: PublicKey;
    supplementalTickArrays?: PublicKey[];
};
export type DevFeeSwapInput = SwapInput & {
    devFeeAmount: BN;
};
export declare function swapIx(program: Program<Whirlpool>, params: SwapParams): Instruction;
