import type { Program } from "@coral-xyz/anchor";
import type { Keypair, PublicKey } from "@solana/web3.js";
import type { Whirlpool } from "../artifacts/whirlpool";
import type { Instruction } from "@orca-so/common-sdk";
export type InitConfigParams = {
    whirlpoolsConfigKeypair: Keypair;
    feeAuthority: PublicKey;
    collectProtocolFeesAuthority: PublicKey;
    rewardEmissionsSuperAuthority: PublicKey;
    defaultProtocolFeeRate: number;
    funder: PublicKey;
};
export declare function initializeConfigIx(program: Program<Whirlpool>, params: InitConfigParams): Instruction;
