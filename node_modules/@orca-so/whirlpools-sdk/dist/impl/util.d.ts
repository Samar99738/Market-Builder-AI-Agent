import type { TokenInfo } from "..";
import type { WhirlpoolAccountFetchOptions, WhirlpoolAccountFetcherInterface } from "../network/public/fetcher";
import type { TokenAccountInfo, WhirlpoolData, WhirlpoolRewardInfo } from "../types/public";
export declare function getTokenMintInfos(fetcher: WhirlpoolAccountFetcherInterface, data: WhirlpoolData, opts?: WhirlpoolAccountFetchOptions): Promise<TokenInfo[]>;
export declare function getRewardInfos(fetcher: WhirlpoolAccountFetcherInterface, data: WhirlpoolData, opts?: WhirlpoolAccountFetchOptions): Promise<WhirlpoolRewardInfo[]>;
export declare function getTokenVaultAccountInfos(fetcher: WhirlpoolAccountFetcherInterface, data: WhirlpoolData, opts?: WhirlpoolAccountFetchOptions): Promise<TokenAccountInfo[]>;
