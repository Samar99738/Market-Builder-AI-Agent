"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.collectAllForPositionAddressesTxns = collectAllForPositionAddressesTxns;
exports.collectAllForPositionsTxns = collectAllForPositionsTxns;
const common_sdk_1 = require("@orca-so/common-sdk");
const spl_token_1 = require("@solana/spl-token");
const web3_js_1 = require("@solana/web3.js");
const ix_1 = require("../../ix");
const fetcher_1 = require("../../network/public/fetcher");
const public_1 = require("../../utils/public");
const txn_utils_1 = require("../../utils/txn-utils");
const whirlpool_ata_utils_1 = require("../../utils/whirlpool-ata-utils");
const update_fees_and_rewards_ix_1 = require("../update-fees-and-rewards-ix");
const token_extension_util_1 = require("../../utils/public/token-extension-util");
async function collectAllForPositionAddressesTxns(ctx, params, opts = fetcher_1.PREFER_CACHE) {
    const { positions, ...rest } = params;
    const fetchedPositions = await ctx.fetcher.getPositions(positions, opts);
    const positionMap = {};
    fetchedPositions.forEach((pos, addr) => {
        if (pos) {
            positionMap[addr] = pos;
        }
    });
    return collectAllForPositionsTxns(ctx, { positions: positionMap, ...rest });
}
async function collectAllForPositionsTxns(ctx, params) {
    const { positions, receiver, positionAuthority, positionOwner, payer } = params;
    const receiverKey = receiver ?? ctx.wallet.publicKey;
    const positionAuthorityKey = positionAuthority ?? ctx.wallet.publicKey;
    const positionOwnerKey = positionOwner ?? ctx.wallet.publicKey;
    const payerKey = payer ?? ctx.wallet.publicKey;
    const positionList = Object.entries(positions);
    if (positionList.length === 0) {
        return [];
    }
    const whirlpoolAddrs = positionList.map(([, pos]) => pos.whirlpool.toBase58());
    const whirlpools = await ctx.fetcher.getPools(whirlpoolAddrs, fetcher_1.PREFER_CACHE);
    const allMints = (0, whirlpool_ata_utils_1.getTokenMintsFromWhirlpools)(Array.from(whirlpools.values()));
    const accountExemption = await ctx.fetcher.getAccountRentExempt();
    const positionMintAddrs = positionList.map(([, pos]) => pos.positionMint);
    const positionMintInfos = await ctx.fetcher.getMintInfos(positionMintAddrs);
    await ctx.fetcher.getMintInfos(allMints.mintMap);
    const resolvedAtas = (0, txn_utils_1.convertListToMap)(await (0, common_sdk_1.resolveOrCreateATAs)(ctx.connection, receiverKey, allMints.mintMap.map((tokenMint) => ({ tokenMint })), async () => accountExemption, payerKey, true, ctx.accountResolverOpts.allowPDAOwnerAddress, ctx.accountResolverOpts.createWrappedSolAccountMethod), allMints.mintMap.map((mint) => mint.toBase58()));
    const latestBlockhash = await ctx.connection.getLatestBlockhash();
    const txBuilders = [];
    const collectionTasks = [];
    positionList.forEach(([positionAddr, position]) => {
        const whirlpool = whirlpools.get(position.whirlpool.toBase58());
        if (!whirlpool) {
            throw new Error(`Unable to process positionMint ${position.positionMint.toBase58()} - unable to derive whirlpool ${position.whirlpool.toBase58()}`);
        }
        const positionMintInfo = positionMintInfos.get(position.positionMint.toBase58());
        if (!positionMintInfo) {
            throw new Error(`Unable to process positionMint ${position.positionMint.toBase58()} - missing mint info`);
        }
        collectionTasks.push({
            collectionType: "fee",
            positionAddr,
            position,
            whirlpool,
            positionMintTokenProgramId: positionMintInfo.tokenProgram,
        });
        whirlpool.rewardInfos.forEach((rewardInfo, index) => {
            if (public_1.PoolUtil.isRewardInitialized(rewardInfo)) {
                collectionTasks.push({
                    collectionType: "reward",
                    rewardIndex: index,
                    positionAddr,
                    position,
                    whirlpool,
                    positionMintTokenProgramId: positionMintInfo.tokenProgram,
                });
            }
        });
    });
    let cursor = 0;
    let pendingTxBuilder = null;
    let touchedMints = null;
    let lastUpdatedPosition = null;
    let reattempt = false;
    while (cursor < collectionTasks.length) {
        if (!pendingTxBuilder || !touchedMints) {
            pendingTxBuilder = new common_sdk_1.TransactionBuilder(ctx.connection, ctx.wallet, ctx.txBuilderOpts);
            touchedMints = new Set();
            resolvedAtas[spl_token_1.NATIVE_MINT.toBase58()] =
                common_sdk_1.TokenUtil.createWrappedNativeAccountInstruction(receiverKey, common_sdk_1.ZERO, accountExemption, undefined, undefined, ctx.accountResolverOpts.createWrappedSolAccountMethod);
        }
        const task = collectionTasks[cursor];
        const alreadyUpdated = lastUpdatedPosition === task.positionAddr;
        const collectIxForPosition = await constructCollectIxForPosition(ctx, task, alreadyUpdated, positionOwnerKey, positionAuthorityKey, resolvedAtas, touchedMints);
        const positionTxBuilder = new common_sdk_1.TransactionBuilder(ctx.connection, ctx.wallet, ctx.txBuilderOpts);
        positionTxBuilder.addInstructions(collectIxForPosition);
        const mergeable = await (0, txn_utils_1.checkMergedTransactionSizeIsValid)(ctx, [pendingTxBuilder, positionTxBuilder], latestBlockhash);
        if (mergeable) {
            pendingTxBuilder.addInstruction(positionTxBuilder.compressIx(false));
            cursor += 1;
            lastUpdatedPosition = task.positionAddr;
            reattempt = false;
        }
        else {
            if (reattempt) {
                throw new Error(`Unable to fit collection ix for ${task.position.positionMint.toBase58()} in a Transaction.`);
            }
            txBuilders.push(pendingTxBuilder);
            pendingTxBuilder = null;
            touchedMints = null;
            lastUpdatedPosition = null;
            reattempt = true;
        }
    }
    if (pendingTxBuilder) {
        txBuilders.push(pendingTxBuilder);
    }
    return txBuilders;
}
const constructCollectIxForPosition = async (ctx, task, alreadyUpdated, positionOwner, positionAuthority, resolvedAtas, touchedMints) => {
    const ixForPosition = [];
    const { whirlpool: whirlpoolKey, liquidity, tickLowerIndex, tickUpperIndex, positionMint, } = task.position;
    const positionMintTokenProgramId = task.positionMintTokenProgramId;
    const whirlpool = task.whirlpool;
    const { tickSpacing } = whirlpool;
    const mintA = whirlpool.tokenMintA.toBase58();
    const mintB = whirlpool.tokenMintB.toBase58();
    const tokenExtensionCtx = await token_extension_util_1.TokenExtensionUtil.buildTokenExtensionContext(ctx.fetcher, whirlpool, fetcher_1.PREFER_CACHE);
    const positionTokenAccount = (0, spl_token_1.getAssociatedTokenAddressSync)(positionMint, positionOwner, ctx.accountResolverOpts.allowPDAOwnerAddress, positionMintTokenProgramId);
    if (!liquidity.eq(common_sdk_1.ZERO) && !alreadyUpdated) {
        ixForPosition.push((0, update_fees_and_rewards_ix_1.updateFeesAndRewardsIx)(ctx.program, {
            position: new web3_js_1.PublicKey(task.positionAddr),
            whirlpool: whirlpoolKey,
            tickArrayLower: public_1.PDAUtil.getTickArray(ctx.program.programId, whirlpoolKey, public_1.TickUtil.getStartTickIndex(tickLowerIndex, tickSpacing)).publicKey,
            tickArrayUpper: public_1.PDAUtil.getTickArray(ctx.program.programId, whirlpoolKey, public_1.TickUtil.getStartTickIndex(tickUpperIndex, tickSpacing)).publicKey,
        }));
    }
    if (task.collectionType === "fee") {
        if (!touchedMints.has(mintA)) {
            ixForPosition.push(resolvedAtas[mintA]);
            touchedMints.add(mintA);
        }
        if (!touchedMints.has(mintB)) {
            ixForPosition.push(resolvedAtas[mintB]);
            touchedMints.add(mintB);
        }
        const collectFeesBaseParams = {
            whirlpool: whirlpoolKey,
            position: new web3_js_1.PublicKey(task.positionAddr),
            positionAuthority,
            positionTokenAccount,
            tokenOwnerAccountA: resolvedAtas[mintA].address,
            tokenOwnerAccountB: resolvedAtas[mintB].address,
            tokenVaultA: whirlpool.tokenVaultA,
            tokenVaultB: whirlpool.tokenVaultB,
        };
        ixForPosition.push(!token_extension_util_1.TokenExtensionUtil.isV2IxRequiredPool(tokenExtensionCtx)
            ? ix_1.WhirlpoolIx.collectFeesIx(ctx.program, collectFeesBaseParams)
            : ix_1.WhirlpoolIx.collectFeesV2Ix(ctx.program, {
                ...collectFeesBaseParams,
                tokenMintA: tokenExtensionCtx.tokenMintWithProgramA.address,
                tokenMintB: tokenExtensionCtx.tokenMintWithProgramB.address,
                tokenProgramA: tokenExtensionCtx.tokenMintWithProgramA.tokenProgram,
                tokenProgramB: tokenExtensionCtx.tokenMintWithProgramB.tokenProgram,
                ...(await token_extension_util_1.TokenExtensionUtil.getExtraAccountMetasForTransferHookForPool(ctx.connection, tokenExtensionCtx, collectFeesBaseParams.tokenVaultA, collectFeesBaseParams.tokenOwnerAccountA, collectFeesBaseParams.whirlpool, collectFeesBaseParams.tokenVaultB, collectFeesBaseParams.tokenOwnerAccountB, collectFeesBaseParams.whirlpool)),
            }));
    }
    else {
        const index = task.rewardIndex;
        const rewardInfo = whirlpool.rewardInfos[index];
        const mintReward = rewardInfo.mint.toBase58();
        if (!touchedMints.has(mintReward)) {
            ixForPosition.push(resolvedAtas[mintReward]);
            touchedMints.add(mintReward);
        }
        const collectRewardBaseParams = {
            whirlpool: whirlpoolKey,
            position: new web3_js_1.PublicKey(task.positionAddr),
            positionAuthority,
            positionTokenAccount,
            rewardIndex: index,
            rewardOwnerAccount: resolvedAtas[mintReward].address,
            rewardVault: rewardInfo.vault,
        };
        ixForPosition.push(!token_extension_util_1.TokenExtensionUtil.isV2IxRequiredReward(tokenExtensionCtx, index)
            ? ix_1.WhirlpoolIx.collectRewardIx(ctx.program, collectRewardBaseParams)
            : ix_1.WhirlpoolIx.collectRewardV2Ix(ctx.program, {
                ...collectRewardBaseParams,
                rewardMint: tokenExtensionCtx.rewardTokenMintsWithProgram[index].address,
                rewardTokenProgram: tokenExtensionCtx.rewardTokenMintsWithProgram[index]
                    .tokenProgram,
                rewardTransferHookAccounts: await token_extension_util_1.TokenExtensionUtil.getExtraAccountMetasForTransferHook(ctx.connection, tokenExtensionCtx.rewardTokenMintsWithProgram[index], collectRewardBaseParams.rewardVault, collectRewardBaseParams.rewardOwnerAccount, collectRewardBaseParams.whirlpool),
            }));
    }
    return ixForPosition;
};
//# sourceMappingURL=collect-all-txn.js.map