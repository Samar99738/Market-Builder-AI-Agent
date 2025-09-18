import type { Program } from "@coral-xyz/anchor";
import type { Instruction } from "@orca-so/common-sdk";
import type { PublicKey } from "@solana/web3.js";
import type { Whirlpool } from "../artifacts/whirlpool";
export type SetFeeRateParams = {
    whirlpool: PublicKey;
    whirlpoolsConfig: PublicKey;
    feeAuthority: PublicKey;
    feeRate: number;
};
export declare function setFeeRateIx(program: Program<Whirlpool>, params: SetFeeRateParams): Instruction;
