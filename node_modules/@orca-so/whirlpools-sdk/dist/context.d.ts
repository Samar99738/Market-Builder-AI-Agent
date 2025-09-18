import { AnchorProvider, Program } from "@coral-xyz/anchor";
import type { BuildOptions, LookupTableFetcher, TransactionBuilderOptions, Wallet, WrappedSolAccountCreateMethod } from "@orca-so/common-sdk";
import type { Commitment, Connection, PublicKey, SendOptions } from "@solana/web3.js";
import type { Whirlpool } from "./artifacts/whirlpool";
import type { WhirlpoolAccountFetcherInterface } from "./network/public";
export type WhirlpoolContextOpts = {
    userDefaultBuildOptions?: Partial<BuildOptions>;
    userDefaultSendOptions?: Partial<SendOptions>;
    userDefaultConfirmCommitment?: Commitment;
    accountResolverOptions?: AccountResolverOptions;
};
export type AccountResolverOptions = {
    createWrappedSolAccountMethod: WrappedSolAccountCreateMethod;
    allowPDAOwnerAddress: boolean;
};
export declare class WhirlpoolContext {
    readonly connection: Connection;
    readonly wallet: Wallet;
    readonly program: Program<Whirlpool>;
    readonly provider: AnchorProvider;
    readonly fetcher: WhirlpoolAccountFetcherInterface;
    readonly lookupTableFetcher: LookupTableFetcher | undefined;
    readonly opts: WhirlpoolContextOpts;
    readonly txBuilderOpts: TransactionBuilderOptions | undefined;
    readonly accountResolverOpts: AccountResolverOptions;
    static from(connection: Connection, wallet: Wallet, programId: PublicKey, fetcher?: WhirlpoolAccountFetcherInterface, lookupTableFetcher?: LookupTableFetcher, opts?: WhirlpoolContextOpts): WhirlpoolContext;
    static fromWorkspace(provider: AnchorProvider, program: Program, fetcher?: WhirlpoolAccountFetcherInterface, lookupTableFetcher?: LookupTableFetcher, opts?: WhirlpoolContextOpts): WhirlpoolContext;
    static withProvider(provider: AnchorProvider, programId: PublicKey, fetcher?: WhirlpoolAccountFetcherInterface, lookupTableFetcher?: LookupTableFetcher, opts?: WhirlpoolContextOpts): WhirlpoolContext;
    constructor(provider: AnchorProvider, wallet: Wallet, program: Program, fetcher: WhirlpoolAccountFetcherInterface, lookupTableFetcher?: LookupTableFetcher, opts?: WhirlpoolContextOpts);
}
