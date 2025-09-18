import type { Program } from "@coral-xyz/anchor";
import type { PublicKey } from "@solana/web3.js";
import type { Whirlpool } from "../artifacts/whirlpool";
import type { Instruction } from "@orca-so/common-sdk";
export type CollectFeesParams = {
    whirlpool: PublicKey;
    position: PublicKey;
    positionTokenAccount: PublicKey;
    tokenOwnerAccountA: PublicKey;
    tokenOwnerAccountB: PublicKey;
    tokenVaultA: PublicKey;
    tokenVaultB: PublicKey;
    positionAuthority: PublicKey;
};
export declare function collectFeesIx(program: Program<Whirlpool>, params: CollectFeesParams): Instruction;
