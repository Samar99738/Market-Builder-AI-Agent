"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.wrapSol = wrapSol;
exports.unwrapAllWsolIfAny = unwrapAllWsolIfAny;
const web3_js_1 = require("@solana/web3.js");
const spl_token_1 = require("@solana/spl-token");
/**
 * Wrap SOL into WSOL (create or top-up the WSOL ATA for the signer).
 * - Creates the WSOL ATA if it doesn’t exist.
 * - Transfers SOL into it if balance < required lamports.
 * - Always syncs to keep ATA balance in sync with wrapped SOL.
 * Returns: PublicKey of the WSOL ATA.
 */
async function wrapSol(connection, payer, owner, lamports) {
    // Derive ATA address for WSOL
    const wsolAta = (0, spl_token_1.getAssociatedTokenAddressSync)(spl_token_1.NATIVE_MINT, owner, false, spl_token_1.TOKEN_PROGRAM_ID);
    const ixs = [];
    // Step 1: Create ATA if it doesn’t exist
    const info = await connection.getAccountInfo(wsolAta);
    if (!info) {
        ixs.push((0, spl_token_1.createAssociatedTokenAccountInstruction)(payer.publicKey, wsolAta, owner, spl_token_1.NATIVE_MINT, spl_token_1.TOKEN_PROGRAM_ID));
    }
    // Step 2: Fetch current WSOL balance (in lamports)
    let currentLamports = 0n;
    try {
        const acc = await (0, spl_token_1.getAccount)(connection, wsolAta, "confirmed", spl_token_1.TOKEN_PROGRAM_ID);
        currentLamports = BigInt(acc.amount.toString());
    }
    catch {
        currentLamports = 0n; // No account or empty
    }
    // Step 3: If balance < required, transfer the difference
    const needed = BigInt(Math.max(0, lamports | 0));
    if (currentLamports < needed) {
        const delta = Number(needed - currentLamports);
        if (delta > 0) {
            ixs.push(web3_js_1.SystemProgram.transfer({
                fromPubkey: payer.publicKey,
                toPubkey: wsolAta,
                lamports: delta,
            }));
        }
    }
    // Step 4: Sync WSOL ATA to reflect correct SOL balance
    ixs.push((0, spl_token_1.createSyncNativeInstruction)(wsolAta));
    // Step 5: Send transaction if we created/transferred anything
    if (ixs.length > 0) {
        const tx = new web3_js_1.Transaction().add(...ixs);
        await (0, web3_js_1.sendAndConfirmTransaction)(connection, tx, [payer], {
            skipPreflight: false,
            commitment: "confirmed",
        });
    }
    return wsolAta;
}
/*
 Unwrap WSOL (syncs balance, does not auto-close account).
 - Caller can transfer/close WSOL ATA afterwards if needed.
 */
async function unwrapAllWsolIfAny(connection, payer, owner) {
    const wsolAta = (0, spl_token_1.getAssociatedTokenAddressSync)(spl_token_1.NATIVE_MINT, owner, false, spl_token_1.TOKEN_PROGRAM_ID);
    const info = await connection.getAccountInfo(wsolAta);
    if (!info)
        return;
    // Sync native balance back to reflect SOL
    const tx = new web3_js_1.Transaction().add((0, spl_token_1.createSyncNativeInstruction)(wsolAta));
    await (0, web3_js_1.sendAndConfirmTransaction)(connection, tx, [payer], {
        skipPreflight: true,
        commitment: "confirmed",
    });
}
