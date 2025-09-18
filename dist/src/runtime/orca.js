"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.swapViaOrcaWhirlpool = swapViaOrcaWhirlpool;
const whirlpools_sdk_1 = require("@orca-so/whirlpools-sdk");
const web3_js_1 = require("@solana/web3.js");
const bn_js_1 = __importDefault(require("bn.js"));
const spl_token_1 = require("@solana/spl-token");
const common_sdk_1 = require("@orca-so/common-sdk");
class KeypairWallet {
    constructor(payer) {
        this.payer = payer;
    }
    get publicKey() { return this.payer.publicKey; }
    async signTransaction(tx) { tx.sign([this.payer]); return tx; }
    async signAllTransactions(txs) { txs.forEach(t => t.sign([this.payer])); return txs; }
}
async function swapViaOrcaWhirlpool({ connection, user, inputMint, outputMint, amountIn, slippageBps = 100, network, poolAddress, }) {
    // Allow override via env (useful for devnet where program id can differ)
    const overrideProgram = process.env.ORCA_WHIRLPOOL_PROGRAM_ID;
    let programId = new web3_js_1.PublicKey(overrideProgram || whirlpools_sdk_1.ORCA_WHIRLPOOL_PROGRAM_ID);
    // Config (global) account – must exist or no pools can be fetched. Allow override.
    const overrideConfig = process.env.ORCA_WHIRLPOOLS_CONFIG;
    const configPk = new web3_js_1.PublicKey(overrideConfig || whirlpools_sdk_1.ORCA_WHIRLPOOLS_CONFIG);
    const wallet = new KeypairWallet(user);
    // Verify global config exists (helps diagnose missing devnet deployment)
    const cfgInfo = await connection.getAccountInfo(configPk);
    if (!cfgInfo) {
        throw new Error(`WHIRLPOOL_CONFIG_MISSING: Global config ${configPk.toBase58()} not found on ${network}. ` +
            `No Whirlpool pools are available. Provide valid ORCA_WHIRLPOOLS_CONFIG & ORCA_WHIRLPOOL_PROGRAM_ID env values ` +
            `for this cluster, or switch network (e.g. mainnet) / disable Whirlpool fallback.`);
    }
    if (!cfgInfo.executable && cfgInfo.data.length === 0) {
        // Extremely unlikely, but indicates placeholder
        throw new Error(`WHIRLPOOL_CONFIG_INVALID: Config account ${configPk.toBase58()} has no data on ${network}.`);
    }
    // Optional: auto-detect program id from pool account owner if mismatch
    const poolPk = new web3_js_1.PublicKey(poolAddress);
    const poolAcct = await connection.getAccountInfo(poolPk);
    if (!poolAcct) {
        throw new Error(`Whirlpool pool account not found on ${network}: ${poolAddress}`);
    }
    const actualOwner = poolAcct.owner;
    if (!actualOwner.equals(programId)) {
        // Rebuild context with detected owner (most likely correct program id for this pool)
        programId = actualOwner;
    }
    let ctx = whirlpools_sdk_1.WhirlpoolContext.from(connection, wallet, programId);
    let client = (0, whirlpools_sdk_1.buildWhirlpoolClient)(ctx);
    let whirlpool;
    try {
        whirlpool = await client.getPool(poolPk, whirlpools_sdk_1.IGNORE_CACHE);
    }
    catch (e) {
        // Provide richer diagnostics and retry once if we haven't tried the detected owner yet
        const diag = `Failed to fetch Whirlpool. UsedProgram=${programId.toBase58()} PoolOwner=${actualOwner.toBase58()} Err=${e?.message || e}`;
        throw new Error(`Unable to fetch Whirlpool at address ${poolAddress}. ${diag}`);
    }
    // Prepare ATA accounts
    const owner = user.publicKey;
    const inAta = (0, spl_token_1.getAssociatedTokenAddressSync)(new web3_js_1.PublicKey(inputMint), owner, false);
    const outAta = (0, spl_token_1.getAssociatedTokenAddressSync)(new web3_js_1.PublicKey(outputMint), owner, false);
    const isAInput = inputMint === whirlpool.getTokenAInfo().mint.toBase58();
    const amount = new bn_js_1.default(amountIn);
    const quote = await (0, whirlpools_sdk_1.swapQuoteByInputToken)(whirlpool, amount, isAInput, common_sdk_1.Percentage.fromFraction(slippageBps, 10000), ctx.program.programId, ctx.fetcher, whirlpools_sdk_1.IGNORE_CACHE);
    const rawIx = whirlpools_sdk_1.WhirlpoolIx.swapIx(ctx.program, {
        amount: quote.amount,
        otherAmountThreshold: quote.otherAmountThreshold,
        sqrtPriceLimit: quote.sqrtPriceLimit,
        amountSpecifiedIsInput: true,
        aToB: isAInput,
        whirlpool: whirlpool.getAddress(),
        tokenAuthority: owner,
        tokenOwnerAccountA: inAta,
        tokenOwnerAccountB: outAta,
        tokenVaultA: whirlpool.getTokenVaultAInfo().address,
        tokenVaultB: whirlpool.getTokenVaultBInfo().address,
        tickArray0: quote.tickArray0,
        tickArray1: quote.tickArray1,
        tickArray2: quote.tickArray2,
        oracle: whirlpools_sdk_1.PDAUtil.getOracle(programId, whirlpool.getAddress()).publicKey,
    });
    const ixs = rawIx.instructions ?? [rawIx];
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
    const msg = new web3_js_1.TransactionMessage({
        payerKey: owner,
        recentBlockhash: blockhash,
        instructions: ixs,
    }).compileToV0Message();
    const tx = new web3_js_1.VersionedTransaction(msg);
    tx.sign([user]);
    const sig = await connection.sendTransaction(tx, { maxRetries: 6 });
    const conf = await connection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight }, "confirmed");
    if (conf.value.err)
        throw new Error(`ORCA_SWAP_FAILED: ${JSON.stringify(conf.value.err)}`);
    return sig;
}
