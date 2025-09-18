"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TickArrayUtil = exports.TickUtil = void 0;
const common_sdk_1 = require("@orca-so/common-sdk");
const tiny_invariant_1 = __importDefault(require("tiny-invariant"));
const public_1 = require("../../types/public");
const pda_utils_1 = require("./pda-utils");
var TickSearchDirection;
(function (TickSearchDirection) {
    TickSearchDirection[TickSearchDirection["Left"] = 0] = "Left";
    TickSearchDirection[TickSearchDirection["Right"] = 1] = "Right";
})(TickSearchDirection || (TickSearchDirection = {}));
class TickUtil {
    static getOffsetIndex(tickIndex, arrayStartIndex, tickSpacing) {
        return Math.floor((tickIndex - arrayStartIndex) / tickSpacing);
    }
    static getStartTickIndex(tickIndex, tickSpacing, offset = 0) {
        const realIndex = Math.floor(tickIndex / tickSpacing / public_1.TICK_ARRAY_SIZE);
        const startTickIndex = (realIndex + offset) * tickSpacing * public_1.TICK_ARRAY_SIZE;
        const ticksInArray = public_1.TICK_ARRAY_SIZE * tickSpacing;
        const minTickIndex = public_1.MIN_TICK_INDEX - ((public_1.MIN_TICK_INDEX % ticksInArray) + ticksInArray);
        (0, tiny_invariant_1.default)(startTickIndex >= minTickIndex, `startTickIndex is too small - - ${startTickIndex}`);
        (0, tiny_invariant_1.default)(startTickIndex <= public_1.MAX_TICK_INDEX, `startTickIndex is too large - ${startTickIndex}`);
        return startTickIndex;
    }
    static getInitializableTickIndex(tickIndex, tickSpacing) {
        return tickIndex - (tickIndex % tickSpacing);
    }
    static getNextInitializableTickIndex(tickIndex, tickSpacing) {
        return (TickUtil.getInitializableTickIndex(tickIndex, tickSpacing) + tickSpacing);
    }
    static getPrevInitializableTickIndex(tickIndex, tickSpacing) {
        return (TickUtil.getInitializableTickIndex(tickIndex, tickSpacing) - tickSpacing);
    }
    static findPreviousInitializedTickIndex(account, currentTickIndex, tickSpacing) {
        return TickUtil.findInitializedTick(account, currentTickIndex, tickSpacing, TickSearchDirection.Left);
    }
    static findNextInitializedTickIndex(account, currentTickIndex, tickSpacing) {
        return TickUtil.findInitializedTick(account, currentTickIndex, tickSpacing, TickSearchDirection.Right);
    }
    static findInitializedTick(account, currentTickIndex, tickSpacing, searchDirection) {
        const currentTickArrayIndex = tickIndexToInnerIndex(account.startTickIndex, currentTickIndex, tickSpacing);
        const increment = searchDirection === TickSearchDirection.Right ? 1 : -1;
        let stepInitializedTickArrayIndex = searchDirection === TickSearchDirection.Right
            ? currentTickArrayIndex + increment
            : currentTickArrayIndex;
        while (stepInitializedTickArrayIndex >= 0 &&
            stepInitializedTickArrayIndex < account.ticks.length) {
            if (account.ticks[stepInitializedTickArrayIndex]?.initialized) {
                return innerIndexToTickIndex(account.startTickIndex, stepInitializedTickArrayIndex, tickSpacing);
            }
            stepInitializedTickArrayIndex += increment;
        }
        return null;
    }
    static checkTickInBounds(tick) {
        return tick <= public_1.MAX_TICK_INDEX && tick >= public_1.MIN_TICK_INDEX;
    }
    static isTickInitializable(tick, tickSpacing) {
        return tick % tickSpacing === 0;
    }
    static invertTick(tick) {
        return -tick;
    }
    static getFullRangeTickIndex(tickSpacing) {
        return [
            Math.ceil(public_1.MIN_TICK_INDEX / tickSpacing) * tickSpacing,
            Math.floor(public_1.MAX_TICK_INDEX / tickSpacing) * tickSpacing,
        ];
    }
    static isFullRange(tickSpacing, tickLowerIndex, tickUpperIndex) {
        const [min, max] = TickUtil.getFullRangeTickIndex(tickSpacing);
        return tickLowerIndex === min && tickUpperIndex === max;
    }
    static isFullRangeOnly(tickSpacing) {
        return tickSpacing >= public_1.FULL_RANGE_ONLY_TICK_SPACING_THRESHOLD;
    }
}
exports.TickUtil = TickUtil;
class TickArrayUtil {
    static getTickFromArray(tickArray, tickIndex, tickSpacing) {
        const realIndex = tickIndexToInnerIndex(tickArray.startTickIndex, tickIndex, tickSpacing);
        const tick = tickArray.ticks[realIndex];
        (0, tiny_invariant_1.default)(!!tick, `tick realIndex out of range - start - ${tickArray.startTickIndex} index - ${tickIndex}, realIndex - ${realIndex}`);
        return tick;
    }
    static getTickArrayPDAs(tick, tickSpacing, numOfTickArrays, programId, whirlpoolAddress, aToB) {
        let arrayIndexList = [...Array(numOfTickArrays).keys()];
        if (aToB) {
            arrayIndexList = arrayIndexList.map((value) => -value);
        }
        return arrayIndexList.map((value) => {
            const startTick = TickUtil.getStartTickIndex(tick, tickSpacing, value);
            return pda_utils_1.PDAUtil.getTickArray(programId, whirlpoolAddress, startTick);
        });
    }
    static async getUninitializedArraysString(tickArrayAddrs, fetcher, opts) {
        const taAddrs = common_sdk_1.AddressUtil.toPubKeys(tickArrayAddrs);
        const tickArrayData = await fetcher.getTickArrays(taAddrs, opts);
        if (tickArrayData) {
            const uninitializedIndices = TickArrayUtil.getUninitializedArrays(tickArrayData);
            if (uninitializedIndices.length > 0) {
                const uninitializedArrays = uninitializedIndices
                    .map((index) => taAddrs[index].toBase58())
                    .join(", ");
                return uninitializedArrays;
            }
        }
        return null;
    }
    static async getUninitializedArraysPDAs(ticks, programId, whirlpoolAddress, tickSpacing, fetcher, opts) {
        const startTicks = ticks.map((tick) => TickUtil.getStartTickIndex(tick, tickSpacing));
        const removeDupeTicks = [...new Set(startTicks)];
        const tickArrayPDAs = removeDupeTicks.map((tick) => pda_utils_1.PDAUtil.getTickArray(programId, whirlpoolAddress, tick));
        const fetchedArrays = await fetcher.getTickArrays(tickArrayPDAs.map((pda) => pda.publicKey), opts);
        const uninitializedIndices = TickArrayUtil.getUninitializedArrays(fetchedArrays);
        return uninitializedIndices.map((index) => {
            return {
                startIndex: removeDupeTicks[index],
                pda: tickArrayPDAs[index],
            };
        });
    }
    static getUninitializedArrays(tickArrays) {
        return tickArrays
            .map((value, index) => {
            if (!value) {
                return index;
            }
            return -1;
        })
            .filter((index) => index >= 0);
    }
}
exports.TickArrayUtil = TickArrayUtil;
function tickIndexToInnerIndex(startTickIndex, tickIndex, tickSpacing) {
    return Math.floor((tickIndex - startTickIndex) / tickSpacing);
}
function innerIndexToTickIndex(startTickIndex, tickArrayIndex, tickSpacing) {
    return startTickIndex + tickArrayIndex * tickSpacing;
}
//# sourceMappingURL=tick-utils.js.map