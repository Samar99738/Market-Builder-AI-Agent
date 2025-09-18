import type { Program } from "@coral-xyz/anchor";
import type { Instruction, PDA } from "@orca-so/common-sdk";
import type { PublicKey } from "@solana/web3.js";
import type { Whirlpool } from "../../artifacts/whirlpool";
export type InitializeTokenBadgeParams = {
    whirlpoolsConfig: PublicKey;
    whirlpoolsConfigExtension: PublicKey;
    tokenBadgeAuthority: PublicKey;
    tokenMint: PublicKey;
    tokenBadgePda: PDA;
    funder: PublicKey;
};
export declare function initializeTokenBadgeIx(program: Program<Whirlpool>, params: InitializeTokenBadgeParams): Instruction;
