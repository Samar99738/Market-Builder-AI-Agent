import type { Program } from "@coral-xyz/anchor";
import type { Instruction, PDA } from "@orca-so/common-sdk";
import type { PublicKey } from "@solana/web3.js";
import type { Whirlpool } from "../artifacts/whirlpool";
export type OpenBundledPositionParams = {
    whirlpool: PublicKey;
    bundledPositionPda: PDA;
    positionBundle: PublicKey;
    positionBundleTokenAccount: PublicKey;
    positionBundleAuthority: PublicKey;
    bundleIndex: number;
    tickLowerIndex: number;
    tickUpperIndex: number;
    funder: PublicKey;
};
export declare function openBundledPositionIx(program: Program<Whirlpool>, params: OpenBundledPositionParams): Instruction;
