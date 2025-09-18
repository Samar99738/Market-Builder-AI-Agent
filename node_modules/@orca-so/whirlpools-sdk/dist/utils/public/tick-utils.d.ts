import type { Address } from "@coral-xyz/anchor";
import type { PDA } from "@orca-so/common-sdk";
import type { PublicKey } from "@solana/web3.js";
import type { WhirlpoolAccountFetchOptions, WhirlpoolAccountFetcherInterface } from "../../network/public/fetcher";
import type { TickArrayData, TickData } from "../../types/public";
export declare class TickUtil {
    static getOffsetIndex(tickIndex: number, arrayStartIndex: number, tickSpacing: number): number;
    static getStartTickIndex(tickIndex: number, tickSpacing: number, offset?: number): number;
    static getInitializableTickIndex(tickIndex: number, tickSpacing: number): number;
    static getNextInitializableTickIndex(tickIndex: number, tickSpacing: number): number;
    static getPrevInitializableTickIndex(tickIndex: number, tickSpacing: number): number;
    static findPreviousInitializedTickIndex(account: TickArrayData, currentTickIndex: number, tickSpacing: number): number | null;
    static findNextInitializedTickIndex(account: TickArrayData, currentTickIndex: number, tickSpacing: number): number | null;
    private static findInitializedTick;
    static checkTickInBounds(tick: number): boolean;
    static isTickInitializable(tick: number, tickSpacing: number): boolean;
    static invertTick(tick: number): number;
    static getFullRangeTickIndex(tickSpacing: number): [number, number];
    static isFullRange(tickSpacing: number, tickLowerIndex: number, tickUpperIndex: number): boolean;
    static isFullRangeOnly(tickSpacing: number): boolean;
}
export declare class TickArrayUtil {
    static getTickFromArray(tickArray: TickArrayData, tickIndex: number, tickSpacing: number): TickData;
    static getTickArrayPDAs(tick: number, tickSpacing: number, numOfTickArrays: number, programId: PublicKey, whirlpoolAddress: PublicKey, aToB: boolean): PDA[];
    static getUninitializedArraysString(tickArrayAddrs: Address[], fetcher: WhirlpoolAccountFetcherInterface, opts?: WhirlpoolAccountFetchOptions): Promise<string | null>;
    static getUninitializedArraysPDAs(ticks: number[], programId: PublicKey, whirlpoolAddress: PublicKey, tickSpacing: number, fetcher: WhirlpoolAccountFetcherInterface, opts: WhirlpoolAccountFetchOptions): Promise<{
        startIndex: number;
        pda: PDA;
    }[]>;
    static getUninitializedArrays(tickArrays: readonly (TickArrayData | null)[]): number[];
}
