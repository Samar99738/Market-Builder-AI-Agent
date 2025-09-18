import type { PublicKey } from "@solana/web3.js";
import type BN from "bn.js";
import type { TickArrayData, TickData } from "../types/public";
export declare function getLowerSqrtPriceFromTokenA(amount: BN, liquidity: BN, sqrtPriceX64: BN): BN;
export declare function getUpperSqrtPriceFromTokenA(amount: BN, liquidity: BN, sqrtPriceX64: BN): BN;
export declare function getLowerSqrtPriceFromTokenB(amount: BN, liquidity: BN, sqrtPriceX64: BN): BN;
export declare function getUpperSqrtPriceFromTokenB(amount: BN, liquidity: BN, sqrtPriceX64: BN): BN;
export type TickArrayAddress = {
    pubkey: PublicKey;
    startTickIndex: number;
};
export declare function getTickArrayPublicKeysWithStartTickIndex(tickCurrentIndex: number, tickSpacing: number, aToB: boolean, programId: PublicKey, whirlpoolAddress: PublicKey): TickArrayAddress[];
export declare const ZEROED_TICK_DATA: TickData;
export declare const ZEROED_TICKS: TickData[];
export declare function buildZeroedTickArray(whirlpool: PublicKey, startTickIndex: number): TickArrayData;
