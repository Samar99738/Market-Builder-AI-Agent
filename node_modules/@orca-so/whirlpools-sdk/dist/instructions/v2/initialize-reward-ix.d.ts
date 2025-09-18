import type { Program } from "@coral-xyz/anchor";
import type { Keypair, PublicKey } from "@solana/web3.js";
import type { Whirlpool } from "../../artifacts/whirlpool";
import type { Instruction } from "@orca-so/common-sdk";
export type InitializeRewardV2Params = {
    whirlpool: PublicKey;
    rewardIndex: number;
    rewardMint: PublicKey;
    rewardTokenBadge: PublicKey;
    rewardVaultKeypair: Keypair;
    rewardAuthority: PublicKey;
    funder: PublicKey;
    rewardTokenProgram: PublicKey;
};
export declare function initializeRewardV2Ix(program: Program<Whirlpool>, params: InitializeRewardV2Params): Instruction;
