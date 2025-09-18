import type { Address } from "@coral-xyz/anchor";
import type { Percentage } from "@orca-so/common-sdk";
import type BN from "bn.js";
import type { WhirlpoolAccountFetchOptions, WhirlpoolAccountFetcherInterface } from "../../network/public/fetcher";
import type { Whirlpool } from "../../whirlpool-client";
import type { NormalSwapQuote } from "./swap-quote";
export type DevFeeSwapQuote = NormalSwapQuote & {
    amountSpecifiedIsInput: true;
    estimatedSwapFeeAmount: BN;
    devFeeAmount: BN;
};
export declare function swapQuoteByInputTokenWithDevFees(whirlpool: Whirlpool, inputTokenMint: Address, tokenAmount: BN, slippageTolerance: Percentage, programId: Address, fetcher: WhirlpoolAccountFetcherInterface, devFeePercentage: Percentage, opts?: WhirlpoolAccountFetchOptions): Promise<DevFeeSwapQuote>;
