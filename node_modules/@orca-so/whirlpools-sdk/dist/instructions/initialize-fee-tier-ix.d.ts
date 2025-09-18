import type { Program } from "@coral-xyz/anchor";
import type { PDA } from "@orca-so/common-sdk";
import type { PublicKey } from "@solana/web3.js";
import type { Whirlpool } from "../artifacts/whirlpool";
import type { Instruction } from "@orca-so/common-sdk";
export type InitFeeTierParams = {
    whirlpoolsConfig: PublicKey;
    feeTierPda: PDA;
    tickSpacing: number;
    defaultFeeRate: number;
    feeAuthority: PublicKey;
    funder: PublicKey;
};
export declare function initializeFeeTierIx(program: Program<Whirlpool>, params: InitFeeTierParams): Instruction;
