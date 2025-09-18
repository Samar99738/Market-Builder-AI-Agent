import type { AccountMeta, PublicKey } from "@solana/web3.js";
export declare enum RemainingAccountsType {
    TransferHookA = "transferHookA",
    TransferHookB = "transferHookB",
    TransferHookReward = "transferHookReward",
    TransferHookInput = "transferHookInput",
    TransferHookIntermediate = "transferHookIntermediate",
    TransferHookOutput = "transferHookOutput",
    SupplementalTickArrays = "supplementalTickArrays",
    SupplementalTickArraysOne = "supplementalTickArraysOne",
    SupplementalTickArraysTwo = "supplementalTickArraysTwo"
}
type RemainingAccountsAnchorType = {
    transferHookA: object;
} | {
    transferHookB: object;
} | {
    transferHookReward: object;
} | {
    transferHookInput: object;
} | {
    transferHookIntermediate: object;
} | {
    transferHookOutput: object;
} | {
    supplementalTickArrays: object;
} | {
    supplementalTickArraysOne: object;
} | {
    supplementalTickArraysTwo: object;
};
export type RemainingAccountsSliceData = {
    accountsType: RemainingAccountsAnchorType;
    length: number;
};
export type RemainingAccountsInfoData = {
    slices: RemainingAccountsSliceData[];
};
export type OptionRemainingAccountsInfoData = RemainingAccountsInfoData | null;
export declare class RemainingAccountsBuilder {
    private remainingAccounts;
    private slices;
    addSlice(accountsType: RemainingAccountsType, accounts?: AccountMeta[]): this;
    build(): [OptionRemainingAccountsInfoData, AccountMeta[] | undefined];
}
export declare function toSupplementalTickArrayAccountMetas(tickArrayPubkeys: PublicKey[] | undefined): AccountMeta[] | undefined;
export {};
