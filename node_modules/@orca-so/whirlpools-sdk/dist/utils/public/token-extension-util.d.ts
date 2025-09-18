import BN from "bn.js";
import type { MintWithTokenProgram } from "@orca-so/common-sdk";
import type { WhirlpoolAccountFetchOptions, WhirlpoolAccountFetcherInterface, WhirlpoolData } from "../..";
import type { AccountMeta, Connection } from "@solana/web3.js";
import { PublicKey } from "@solana/web3.js";
export type TransferFeeIncludedAmount = {
    amount: BN;
    fee: BN;
};
export type TransferFeeExcludedAmount = {
    amount: BN;
    fee: BN;
};
export type TokenExtensionContext = {
    currentEpoch: number;
    tokenMintWithProgramA: MintWithTokenProgram;
    tokenMintWithProgramB: MintWithTokenProgram;
    rewardTokenMintsWithProgram: [
        MintWithTokenProgram | null,
        MintWithTokenProgram | null,
        MintWithTokenProgram | null
    ];
};
export type TokenExtensionContextForPool = Omit<TokenExtensionContext, "rewardTokenMintsWithProgram">;
export type TokenExtensionContextForReward = Omit<TokenExtensionContext, "tokenMintWithProgramA" | "tokenMintWithProgramB">;
export declare const NO_TOKEN_EXTENSION_CONTEXT: TokenExtensionContext;
export declare class TokenExtensionUtil {
    static calculateTransferFeeIncludedAmount(transferFeeExcludedAmount: BN, tokenInfo: MintWithTokenProgram, currentEpoch: number): TransferFeeIncludedAmount;
    static calculateTransferFeeExcludedAmount(transferFeeIncludedAmount: BN, tokenInfo: MintWithTokenProgram, currentEpoch: number): TransferFeeExcludedAmount;
    static buildTokenExtensionContext(fetcher: WhirlpoolAccountFetcherInterface, whirlpoolData: WhirlpoolData, opts?: WhirlpoolAccountFetchOptions): Promise<TokenExtensionContext>;
    static buildTokenExtensionContextForPool(fetcher: WhirlpoolAccountFetcherInterface, tokenMintA: PublicKey, tokenMintB: PublicKey, opts?: WhirlpoolAccountFetchOptions): Promise<TokenExtensionContextForPool>;
    static getExtraAccountMetasForTransferHook(connection: Connection, tokenMintWithProgram: MintWithTokenProgram, source: PublicKey, destination: PublicKey, owner: PublicKey): Promise<AccountMeta[] | undefined>;
    static getExtraAccountMetasForTransferHookForPool(connection: Connection, tokenExtensionCtx: TokenExtensionContextForPool, sourceA: PublicKey, destinationA: PublicKey, ownerA: PublicKey, sourceB: PublicKey, destinationB: PublicKey, ownerB: PublicKey): Promise<{
        tokenTransferHookAccountsA: AccountMeta[] | undefined;
        tokenTransferHookAccountsB: AccountMeta[] | undefined;
    }>;
    static isV2IxRequiredPool(tokenExtensionCtx: TokenExtensionContextForPool): boolean;
    static isV2IxRequiredReward(tokenExtensionCtx: TokenExtensionContextForReward, rewardIndex: number): boolean;
}
