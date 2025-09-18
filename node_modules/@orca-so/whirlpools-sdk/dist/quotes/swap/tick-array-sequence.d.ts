import type { TickArray, TickData } from "../../types/public";
import type { PublicKey } from "@solana/web3.js";
export declare class TickArraySequence {
    readonly tickSpacing: number;
    readonly aToB: boolean;
    private sequence;
    private touchedArrays;
    private startArrayIndex;
    constructor(tickArrays: Readonly<TickArray[]>, tickSpacing: number, aToB: boolean);
    isValidTickArray0(tickCurrentIndex: number): boolean;
    getNumOfTouchedArrays(): number;
    getTouchedArrays(minArraySize: number): PublicKey[];
    getTick(index: number): TickData;
    findNextInitializedTickIndex(currIndex: number): {
        nextIndex: number;
        nextTickData: TickData;
    } | {
        nextIndex: number;
        nextTickData: null;
    };
    private getLocalArrayIndex;
    private isArrayIndexInBounds;
    private checkIfIndexIsInTickArrayRange;
}
