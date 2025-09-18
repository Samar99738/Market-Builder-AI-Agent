"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureAtaForMint = ensureAtaForMint;
const web3_js_1 = require("@solana/web3.js");
const spl_token_1 = require("@solana/spl-token");
/**
 * Ensures an Associated Token Account (ATA) exists for a given wallet (owner) and token mint.
 * Handles both legacy SPL Token program and Token-2022 program.
 * Creates the ATA if missing, waits until RPC confirms visibility to avoid race conditions.
 */
async function ensureAtaForMint(connection, payer, owner, mint) {
    // Determine which token program this mint uses by checking the mint account owner
    const mintAcc = await connection.getAccountInfo(mint);
    if (!mintAcc) {
        throw new Error(`[ATA] Mint account not found: ${mint.toBase58()}`);
    }
    const isToken2022 = mintAcc.owner.equals(spl_token_1.TOKEN_2022_PROGRAM_ID);
    const programId = isToken2022 ? spl_token_1.TOKEN_2022_PROGRAM_ID : spl_token_1.TOKEN_PROGRAM_ID;
    // Derive ATA address based on program type
    const ata = (isToken2022 ? spl_token_1.getAssociatedTokenAddressSync : spl_token_1.getAssociatedTokenAddressSync)(mint, owner, false, programId);
    // (debug removed) ata details available if needed for troubleshooting
    // Return immediately if ATA already exists
    const existing = await connection.getAccountInfo(ata);
    if (existing)
        return ata;
    // Build instruction to create ATA (choosing correct program variant)
    const ix = isToken2022
        ? (0, spl_token_1.createAssociatedTokenAccountInstruction)(payer.publicKey, ata, owner, mint, programId)
        : (0, spl_token_1.createAssociatedTokenAccountInstruction)(payer.publicKey, ata, owner, mint, programId);
    // creating ATA
    // Send transaction to create ATA
    const tx = new web3_js_1.Transaction().add(ix);
    await (0, web3_js_1.sendAndConfirmTransaction)(connection, tx, [payer], {
        skipPreflight: false,
        commitment: "confirmed",
    });
    // Poll until the ATA is visible over RPC (prevents mismatched ATA creation in swaps)
    for (let i = 0; i < 6; i++) {
        const info = await connection.getAccountInfo(ata);
        if (info) {
            // created ATA
            return ata;
        }
        await new Promise((r) => setTimeout(r, 300 + i * 200));
    }
    // If still not visible, return ATA anyway (downstream logic should handle)
    console.warn(`ATA not visible after polling: ata=${ata.toBase58()}`);
    return ata;
}
