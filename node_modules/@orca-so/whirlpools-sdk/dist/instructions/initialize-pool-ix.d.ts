import type { BN, Program } from "@coral-xyz/anchor";
import type { Instruction, PDA } from "@orca-so/common-sdk";
import type { Keypair, PublicKey } from "@solana/web3.js";
import type { Whirlpool } from "../artifacts/whirlpool";
export type InitPoolParams = {
    initSqrtPrice: BN;
    whirlpoolsConfig: PublicKey;
    whirlpoolPda: PDA;
    tokenMintA: PublicKey;
    tokenMintB: PublicKey;
    tokenVaultAKeypair: Keypair;
    tokenVaultBKeypair: Keypair;
    feeTierKey: PublicKey;
    tickSpacing: number;
    funder: PublicKey;
};
export declare function initializePoolIx(program: Program<Whirlpool>, params: InitPoolParams): Instruction;
