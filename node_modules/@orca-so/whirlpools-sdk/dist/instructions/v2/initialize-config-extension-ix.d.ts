import type { Program } from "@coral-xyz/anchor";
import type { Instruction, PDA } from "@orca-so/common-sdk";
import type { PublicKey } from "@solana/web3.js";
import type { Whirlpool } from "../../artifacts/whirlpool";
export type InitConfigExtensionParams = {
    whirlpoolsConfig: PublicKey;
    whirlpoolsConfigExtensionPda: PDA;
    funder: PublicKey;
    feeAuthority: PublicKey;
};
export declare function initializeConfigExtensionIx(program: Program<Whirlpool>, params: InitConfigExtensionParams): Instruction;
