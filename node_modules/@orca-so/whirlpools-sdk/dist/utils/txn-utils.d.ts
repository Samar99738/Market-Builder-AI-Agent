import type { Instruction, ResolvedTokenAddressInstruction, TransactionBuilderOptions } from "@orca-so/common-sdk";
import { TransactionBuilder } from "@orca-so/common-sdk";
import type { WhirlpoolContext, WhirlpoolContextOpts as WhirlpoolContextOptions } from "..";
import type { PublicKey } from "@solana/web3.js";
export declare function convertListToMap<T>(fetchedData: T[], addresses: string[]): Record<string, T>;
export declare function filterNullObjects<T, K>(firstArray: ReadonlyArray<T | null>, secondArray: ReadonlyArray<K>): [Array<T>, Array<K>];
export declare function checkMergedTransactionSizeIsValid(ctx: WhirlpoolContext, builders: TransactionBuilder[], latestBlockhash: Readonly<{
    blockhash: string;
    lastValidBlockHeight: number;
}>): Promise<boolean>;
export declare function contextOptionsToBuilderOptions(opts: WhirlpoolContextOptions): TransactionBuilderOptions | undefined;
export declare class MultipleTransactionBuilderFactoryWithAccountResolver {
    private ctx;
    private resolvedAtas;
    private tokenOwner;
    private payer;
    private txBuilders;
    private pendingTxBuilder;
    private touchedMints;
    private accountExemption;
    constructor(ctx: WhirlpoolContext, resolvedAtas: Record<string, ResolvedTokenAddressInstruction>, tokenOwner?: PublicKey, payer?: PublicKey);
    addInstructions(generator: (resolve: (mint: string) => PublicKey) => Promise<Instruction[]>): Promise<void>;
    build(): TransactionBuilder[];
}
