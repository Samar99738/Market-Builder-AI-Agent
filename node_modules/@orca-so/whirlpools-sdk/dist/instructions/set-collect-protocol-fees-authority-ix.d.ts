import type { Program } from "@coral-xyz/anchor";
import type { Instruction } from "@orca-so/common-sdk";
import type { PublicKey } from "@solana/web3.js";
import type { Whirlpool } from "../artifacts/whirlpool";
export type SetCollectProtocolFeesAuthorityParams = {
    whirlpoolsConfig: PublicKey;
    collectProtocolFeesAuthority: PublicKey;
    newCollectProtocolFeesAuthority: PublicKey;
};
export declare function setCollectProtocolFeesAuthorityIx(program: Program<Whirlpool>, params: SetCollectProtocolFeesAuthorityParams): Instruction;
