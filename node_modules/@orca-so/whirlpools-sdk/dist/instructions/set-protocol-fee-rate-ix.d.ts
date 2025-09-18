import type { Program } from "@coral-xyz/anchor";
import type { Instruction } from "@orca-so/common-sdk";
import type { PublicKey } from "@solana/web3.js";
import type { Whirlpool } from "../artifacts/whirlpool";
export type SetProtocolFeeRateParams = {
    whirlpool: PublicKey;
    whirlpoolsConfig: PublicKey;
    feeAuthority: PublicKey;
    protocolFeeRate: number;
};
export declare function setProtocolFeeRateIx(program: Program<Whirlpool>, params: SetProtocolFeeRateParams): Instruction;
