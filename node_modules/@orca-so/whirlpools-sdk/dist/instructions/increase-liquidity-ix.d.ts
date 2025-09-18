import type { Program } from "@coral-xyz/anchor";
import type { PublicKey } from "@solana/web3.js";
import type BN from "bn.js";
import type { Whirlpool } from "../artifacts/whirlpool";
import type { Instruction } from "@orca-so/common-sdk";
export type IncreaseLiquidityParams = {
    whirlpool: PublicKey;
    position: PublicKey;
    positionTokenAccount: PublicKey;
    tokenOwnerAccountA: PublicKey;
    tokenOwnerAccountB: PublicKey;
    tokenVaultA: PublicKey;
    tokenVaultB: PublicKey;
    tickArrayLower: PublicKey;
    tickArrayUpper: PublicKey;
    positionAuthority: PublicKey;
} & IncreaseLiquidityInput;
export type IncreaseLiquidityInput = {
    tokenMaxA: BN;
    tokenMaxB: BN;
    liquidityAmount: BN;
};
export declare function increaseLiquidityIx(program: Program<Whirlpool>, params: IncreaseLiquidityParams): Instruction;
