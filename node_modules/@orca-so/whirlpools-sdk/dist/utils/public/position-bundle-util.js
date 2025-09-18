"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PositionBundleUtil = void 0;
const tiny_invariant_1 = __importDefault(require("tiny-invariant"));
const public_1 = require("../../types/public");
class PositionBundleUtil {
    static checkBundleIndexInBounds(bundleIndex) {
        return bundleIndex >= 0 && bundleIndex < public_1.POSITION_BUNDLE_SIZE;
    }
    static isOccupied(positionBundle, bundleIndex) {
        (0, tiny_invariant_1.default)(PositionBundleUtil.checkBundleIndexInBounds(bundleIndex), "bundleIndex out of range");
        const array = PositionBundleUtil.convertBitmapToArray(positionBundle);
        return array[bundleIndex];
    }
    static isUnoccupied(positionBundle, bundleIndex) {
        return !PositionBundleUtil.isOccupied(positionBundle, bundleIndex);
    }
    static isFull(positionBundle) {
        const unoccupied = PositionBundleUtil.getUnoccupiedBundleIndexes(positionBundle);
        return unoccupied.length === 0;
    }
    static isEmpty(positionBundle) {
        const occupied = PositionBundleUtil.getOccupiedBundleIndexes(positionBundle);
        return occupied.length === 0;
    }
    static getOccupiedBundleIndexes(positionBundle) {
        const result = [];
        PositionBundleUtil.convertBitmapToArray(positionBundle).forEach((occupied, index) => {
            if (occupied) {
                result.push(index);
            }
        });
        return result;
    }
    static getUnoccupiedBundleIndexes(positionBundle) {
        const result = [];
        PositionBundleUtil.convertBitmapToArray(positionBundle).forEach((occupied, index) => {
            if (!occupied) {
                result.push(index);
            }
        });
        return result;
    }
    static findUnoccupiedBundleIndex(positionBundle) {
        const unoccupied = PositionBundleUtil.getUnoccupiedBundleIndexes(positionBundle);
        return unoccupied.length === 0 ? null : unoccupied[0];
    }
    static convertBitmapToArray(positionBundle) {
        const result = [];
        positionBundle.positionBitmap.map((bitmap) => {
            for (let offset = 0; offset < 8; offset++) {
                result.push((bitmap & (1 << offset)) !== 0);
            }
        });
        return result;
    }
}
exports.PositionBundleUtil = PositionBundleUtil;
//# sourceMappingURL=position-bundle-util.js.map