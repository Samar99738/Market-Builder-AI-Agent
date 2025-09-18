"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MultipleTransactionBuilderFactoryWithAccountResolver = void 0;
exports.convertListToMap = convertListToMap;
exports.filterNullObjects = filterNullObjects;
exports.checkMergedTransactionSizeIsValid = checkMergedTransactionSizeIsValid;
exports.contextOptionsToBuilderOptions = contextOptionsToBuilderOptions;
const common_sdk_1 = require("@orca-so/common-sdk");
const spl_token_1 = require("@solana/spl-token");
function convertListToMap(fetchedData, addresses) {
    const result = {};
    fetchedData.forEach((data, index) => {
        if (data) {
            const addr = addresses[index];
            result[addr] = data;
        }
    });
    return result;
}
function filterNullObjects(firstArray, secondArray) {
    const filteredFirstArray = [];
    const filteredSecondArray = [];
    firstArray.forEach((item, idx) => {
        if (item !== null) {
            filteredFirstArray.push(item);
            filteredSecondArray.push(secondArray[idx]);
        }
    });
    return [filteredFirstArray, filteredSecondArray];
}
async function checkMergedTransactionSizeIsValid(ctx, builders, latestBlockhash) {
    const merged = new common_sdk_1.TransactionBuilder(ctx.connection, ctx.wallet, ctx.txBuilderOpts);
    builders.forEach((builder) => merged.addInstruction(builder.compressIx(true)));
    try {
        await merged.txnSize({
            latestBlockhash,
        });
        return true;
    }
    catch {
        return false;
    }
}
function contextOptionsToBuilderOptions(opts) {
    return {
        defaultBuildOption: {
            ...common_sdk_1.defaultTransactionBuilderOptions.defaultBuildOption,
            ...opts.userDefaultBuildOptions,
        },
        defaultSendOption: {
            ...common_sdk_1.defaultTransactionBuilderOptions.defaultSendOption,
            ...opts.userDefaultSendOptions,
        },
        defaultConfirmationCommitment: opts.userDefaultConfirmCommitment ??
            common_sdk_1.defaultTransactionBuilderOptions.defaultConfirmationCommitment,
    };
}
class MultipleTransactionBuilderFactoryWithAccountResolver {
    ctx;
    resolvedAtas;
    tokenOwner;
    payer;
    txBuilders = [];
    pendingTxBuilder = null;
    touchedMints = null;
    accountExemption = null;
    constructor(ctx, resolvedAtas, tokenOwner = ctx.wallet.publicKey, payer = tokenOwner) {
        this.ctx = ctx;
        this.resolvedAtas = resolvedAtas;
        this.tokenOwner = tokenOwner;
        this.payer = payer;
    }
    async addInstructions(generator) {
        if (this.accountExemption === null) {
            this.accountExemption = await this.ctx.fetcher.getAccountRentExempt();
        }
        for (let iter = 0; iter < 2; iter++) {
            if (!this.pendingTxBuilder || !this.touchedMints) {
                this.pendingTxBuilder = new common_sdk_1.TransactionBuilder(this.ctx.connection, this.ctx.wallet, this.ctx.txBuilderOpts);
                this.touchedMints = new Set();
                this.resolvedAtas[spl_token_1.NATIVE_MINT.toBase58()] =
                    common_sdk_1.TokenUtil.createWrappedNativeAccountInstruction(this.tokenOwner, common_sdk_1.ZERO, this.accountExemption, this.payer, this.tokenOwner, this.ctx.accountResolverOpts.createWrappedSolAccountMethod);
            }
            const newTxBuilder = new common_sdk_1.TransactionBuilder(this.ctx.connection, this.ctx.wallet, this.ctx.txBuilderOpts);
            const resolve = (mint) => {
                if (!this.touchedMints.has(mint)) {
                    newTxBuilder.addInstruction(this.resolvedAtas[mint]);
                    this.touchedMints.add(mint);
                }
                return this.resolvedAtas[mint].address;
            };
            const ixs = await generator(resolve.bind(this));
            newTxBuilder.addInstructions(ixs);
            const mergeable = await checkMergedTransactionSizeIsValid(this.ctx, [this.pendingTxBuilder, newTxBuilder], common_sdk_1.MEASUREMENT_BLOCKHASH);
            if (mergeable) {
                this.pendingTxBuilder.addInstruction(newTxBuilder.compressIx(false));
                break;
            }
            else {
                if (iter !== 0) {
                    throw new Error(`instruction is too large.`);
                }
                this.txBuilders.push(this.pendingTxBuilder);
                this.pendingTxBuilder = null;
                this.touchedMints = null;
            }
        }
    }
    build() {
        return this.pendingTxBuilder
            ? [...this.txBuilders, this.pendingTxBuilder]
            : [...this.txBuilders];
    }
}
exports.MultipleTransactionBuilderFactoryWithAccountResolver = MultipleTransactionBuilderFactoryWithAccountResolver;
//# sourceMappingURL=txn-utils.js.map