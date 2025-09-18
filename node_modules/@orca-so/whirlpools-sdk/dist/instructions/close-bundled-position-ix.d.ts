import type { Program } from "@coral-xyz/anchor";
import type { Instruction } from "@orca-so/common-sdk";
import type { PublicKey } from "@solana/web3.js";
import type { Whirlpool } from "../artifacts/whirlpool";
export type CloseBundledPositionParams = {
    bundledPosition: PublicKey;
    positionBundle: PublicKey;
    positionBundleTokenAccount: PublicKey;
    positionBundleAuthority: PublicKey;
    bundleIndex: number;
    receiver: PublicKey;
};
export declare function closeBundledPositionIx(program: Program<Whirlpool>, params: CloseBundledPositionParams): Instruction;
