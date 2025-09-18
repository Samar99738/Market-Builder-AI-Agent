import type { BN, Program } from "@coral-xyz/anchor";
import type { Instruction } from "@orca-so/common-sdk";
import type { PublicKey } from "@solana/web3.js";
import type { Whirlpool } from "../artifacts/whirlpool";
export type DecreaseLiquidityParams = {
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
} & DecreaseLiquidityInput;
export type DecreaseLiquidityInput = {
    tokenMinA: BN;
    tokenMinB: BN;
    liquidityAmount: BN;
};
export declare function decreaseLiquidityIx(program: Program<Whirlpool>, params: DecreaseLiquidityParams): Instruction;
