import type { Program } from "@coral-xyz/anchor";
import type { Instruction } from "@orca-so/common-sdk";
import type { PublicKey } from "@solana/web3.js";
import type { Whirlpool } from "../artifacts/whirlpool";
export type SetFeeAuthorityParams = {
    whirlpoolsConfig: PublicKey;
    feeAuthority: PublicKey;
    newFeeAuthority: PublicKey;
};
export declare function setFeeAuthorityIx(program: Program<Whirlpool>, params: SetFeeAuthorityParams): Instruction;
