import type { Program } from "@coral-xyz/anchor";
import type { Instruction, PDA } from "@orca-so/common-sdk";
import type { Keypair, PublicKey } from "@solana/web3.js";
import type { Whirlpool } from "../artifacts/whirlpool";
export type InitializePositionBundleParams = {
    owner: PublicKey;
    positionBundlePda: PDA;
    positionBundleMintKeypair: Keypair;
    positionBundleTokenAccount: PublicKey;
    funder: PublicKey;
};
export declare function initializePositionBundleIx(program: Program<Whirlpool>, params: InitializePositionBundleParams): Instruction;
export declare function initializePositionBundleWithMetadataIx(program: Program<Whirlpool>, params: InitializePositionBundleParams & {
    positionBundleMetadataPda: PDA;
}): Instruction;
