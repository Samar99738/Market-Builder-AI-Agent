import type { Program } from "@coral-xyz/anchor";
import type { PublicKey } from "@solana/web3.js";
import type { Whirlpool } from "../artifacts/whirlpool";
import type { Instruction } from "@orca-so/common-sdk";
export type UpdateFeesAndRewardsParams = {
    whirlpool: PublicKey;
    position: PublicKey;
    tickArrayLower: PublicKey;
    tickArrayUpper: PublicKey;
};
export declare function updateFeesAndRewardsIx(program: Program<Whirlpool>, params: UpdateFeesAndRewardsParams): Instruction;
