import type { Program } from "@coral-xyz/anchor";
import type { Instruction } from "@orca-so/common-sdk";
import type { AccountMeta, PublicKey } from "@solana/web3.js";
import type { Whirlpool } from "../../artifacts/whirlpool";
export type CollectRewardV2Params = {
    whirlpool: PublicKey;
    position: PublicKey;
    positionTokenAccount: PublicKey;
    positionAuthority: PublicKey;
    rewardIndex: number;
    rewardMint: PublicKey;
    rewardOwnerAccount: PublicKey;
    rewardVault: PublicKey;
    rewardTransferHookAccounts?: AccountMeta[];
    rewardTokenProgram: PublicKey;
};
export declare function collectRewardV2Ix(program: Program<Whirlpool>, params: CollectRewardV2Params): Instruction;
