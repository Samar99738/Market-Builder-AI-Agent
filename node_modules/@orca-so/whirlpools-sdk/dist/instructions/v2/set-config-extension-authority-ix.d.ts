import type { Program } from "@coral-xyz/anchor";
import type { Instruction } from "@orca-so/common-sdk";
import type { PublicKey } from "@solana/web3.js";
import type { Whirlpool } from "../../artifacts/whirlpool";
export type SetConfigExtensionAuthorityParams = {
    whirlpoolsConfig: PublicKey;
    whirlpoolsConfigExtension: PublicKey;
    configExtensionAuthority: PublicKey;
    newConfigExtensionAuthority: PublicKey;
};
export declare function setConfigExtensionAuthorityIx(program: Program<Whirlpool>, params: SetConfigExtensionAuthorityParams): Instruction;
