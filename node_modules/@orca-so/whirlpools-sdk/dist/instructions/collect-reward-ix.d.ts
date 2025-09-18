import type { Program } from "@coral-xyz/anchor";
import type { Instruction } from "@orca-so/common-sdk";
import type { PublicKey } from "@solana/web3.js";
import type { Whirlpool } from "../artifacts/whirlpool";
export type CollectRewardParams = {
    whirlpool: PublicKey;
    position: PublicKey;
    positionTokenAccount: PublicKey;
    rewardIndex: number;
    rewardOwnerAccount: PublicKey;
    rewardVault: PublicKey;
    positionAuthority: PublicKey;
};
export declare function collectRewardIx(program: Program<Whirlpool>, params: CollectRewardParams): Instruction;
