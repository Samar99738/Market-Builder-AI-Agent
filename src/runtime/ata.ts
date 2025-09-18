import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import {
  getMint,
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountInstruction,
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync as getAssociatedTokenAddressSync2022,
  createAssociatedTokenAccountInstruction as createAssociatedTokenAccountInstruction2022,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";


/**
 * Ensures an Associated Token Account (ATA) exists for a given wallet (owner) and token mint.
 * Handles both legacy SPL Token program and Token-2022 program.
 * Creates the ATA if missing, waits until RPC confirms visibility to avoid race conditions.
 */
export async function ensureAtaForMint(
  connection: Connection,
  payer: Keypair,
  owner: PublicKey,
  mint: PublicKey
): Promise<PublicKey> {
  // Determine which token program this mint uses by checking the mint account owner
  const mintAcc = await connection.getAccountInfo(mint);
  if (!mintAcc) {
    throw new Error(`[ATA] Mint account not found: ${mint.toBase58()}`);
  }
  const isToken2022 = mintAcc.owner.equals(TOKEN_2022_PROGRAM_ID);
  const programId = isToken2022 ? TOKEN_2022_PROGRAM_ID : TOKEN_PROGRAM_ID;

  // Derive ATA address based on program type
  const ata = (isToken2022 ? getAssociatedTokenAddressSync2022 : getAssociatedTokenAddressSync)(
    mint,
    owner,
    false,
    programId
  );

  // (debug removed) ata details available if needed for troubleshooting

  // Return immediately if ATA already exists
  const existing = await connection.getAccountInfo(ata);
  if (existing) return ata;

  // Build instruction to create ATA (choosing correct program variant)
  const ix =
    isToken2022
      ? createAssociatedTokenAccountInstruction2022(payer.publicKey, ata, owner, mint, programId)
      : createAssociatedTokenAccountInstruction(payer.publicKey, ata, owner, mint, programId);

  // creating ATA

  // Send transaction to create ATA
  const tx = new Transaction().add(ix);
  await sendAndConfirmTransaction(connection, tx, [payer], {
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
