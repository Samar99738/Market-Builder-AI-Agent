import type { Address } from "@coral-xyz/anchor";
import type { Percentage } from "@orca-so/common-sdk";
import type { PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import type Decimal from "decimal.js";
import type { IncreaseLiquidityInput } from "../../instructions";
import type { Whirlpool } from "../../whirlpool-client";
import type { TokenExtensionContextForPool } from "../../utils/public/token-extension-util";
export type IncreaseLiquidityQuoteParam = {
    inputTokenAmount: BN;
    inputTokenMint: PublicKey;
    tokenMintA: PublicKey;
    tokenMintB: PublicKey;
    tickCurrentIndex: number;
    sqrtPrice: BN;
    tickLowerIndex: number;
    tickUpperIndex: number;
    tokenExtensionCtx: TokenExtensionContextForPool;
    slippageTolerance: Percentage;
};
export type IncreaseLiquidityQuote = IncreaseLiquidityInput & IncreaseLiquidityEstimate;
type IncreaseLiquidityEstimate = {
    liquidityAmount: BN;
    tokenEstA: BN;
    tokenEstB: BN;
    transferFee: {
        deductingFromTokenMaxA: BN;
        deductingFromTokenMaxB: BN;
        deductingFromTokenEstA: BN;
        deductingFromTokenEstB: BN;
    };
};
export declare function increaseLiquidityQuoteByInputTokenUsingPriceSlippage(inputTokenMint: Address, inputTokenAmount: Decimal, tickLower: number, tickUpper: number, slippageTolerance: Percentage, whirlpool: Whirlpool, tokenExtensionCtx: TokenExtensionContextForPool): IncreaseLiquidityQuote;
export declare function increaseLiquidityQuoteByInputTokenWithParamsUsingPriceSlippage(param: IncreaseLiquidityQuoteParam): IncreaseLiquidityQuote;
export type IncreaseLiquidityQuoteByLiquidityParam = {
    liquidity: BN;
    tickCurrentIndex: number;
    sqrtPrice: BN;
    tickLowerIndex: number;
    tickUpperIndex: number;
    tokenExtensionCtx: TokenExtensionContextForPool;
    slippageTolerance: Percentage;
};
export declare function increaseLiquidityQuoteByLiquidityWithParams(params: IncreaseLiquidityQuoteByLiquidityParam): IncreaseLiquidityQuote;
export declare function increaseLiquidityQuoteByInputToken(inputTokenMint: Address, inputTokenAmount: Decimal, tickLower: number, tickUpper: number, slippageTolerance: Percentage, whirlpool: Whirlpool, tokenExtensionCtx: TokenExtensionContextForPool): IncreaseLiquidityQuote;
export declare function increaseLiquidityQuoteByInputTokenWithParams(param: IncreaseLiquidityQuoteParam): IncreaseLiquidityQuote;
export {};
