import type { Program } from "@coral-xyz/anchor";
import type { Instruction, PDA } from "@orca-so/common-sdk";
import type { PublicKey } from "@solana/web3.js";
import type { Whirlpool } from "../artifacts/whirlpool";
export type InitTickArrayParams = {
    whirlpool: PublicKey;
    tickArrayPda: PDA;
    startTick: number;
    funder: PublicKey;
};
export declare function initTickArrayIx(program: Program<Whirlpool>, params: InitTickArrayParams): Instruction;
