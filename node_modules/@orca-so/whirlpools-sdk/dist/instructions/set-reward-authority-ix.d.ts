import type { Program } from "@coral-xyz/anchor";
import type { Instruction } from "@orca-so/common-sdk";
import type { PublicKey } from "@solana/web3.js";
import type { Whirlpool } from "../artifacts/whirlpool";
export type SetRewardAuthorityParams = {
    whirlpool: PublicKey;
    rewardIndex: number;
    rewardAuthority: PublicKey;
    newRewardAuthority: PublicKey;
};
export declare function setRewardAuthorityIx(program: Program<Whirlpool>, params: SetRewardAuthorityParams): Instruction;
