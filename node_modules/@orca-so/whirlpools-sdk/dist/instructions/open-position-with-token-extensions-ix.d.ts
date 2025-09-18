import type { Program } from "@coral-xyz/anchor";
import type { Instruction, PDA } from "@orca-so/common-sdk";
import type { PublicKey } from "@solana/web3.js";
import type { Whirlpool } from "../artifacts/whirlpool";
export type OpenPositionWithTokenExtensionsParams = {
    whirlpool: PublicKey;
    owner: PublicKey;
    positionPda: PDA;
    positionMint: PublicKey;
    positionTokenAccount: PublicKey;
    funder: PublicKey;
    tickLowerIndex: number;
    tickUpperIndex: number;
    withTokenMetadataExtension: boolean;
};
export declare function openPositionWithTokenExtensionsIx(program: Program<Whirlpool>, params: OpenPositionWithTokenExtensionsParams): Instruction;
