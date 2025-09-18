import type { BN, Program } from "@coral-xyz/anchor";
import type { Instruction } from "@orca-so/common-sdk";
import type { PublicKey } from "@solana/web3.js";
import type { Whirlpool } from "../artifacts/whirlpool";
export type SetRewardEmissionsParams = {
    whirlpool: PublicKey;
    rewardIndex: number;
    rewardVaultKey: PublicKey;
    rewardAuthority: PublicKey;
    emissionsPerSecondX64: BN;
};
export declare function setRewardEmissionsIx(program: Program<Whirlpool>, params: SetRewardEmissionsParams): Instruction;
