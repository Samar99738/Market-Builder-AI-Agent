"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.performMockSwap = performMockSwap;
const web3_js_1 = require("@solana/web3.js");
const spl_token_1 = require("@solana/spl-token");
// Cache of created mock mint keypairs per symbol to keep deterministic for one process run.
const mockMintCache = {};
function getOrCreateMockMintKeypair(symbol) {
    const key = symbol.toUpperCase();
    if (!mockMintCache[key]) {
        mockMintCache[key] = web3_js_1.Keypair.generate();
    }
    return mockMintCache[key];
}
async function performMockSwap(opts) {
    const { connection, signer, outputSymbol, amountInAtomic } = opts;
    const decimals = opts.decimals ?? 9;
    const mintMultiplier = opts.mintMultiplier ?? 1; // 1:1 by default on UI units
    const mockMintKp = getOrCreateMockMintKeypair(outputSymbol);
    const mockMint = mockMintKp.publicKey;
    const mintAcct = await connection.getAccountInfo(mockMint);
    const tx = new web3_js_1.Transaction();
    let createMint = false;
    if (!mintAcct) {
        const rent = await (0, spl_token_1.getMinimumBalanceForRentExemptMint)(connection);
        tx.add(web3_js_1.SystemProgram.createAccount({
            fromPubkey: signer.publicKey,
            newAccountPubkey: mockMint,
            lamports: rent,
            space: spl_token_1.MINT_SIZE,
            programId: spl_token_1.TOKEN_PROGRAM_ID,
        }));
        // Use signer as mint authority & freeze authority
        tx.add((0, spl_token_1.createInitializeMintInstruction)(mockMint, decimals, signer.publicKey, signer.publicKey));
        createMint = true;
    }
    const ata = await (0, spl_token_1.getAssociatedTokenAddress)(mockMint, signer.publicKey);
    const ataInfo = await connection.getAccountInfo(ata);
    if (!ataInfo) {
        tx.add((0, spl_token_1.createAssociatedTokenAccountInstruction)(signer.publicKey, ata, signer.publicKey, mockMint));
    }
    // Convert input amount atomic (assumed decimals of native SOL=9) to UI, then apply multiplier
    const amountBN = BigInt(amountInAtomic);
    const outputAtomic = (amountBN * BigInt(mintMultiplier));
    if (outputAtomic === 0n)
        throw new Error('MOCK_SWAP_ZERO');
    tx.add((0, spl_token_1.createMintToInstruction)(mockMint, ata, signer.publicKey, Number(outputAtomic))); // safe if < 2^53
    // (Optional) burn small lamports as fee demonstration
    const feeLamports = Math.min(10000, Math.max(5000, Number(amountBN / 10n))); // tiny
    tx.add(web3_js_1.SystemProgram.transfer({ fromPubkey: signer.publicKey, toPubkey: signer.publicKey, lamports: feeLamports }));
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
    tx.recentBlockhash = blockhash;
    tx.feePayer = signer.publicKey;
    tx.sign(signer, ...(createMint ? [mockMintKp] : []));
    const sig = await connection.sendRawTransaction(tx.serialize(), { maxRetries: 3 });
    await connection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight }, 'confirmed');
    return { signature: sig, mint: mockMint.toBase58(), ata: ata.toBase58(), mintedAmount: outputAtomic.toString() };
}
