import type { Address } from "@coral-xyz/anchor";
import { TransactionBuilder } from "@orca-so/common-sdk";
import { PublicKey } from "@solana/web3.js";
import type { PositionData, WhirlpoolContext } from "../..";
import type { WhirlpoolAccountFetchOptions } from "../../network/public/fetcher";
export type CollectAllPositionAddressParams = {
    positions: Address[];
} & CollectAllParams;
export type CollectAllPositionParams = {
    positions: Record<string, PositionData>;
} & CollectAllParams;
export type CollectAllParams = {
    receiver?: PublicKey;
    positionOwner?: PublicKey;
    positionAuthority?: PublicKey;
    payer?: PublicKey;
};
export declare function collectAllForPositionAddressesTxns(ctx: WhirlpoolContext, params: CollectAllPositionAddressParams, opts?: WhirlpoolAccountFetchOptions): Promise<TransactionBuilder[]>;
export declare function collectAllForPositionsTxns(ctx: WhirlpoolContext, params: CollectAllPositionParams): Promise<TransactionBuilder[]>;
