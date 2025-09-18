import type { TwoHopSwapInput } from "../../instructions";
import type { SwapEstimates, SwapQuote } from "./swap-quote";
export type TwoHopSwapQuote = NormalTwoHopSwapQuote;
export type NormalTwoHopSwapQuote = {
    swapOneEstimates: SwapEstimates;
    swapTwoEstimates: SwapEstimates;
} & TwoHopSwapInput;
export declare function twoHopSwapQuoteFromSwapQuotes(swapQuoteOne: SwapQuote, swapQuoteTwo: SwapQuote): TwoHopSwapQuote;
