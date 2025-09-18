import type { Program } from "@coral-xyz/anchor";
import type { Instruction } from "@orca-so/common-sdk";
import type { PublicKey } from "@solana/web3.js";
import type { Whirlpool } from "../artifacts/whirlpool";
export type SetDefaultProtocolFeeRateParams = {
    whirlpoolsConfig: PublicKey;
    feeAuthority: PublicKey;
    defaultProtocolFeeRate: number;
};
export declare function setDefaultProtocolFeeRateIx(program: Program<Whirlpool>, params: SetDefaultProtocolFeeRateParams): Instruction;
