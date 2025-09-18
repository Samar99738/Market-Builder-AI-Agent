"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenExtensionUtil = exports.NO_TOKEN_EXTENSION_CONTEXT = void 0;
const spl_token_1 = require("@solana/spl-token");
const bn_js_1 = __importDefault(require("bn.js"));
const common_sdk_1 = require("@orca-so/common-sdk");
const __1 = require("../..");
const web3_js_1 = require("@solana/web3.js");
const defaultTokenMintWithProgram = {
    address: web3_js_1.PublicKey.default,
    decimals: 0,
    freezeAuthority: null,
    mintAuthority: null,
    isInitialized: true,
    supply: 0n,
    tlvData: Buffer.from([]),
    tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
};
exports.NO_TOKEN_EXTENSION_CONTEXT = {
    currentEpoch: 0,
    tokenMintWithProgramA: defaultTokenMintWithProgram,
    tokenMintWithProgramB: defaultTokenMintWithProgram,
    rewardTokenMintsWithProgram: [
        defaultTokenMintWithProgram,
        defaultTokenMintWithProgram,
        defaultTokenMintWithProgram,
    ],
};
class TokenExtensionUtil {
    static calculateTransferFeeIncludedAmount(transferFeeExcludedAmount, tokenInfo, currentEpoch) {
        const config = (0, spl_token_1.getTransferFeeConfig)(tokenInfo);
        if (config === null) {
            return { amount: transferFeeExcludedAmount, fee: common_sdk_1.ZERO };
        }
        const transferFee = (0, spl_token_1.getEpochFee)(config, BigInt(currentEpoch));
        return calculateTransferFeeIncludedAmount(transferFee, transferFeeExcludedAmount);
    }
    static calculateTransferFeeExcludedAmount(transferFeeIncludedAmount, tokenInfo, currentEpoch) {
        const config = (0, spl_token_1.getTransferFeeConfig)(tokenInfo);
        if (config === null) {
            return { amount: transferFeeIncludedAmount, fee: common_sdk_1.ZERO };
        }
        const transferFee = (0, spl_token_1.getEpochFee)(config, BigInt(currentEpoch));
        return calculateTransferFeeExcludedAmount(transferFee, transferFeeIncludedAmount);
    }
    static async buildTokenExtensionContext(fetcher, whirlpoolData, opts) {
        const mintA = whirlpoolData.tokenMintA;
        const mintB = whirlpoolData.tokenMintB;
        const rewards = whirlpoolData.rewardInfos;
        const [tokenMintWithProgram, currentEpoch] = await Promise.all([
            fetcher.getMintInfos([
                mintA,
                mintB,
                ...rewards
                    .filter((r) => __1.PoolUtil.isRewardInitialized(r))
                    .map((r) => r.mint),
            ], opts),
            fetcher.getEpoch(),
        ]);
        const get = (mint) => tokenMintWithProgram.get(mint.toBase58());
        return {
            tokenMintWithProgramA: get(whirlpoolData.tokenMintA),
            tokenMintWithProgramB: get(whirlpoolData.tokenMintB),
            rewardTokenMintsWithProgram: [
                __1.PoolUtil.isRewardInitialized(rewards[0]) ? get(rewards[0].mint) : null,
                __1.PoolUtil.isRewardInitialized(rewards[1]) ? get(rewards[1].mint) : null,
                __1.PoolUtil.isRewardInitialized(rewards[2]) ? get(rewards[2].mint) : null,
            ],
            currentEpoch,
        };
    }
    static async buildTokenExtensionContextForPool(fetcher, tokenMintA, tokenMintB, opts) {
        const [tokenMintWithProgram, currentEpoch] = await Promise.all([
            fetcher.getMintInfos([tokenMintA, tokenMintB], opts),
            fetcher.getEpoch(),
        ]);
        const get = (mint) => tokenMintWithProgram.get(mint.toBase58());
        return {
            tokenMintWithProgramA: get(tokenMintA),
            tokenMintWithProgramB: get(tokenMintB),
            currentEpoch,
        };
    }
    static async getExtraAccountMetasForTransferHook(connection, tokenMintWithProgram, source, destination, owner) {
        const transferHook = (0, spl_token_1.getTransferHook)(tokenMintWithProgram);
        if (!transferHook)
            return undefined;
        const instruction = new web3_js_1.TransactionInstruction({
            programId: spl_token_1.TOKEN_2022_PROGRAM_ID,
            keys: [
                { pubkey: source, isSigner: false, isWritable: false },
                {
                    pubkey: tokenMintWithProgram.address,
                    isSigner: false,
                    isWritable: false,
                },
                { pubkey: destination, isSigner: false, isWritable: false },
                { pubkey: owner, isSigner: false, isWritable: false },
                { pubkey: owner, isSigner: false, isWritable: false },
            ],
        });
        await (0, spl_token_1.addExtraAccountMetasForExecute)(connection, instruction, transferHook.programId, source, tokenMintWithProgram.address, destination, owner, 0n, "confirmed");
        const extraAccountMetas = instruction.keys.slice(5);
        return extraAccountMetas.length > 0 ? extraAccountMetas : undefined;
    }
    static async getExtraAccountMetasForTransferHookForPool(connection, tokenExtensionCtx, sourceA, destinationA, ownerA, sourceB, destinationB, ownerB) {
        const [tokenTransferHookAccountsA, tokenTransferHookAccountsB] = await Promise.all([
            TokenExtensionUtil.getExtraAccountMetasForTransferHook(connection, tokenExtensionCtx.tokenMintWithProgramA, sourceA, destinationA, ownerA),
            TokenExtensionUtil.getExtraAccountMetasForTransferHook(connection, tokenExtensionCtx.tokenMintWithProgramB, sourceB, destinationB, ownerB),
        ]);
        return {
            tokenTransferHookAccountsA,
            tokenTransferHookAccountsB,
        };
    }
    static isV2IxRequiredPool(tokenExtensionCtx) {
        return (tokenExtensionCtx.tokenMintWithProgramA.tokenProgram.equals(spl_token_1.TOKEN_2022_PROGRAM_ID) ||
            tokenExtensionCtx.tokenMintWithProgramB.tokenProgram.equals(spl_token_1.TOKEN_2022_PROGRAM_ID));
    }
    static isV2IxRequiredReward(tokenExtensionCtx, rewardIndex) {
        return (tokenExtensionCtx.rewardTokenMintsWithProgram[rewardIndex]?.tokenProgram.equals(spl_token_1.TOKEN_2022_PROGRAM_ID) ?? false);
    }
}
exports.TokenExtensionUtil = TokenExtensionUtil;
function ceilDivBN(num, denom) {
    return num.add(denom.subn(1)).div(denom);
}
function calculateTransferFeeIncludedAmount(transferFee, amount) {
    const ONE_IN_BASIS_POINTS = 10_000;
    const maxFeeBN = new bn_js_1.default(transferFee.maximumFee.toString());
    if (transferFee.transferFeeBasisPoints === 0) {
        return {
            amount,
            fee: common_sdk_1.ZERO,
        };
    }
    if (amount.isZero()) {
        return {
            amount,
            fee: common_sdk_1.ZERO,
        };
    }
    if (transferFee.transferFeeBasisPoints === ONE_IN_BASIS_POINTS) {
        if (amount.add(maxFeeBN).gt(common_sdk_1.U64_MAX)) {
            throw new Error("The total amount and fees overflow");
        }
        return {
            amount: amount.add(maxFeeBN),
            fee: maxFeeBN,
        };
    }
    const num = amount.muln(ONE_IN_BASIS_POINTS);
    const denom = new bn_js_1.default(ONE_IN_BASIS_POINTS - transferFee.transferFeeBasisPoints);
    const rawFeeIncludedAmount = ceilDivBN(num, denom);
    const result = rawFeeIncludedAmount.sub(amount).gte(maxFeeBN)
        ? { amount: amount.add(maxFeeBN), fee: maxFeeBN }
        : { amount: rawFeeIncludedAmount, fee: rawFeeIncludedAmount.sub(amount) };
    if (result.amount.gt(common_sdk_1.U64_MAX)) {
        throw new Error("The total amount and fees overflow");
    }
    return { ...result };
}
function calculateTransferFeeExcludedAmount(transferFee, amount) {
    const fee = (0, spl_token_1.calculateFee)(transferFee, BigInt(amount.toString()));
    const feeBN = new bn_js_1.default(fee.toString());
    return {
        amount: amount.sub(feeBN),
        fee: feeBN,
    };
}
//# sourceMappingURL=token-extension-util.js.map