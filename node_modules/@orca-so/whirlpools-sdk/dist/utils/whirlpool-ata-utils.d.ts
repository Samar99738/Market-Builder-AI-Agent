import type { Instruction, TransactionBuilder, WrappedSolAccountCreateMethod } from "@orca-so/common-sdk";
import { PublicKey } from "@solana/web3.js";
import type { WhirlpoolContext } from "..";
import type { WhirlpoolData } from "../types/public";
export declare enum TokenMintTypes {
    ALL = "ALL",
    POOL_ONLY = "POOL_ONLY",
    REWARD_ONLY = "REWARDS_ONLY"
}
export type WhirlpoolsTokenMints = {
    mintMap: PublicKey[];
    hasNativeMint: boolean;
};
export declare function getTokenMintsFromWhirlpools(whirlpoolDatas: (WhirlpoolData | null)[], mintTypes?: TokenMintTypes): WhirlpoolsTokenMints;
export type ResolveAtaInstructionParams = {
    mints: PublicKey[];
    accountExemption: number;
    receiver?: PublicKey;
    payer?: PublicKey;
};
export type ResolvedATAInstructionSet = {
    ataTokenAddresses: Record<string, PublicKey>;
    resolveAtaIxs: Instruction[];
};
export declare function resolveAtaForMints(ctx: WhirlpoolContext, params: ResolveAtaInstructionParams): Promise<ResolvedATAInstructionSet>;
export declare function addNativeMintHandlingIx(txBuilder: TransactionBuilder, affliatedTokenAtaMap: Record<string, PublicKey>, destinationWallet: PublicKey, accountExemption: number, createAccountMethod: WrappedSolAccountCreateMethod): void;
