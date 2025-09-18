import type { Program } from "@coral-xyz/anchor";
import type { Instruction } from "@orca-so/common-sdk";
import type { PublicKey } from "@solana/web3.js";
import type { Whirlpool } from "../artifacts/whirlpool";
export type SetRewardAuthorityBySuperAuthorityParams = {
    whirlpool: PublicKey;
    whirlpoolsConfig: PublicKey;
    rewardIndex: number;
    rewardEmissionsSuperAuthority: PublicKey;
    newRewardAuthority: PublicKey;
};
export declare function setRewardAuthorityBySuperAuthorityIx(program: Program<Whirlpool>, params: SetRewardAuthorityBySuperAuthorityParams): Instruction;
