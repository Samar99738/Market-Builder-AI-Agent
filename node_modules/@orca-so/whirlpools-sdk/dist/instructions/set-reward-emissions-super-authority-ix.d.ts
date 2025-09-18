import type { Program } from "@coral-xyz/anchor";
import type { Instruction } from "@orca-so/common-sdk";
import type { PublicKey } from "@solana/web3.js";
import type { Whirlpool } from "../artifacts/whirlpool";
export type SetRewardEmissionsSuperAuthorityParams = {
    whirlpoolsConfig: PublicKey;
    rewardEmissionsSuperAuthority: PublicKey;
    newRewardEmissionsSuperAuthority: PublicKey;
};
export declare function setRewardEmissionsSuperAuthorityIx(program: Program<Whirlpool>, params: SetRewardEmissionsSuperAuthorityParams): Instruction;
