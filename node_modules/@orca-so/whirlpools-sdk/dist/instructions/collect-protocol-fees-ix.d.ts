import type { Program } from "@coral-xyz/anchor";
import type { Instruction } from "@orca-so/common-sdk";
import type { PublicKey } from "@solana/web3.js";
import type { Whirlpool } from "../artifacts/whirlpool";
export type CollectProtocolFeesParams = {
    whirlpoolsConfig: PublicKey;
    whirlpool: PublicKey;
    tokenVaultA: PublicKey;
    tokenVaultB: PublicKey;
    tokenOwnerAccountA: PublicKey;
    tokenOwnerAccountB: PublicKey;
    collectProtocolFeesAuthority: PublicKey;
};
export declare function collectProtocolFeesIx(program: Program<Whirlpool>, params: CollectProtocolFeesParams): Instruction;
