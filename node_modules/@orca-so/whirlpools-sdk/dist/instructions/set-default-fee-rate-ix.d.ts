import type { Program } from "@coral-xyz/anchor";
import type { Instruction } from "@orca-so/common-sdk";
import type { PublicKey } from "@solana/web3.js";
import type { Whirlpool } from "../artifacts/whirlpool";
export type SetDefaultFeeRateParams = {
    whirlpoolsConfig: PublicKey;
    feeAuthority: PublicKey;
    tickSpacing: number;
    defaultFeeRate: number;
};
export declare function setDefaultFeeRateIx(program: Program<Whirlpool>, params: SetDefaultFeeRateParams): Instruction;
