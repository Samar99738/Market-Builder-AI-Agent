import type { Program } from "@coral-xyz/anchor";
import type { Instruction } from "@orca-so/common-sdk";
import type { PublicKey } from "@solana/web3.js";
import type { Whirlpool } from "../artifacts/whirlpool";
export type DeletePositionBundleParams = {
    owner: PublicKey;
    positionBundle: PublicKey;
    positionBundleMint: PublicKey;
    positionBundleTokenAccount: PublicKey;
    receiver: PublicKey;
};
export declare function deletePositionBundleIx(program: Program<Whirlpool>, params: DeletePositionBundleParams): Instruction;
