import type { Address } from "@orca-so/common-sdk";
import type { Connection } from "@solana/web3.js";
import type { PositionBundleData, PositionData, WhirlpoolData } from "../../../types/public";
import type { WhirlpoolContext } from "../../..";
export declare function getAllWhirlpoolAccountsForConfig({ connection, programId, configId, }: {
    connection: Connection;
    programId: Address;
    configId: Address;
}): Promise<ReadonlyMap<string, WhirlpoolData>>;
export type PositionMap = {
    positions: ReadonlyMap<string, PositionData>;
    positionsWithTokenExtensions: ReadonlyMap<string, PositionData>;
    positionBundles: BundledPositionMap[];
};
export type BundledPositionMap = {
    positionBundleAddress: Address;
    positionBundleData: PositionBundleData;
    bundledPositions: ReadonlyMap<number, PositionData>;
};
export declare function getAllPositionAccountsByOwner({ ctx, owner, includesPositions, includesPositionsWithTokenExtensions, includesBundledPositions, }: {
    ctx: WhirlpoolContext;
    owner: Address;
    includesPositions?: boolean;
    includesPositionsWithTokenExtensions?: boolean;
    includesBundledPositions?: boolean;
}): Promise<PositionMap>;
