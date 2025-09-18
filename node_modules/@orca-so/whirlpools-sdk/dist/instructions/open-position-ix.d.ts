import type { Program } from "@coral-xyz/anchor";
import type { Instruction, PDA } from "@orca-so/common-sdk";
import type { PublicKey } from "@solana/web3.js";
import type { Whirlpool } from "../artifacts/whirlpool";
export type OpenPositionParams = {
    whirlpool: PublicKey;
    owner: PublicKey;
    positionPda: PDA;
    positionMintAddress: PublicKey;
    positionTokenAccount: PublicKey;
    tickLowerIndex: number;
    tickUpperIndex: number;
    funder: PublicKey;
};
export declare function openPositionIx(program: Program<Whirlpool>, params: OpenPositionParams): Instruction;
export declare function openPositionWithMetadataIx(program: Program<Whirlpool>, params: OpenPositionParams & {
    metadataPda: PDA;
}): Instruction;
