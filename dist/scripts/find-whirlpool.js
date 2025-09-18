"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const web3_js_1 = require("@solana/web3.js");
const whirlpools_sdk_1 = require("@orca-so/whirlpools-sdk");
const dotenv_1 = __importDefault(require("dotenv"));
const functions_1 = require("../src/runtime/functions");
dotenv_1.default.config();
async function main() {
    const args = process.argv.slice(2);
    if (args.length < 2) {
        console.error('Usage: ts-node scripts/find-whirlpool.ts <TOKEN_SYMBOL_OR_MINT_A> <TOKEN_SYMBOL_OR_MINT_B> [network=devnet]');
        process.exit(1);
    }
    const [tokA, tokB, networkArg] = args;
    const network = networkArg === 'mainnet' ? 'mainnet' : 'devnet';
    const endpoint = network === 'devnet' ? (process.env.SOLANA_DEVNET_RPC_URL || 'https://api.devnet.solana.com') : (process.env.SOLANA_MAINNET_RPC_URL || 'https://api.mainnet-beta.solana.com');
    const conn = new web3_js_1.Connection(endpoint, 'confirmed');
    // Resolve tokens to mints (supports SOL, USDC, symbols in registry, or raw mint addresses)
    async function resolve(m) {
        if (m.toUpperCase() === 'SOL')
            return { mint: (0, functions_1.inputMintForCurrency)('SOL', network).mint, decimals: 9, symbol: 'SOL' };
        // Try full resolution (will throw if invalid)
        const meta = await (0, functions_1.resolveTokenMeta)(m, network);
        return { mint: meta.mint, decimals: meta.decimals, symbol: meta.symbol };
    }
    const a = await resolve(tokA);
    const b = await resolve(tokB);
    console.log(`[INFO] Resolved A: ${a.symbol} => ${a.mint}`);
    console.log(`[INFO] Resolved B: ${b.symbol} => ${b.mint}`);
    const programId = new web3_js_1.PublicKey(whirlpools_sdk_1.ORCA_WHIRLPOOL_PROGRAM_ID);
    const configCandidates = [
        // Observed config in API sample
        '2LecshUwdy9xi7meFgHtFJQNSKk4KdTrcpvaB56dP2NQ',
        // Placeholder for potential alternate configs (add more if needed)
    ].map(k => new web3_js_1.PublicKey(k));
    const tickSpacings = [1, 2, 4, 8, 16, 32, 64, 96, 128, 256, 512, 1024, 32896];
    const results = [];
    for (const cfg of configCandidates) {
        for (const ts of tickSpacings) {
            for (const order of [0, 1]) {
                const mintA = order === 0 ? a.mint : b.mint;
                const mintB = order === 0 ? b.mint : a.mint;
                try {
                    const { publicKey } = whirlpools_sdk_1.PDAUtil.getWhirlpool(programId, cfg, new web3_js_1.PublicKey(mintA), new web3_js_1.PublicKey(mintB), ts);
                    const info = await conn.getAccountInfo(publicKey);
                    if (info) {
                        results.push({ cfg: cfg.toBase58(), tickSpacing: ts, address: publicKey.toBase58(), size: info.data.length, owner: info.owner.toBase58() });
                        console.log(`[FOUND] cfg=${cfg.toBase58()} ts=${ts} addr=${publicKey.toBase58()} owner=${info.owner.toBase58()} size=${info.data.length}`);
                    }
                    else {
                        console.log(`[MISS] cfg=${cfg.toBase58()} ts=${ts} addr=${publicKey.toBase58()}`);
                    }
                }
                catch (e) {
                    console.log(`[ERR] cfg=${cfg.toBase58()} ts=${ts} order=${order} error=${e.message}`);
                }
            }
        }
    }
    if (!results.length) {
        console.log('No Whirlpool pools found for this pair on this network with the tested configs/tick spacings.');
    }
    else {
        console.log('\nSummary:');
        console.table(results);
    }
}
main().catch(e => { console.error(e); process.exit(1); });
