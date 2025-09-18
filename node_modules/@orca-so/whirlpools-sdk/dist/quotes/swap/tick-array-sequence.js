"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TickArraySequence = void 0;
const errors_1 = require("../../errors/errors");
const public_1 = require("../../types/public");
const tick_array_index_1 = require("./tick-array-index");
class TickArraySequence {
    tickSpacing;
    aToB;
    sequence;
    touchedArrays;
    startArrayIndex;
    constructor(tickArrays, tickSpacing, aToB) {
        this.tickSpacing = tickSpacing;
        this.aToB = aToB;
        if (!tickArrays[0] || !tickArrays[0].data) {
            throw new Error("TickArray index 0 must be initialized");
        }
        this.sequence = [];
        for (const tickArray of tickArrays) {
            if (!tickArray || !tickArray.data) {
                break;
            }
            this.sequence.push({
                address: tickArray.address,
                startTickIndex: tickArray.data.startTickIndex,
                data: tickArray.data,
            });
        }
        this.touchedArrays = [...Array(this.sequence.length).fill(false)];
        this.startArrayIndex = tick_array_index_1.TickArrayIndex.fromTickIndex(this.sequence[0].data.startTickIndex, this.tickSpacing).arrayIndex;
    }
    isValidTickArray0(tickCurrentIndex) {
        const shift = this.aToB ? 0 : this.tickSpacing;
        const tickArray = this.sequence[0].data;
        return this.checkIfIndexIsInTickArrayRange(tickArray.startTickIndex, tickCurrentIndex + shift);
    }
    getNumOfTouchedArrays() {
        return this.touchedArrays.filter((val) => !!val).length;
    }
    getTouchedArrays(minArraySize) {
        let result = this.touchedArrays.reduce((prev, curr, index) => {
            if (curr) {
                prev.push(this.sequence[index].address);
            }
            return prev;
        }, []);
        if (result.length === 0) {
            return [];
        }
        const sizeDiff = minArraySize - result.length;
        if (sizeDiff > 0) {
            result = result.concat(Array(sizeDiff).fill(result[result.length - 1]));
        }
        return result;
    }
    getTick(index) {
        const targetTaIndex = tick_array_index_1.TickArrayIndex.fromTickIndex(index, this.tickSpacing);
        if (!this.isArrayIndexInBounds(targetTaIndex, this.aToB)) {
            throw new Error("Provided tick index is out of bounds for this sequence.");
        }
        const localArrayIndex = this.getLocalArrayIndex(targetTaIndex.arrayIndex, this.aToB);
        const tickArray = this.sequence[localArrayIndex].data;
        this.touchedArrays[localArrayIndex] = true;
        if (!tickArray) {
            throw new errors_1.WhirlpoolsError(`TickArray at index ${localArrayIndex} is not initialized.`, errors_1.SwapErrorCode.TickArrayIndexNotInitialized);
        }
        if (!this.checkIfIndexIsInTickArrayRange(tickArray.startTickIndex, index)) {
            throw new errors_1.WhirlpoolsError(`TickArray at index ${localArrayIndex} is unexpected for this sequence.`, errors_1.SwapErrorCode.TickArraySequenceInvalid);
        }
        return tickArray.ticks[targetTaIndex.offsetIndex];
    }
    findNextInitializedTickIndex(currIndex) {
        const searchIndex = this.aToB ? currIndex : currIndex + this.tickSpacing;
        let currTaIndex = tick_array_index_1.TickArrayIndex.fromTickIndex(searchIndex, this.tickSpacing);
        if (!this.isArrayIndexInBounds(currTaIndex, this.aToB)) {
            throw new errors_1.WhirlpoolsError(`Swap input value traversed too many arrays. Out of bounds at attempt to traverse tick index - ${currTaIndex.toTickIndex()}.`, errors_1.SwapErrorCode.TickArraySequenceInvalid);
        }
        while (this.isArrayIndexInBounds(currTaIndex, this.aToB)) {
            const currTickData = this.getTick(currTaIndex.toTickIndex());
            if (currTickData.initialized) {
                return {
                    nextIndex: currTaIndex.toTickIndex(),
                    nextTickData: currTickData,
                };
            }
            currTaIndex = this.aToB
                ? currTaIndex.toPrevInitializableTickIndex()
                : currTaIndex.toNextInitializableTickIndex();
        }
        const lastIndexInArray = Math.max(Math.min(this.aToB
            ? currTaIndex.toTickIndex() + this.tickSpacing
            : currTaIndex.toTickIndex() - 1, public_1.MAX_TICK_INDEX), public_1.MIN_TICK_INDEX);
        return { nextIndex: lastIndexInArray, nextTickData: null };
    }
    getLocalArrayIndex(arrayIndex, aToB) {
        return aToB
            ? this.startArrayIndex - arrayIndex
            : arrayIndex - this.startArrayIndex;
    }
    isArrayIndexInBounds(index, aToB) {
        const localArrayIndex = this.getLocalArrayIndex(index.arrayIndex, aToB);
        const seqLength = this.sequence.length;
        return localArrayIndex >= 0 && localArrayIndex < seqLength;
    }
    checkIfIndexIsInTickArrayRange(startTick, tickIndex) {
        const upperBound = startTick + this.tickSpacing * public_1.TICK_ARRAY_SIZE;
        return tickIndex >= startTick && tickIndex < upperBound;
    }
}
exports.TickArraySequence = TickArraySequence;
//# sourceMappingURL=tick-array-sequence.js.map