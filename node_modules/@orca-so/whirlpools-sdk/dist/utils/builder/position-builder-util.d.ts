import type { WhirlpoolContext } from "../..";
import type { WhirlpoolAccountFetchOptions } from "../../network/public/fetcher";
import type { PositionData, WhirlpoolData } from "../../types/public";
export declare function getTickArrayDataForPosition(ctx: WhirlpoolContext, position: PositionData, whirlpool: WhirlpoolData, opts?: WhirlpoolAccountFetchOptions): Promise<readonly (import("../..").TickArrayData | null)[]>;
