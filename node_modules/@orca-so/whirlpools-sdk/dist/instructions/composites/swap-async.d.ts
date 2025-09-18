import { TransactionBuilder } from "@orca-so/common-sdk";
import type { PublicKey } from "@solana/web3.js";
import type { Whirlpool, WhirlpoolContext } from "../..";
import type { WhirlpoolAccountFetchOptions } from "../../network/public/fetcher";
import type { SwapInput } from "../swap-ix";
export type SwapAsyncParams = {
    swapInput: SwapInput;
    whirlpool: Whirlpool;
    wallet: PublicKey;
};
export declare function swapAsync(ctx: WhirlpoolContext, params: SwapAsyncParams, _opts: WhirlpoolAccountFetchOptions): Promise<TransactionBuilder>;
