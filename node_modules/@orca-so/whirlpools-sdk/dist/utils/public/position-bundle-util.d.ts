import type { PositionBundleData } from "../../types/public";
export declare class PositionBundleUtil {
    static checkBundleIndexInBounds(bundleIndex: number): boolean;
    static isOccupied(positionBundle: PositionBundleData, bundleIndex: number): boolean;
    static isUnoccupied(positionBundle: PositionBundleData, bundleIndex: number): boolean;
    static isFull(positionBundle: PositionBundleData): boolean;
    static isEmpty(positionBundle: PositionBundleData): boolean;
    static getOccupiedBundleIndexes(positionBundle: PositionBundleData): number[];
    static getUnoccupiedBundleIndexes(positionBundle: PositionBundleData): number[];
    static findUnoccupiedBundleIndex(positionBundle: PositionBundleData): number | null;
    static convertBitmapToArray(positionBundle: PositionBundleData): boolean[];
}
