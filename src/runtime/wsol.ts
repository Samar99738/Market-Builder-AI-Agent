import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import {
  NATIVE_MINT,
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountInstruction,
  createSyncNativeInstruction,
  getAccount,
} from "@solana/spl-token";

/**
 * Wrap SOL into WSOL (create or top-up the WSOL ATA for the signer).
 * - Creates the WSOL ATA if it doesn’t exist.
 * - Transfers SOL into it if balance < required lamports.
 * - Always syncs to keep ATA balance in sync with wrapped SOL.
 * Returns: PublicKey of the WSOL ATA.
 */
export async function wrapSol(
  connection: Connection,
  payer: Keypair,
  owner: PublicKey,
  lamports: number
): Promise<PublicKey> {
  // Derive ATA address for WSOL
  const wsolAta = getAssociatedTokenAddressSync(NATIVE_MINT, owner, false, TOKEN_PROGRAM_ID);

  const ixs: any[] = [];

  // Step 1: Create ATA if it doesn’t exist
  const info = await connection.getAccountInfo(wsolAta);
  if (!info) {
    ixs.push(
      createAssociatedTokenAccountInstruction(
        payer.publicKey,
        wsolAta,
        owner,
        NATIVE_MINT,
        TOKEN_PROGRAM_ID
      )
    );
  }

  // Step 2: Fetch current WSOL balance (in lamports)
  let currentLamports = 0n;
  try {
    const acc = await getAccount(connection, wsolAta, "confirmed", TOKEN_PROGRAM_ID);
    currentLamports = BigInt(acc.amount.toString());
  } catch {
    currentLamports = 0n; // No account or empty
  }

  // Step 3: If balance < required, transfer the difference
  const needed = BigInt(Math.max(0, lamports | 0));
  if (currentLamports < needed) {
    const delta = Number(needed - currentLamports);
    if (delta > 0) {
      ixs.push(
        SystemProgram.transfer({
          fromPubkey: payer.publicKey,
          toPubkey: wsolAta,
          lamports: delta,
        })
      );
    }
  }

  // Step 4: Sync WSOL ATA to reflect correct SOL balance
  ixs.push(createSyncNativeInstruction(wsolAta));

  // Step 5: Send transaction if we created/transferred anything
  if (ixs.length > 0) {
    const tx = new Transaction().add(...ixs);
    await sendAndConfirmTransaction(connection, tx, [payer], {
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
export async function unwrapAllWsolIfAny(
  connection: Connection,
  payer: Keypair,
  owner: PublicKey
) {
  const wsolAta = getAssociatedTokenAddressSync(NATIVE_MINT, owner, false, TOKEN_PROGRAM_ID);
  const info = await connection.getAccountInfo(wsolAta);
  if (!info) return;

  // Sync native balance back to reflect SOL
  const tx = new Transaction().add(createSyncNativeInstruction(wsolAta));
  await sendAndConfirmTransaction(connection, tx, [payer], {
    skipPreflight: true,
    commitment: "confirmed",
  });
}
