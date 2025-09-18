import type { Program } from "@coral-xyz/anchor";
import type { Instruction } from "@orca-so/common-sdk";
import type { PublicKey } from "@solana/web3.js";
import type { Whirlpool } from "../../artifacts/whirlpool";
export type DeleteTokenBadgeParams = {
    whirlpoolsConfig: PublicKey;
    whirlpoolsConfigExtension: PublicKey;
    tokenBadgeAuthority: PublicKey;
    tokenMint: PublicKey;
    tokenBadge: PublicKey;
    receiver: PublicKey;
};
export declare function deleteTokenBadgeIx(program: Program<Whirlpool>, params: DeleteTokenBadgeParams): Instruction;
