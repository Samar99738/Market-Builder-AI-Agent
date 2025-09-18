import type { Program } from "@coral-xyz/anchor";
import type { Instruction } from "@orca-so/common-sdk";
import type { PublicKey } from "@solana/web3.js";
import type { Whirlpool } from "../../artifacts/whirlpool";
export type SetTokenBadgeAuthorityParams = {
    whirlpoolsConfig: PublicKey;
    whirlpoolsConfigExtension: PublicKey;
    configExtensionAuthority: PublicKey;
    newTokenBadgeAuthority: PublicKey;
};
export declare function setTokenBadgeAuthorityIx(program: Program<Whirlpool>, params: SetTokenBadgeAuthorityParams): Instruction;
