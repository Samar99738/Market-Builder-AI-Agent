import type { Program } from "@coral-xyz/anchor";
import type { Instruction } from "@orca-so/common-sdk";
import type { PublicKey } from "@solana/web3.js";
import type { Whirlpool } from "../artifacts/whirlpool";
export type ClosePositionWithTokenExtensionsParams = {
    receiver: PublicKey;
    position: PublicKey;
    positionMint: PublicKey;
    positionTokenAccount: PublicKey;
    positionAuthority: PublicKey;
};
export declare function closePositionWithTokenExtensionsIx(program: Program<Whirlpool>, params: ClosePositionWithTokenExtensionsParams): Instruction;
