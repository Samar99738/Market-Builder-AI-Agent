import type { Program } from "@coral-xyz/anchor";
import type { Keypair, PublicKey } from "@solana/web3.js";
import type { Whirlpool } from "../artifacts/whirlpool";
import type { Instruction } from "@orca-so/common-sdk";
export type InitializeRewardParams = {
    whirlpool: PublicKey;
    rewardIndex: number;
    rewardMint: PublicKey;
    rewardVaultKeypair: Keypair;
    rewardAuthority: PublicKey;
    funder: PublicKey;
};
export declare function initializeRewardIx(program: Program<Whirlpool>, params: InitializeRewardParams): Instruction;
