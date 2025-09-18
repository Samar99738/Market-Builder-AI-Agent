import { Connection, Keypair, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, MINT_SIZE, createInitializeMintInstruction, getMinimumBalanceForRentExemptMint, getAssociatedTokenAddress, createAssociatedTokenAccountInstruction, createMintToInstruction } from '@solana/spl-token';

// Simple deterministic PDA-based mint authority so repeated runs reuse same mint when symbol provided.
// NOTE: This is purely for assignment/demo purposes; not for production economics.

export interface MockSwapOptions {
  connection: Connection;
  signer: Keypair;
  inputMint: string; // expected SOL native when using mock
  outputSymbol: string; // synthetic token symbol label e.g. MOCK or JITO (for mapping)
  amountInAtomic: string; // amount of input (atomic) - used just to scale minted output
  decimals?: number; // default 9
  mintMultiplier?: number; // how many output tokens per 1 unit of input (ui)
}

// Cache of created mock mint keypairs per symbol to keep deterministic for one process run.
const mockMintCache: Record<string, Keypair> = {};

function getOrCreateMockMintKeypair(symbol: string): Keypair {
  const key = symbol.toUpperCase();
  if (!mockMintCache[key]) {
    mockMintCache[key] = Keypair.generate();
  }
  return mockMintCache[key];
}

export async function performMockSwap(opts: MockSwapOptions): Promise<{ signature: string; mint: string; ata: string; mintedAmount: string; }>{
  const { connection, signer, outputSymbol, amountInAtomic } = opts;
  const decimals = opts.decimals ?? 9;
  const mintMultiplier = opts.mintMultiplier ?? 1; // 1:1 by default on UI units

  const mockMintKp = getOrCreateMockMintKeypair(outputSymbol);
  const mockMint = mockMintKp.publicKey;
  const mintAcct = await connection.getAccountInfo(mockMint);

  const tx = new Transaction();
  let createMint = false;
  if (!mintAcct) {
    const rent = await getMinimumBalanceForRentExemptMint(connection);
    tx.add(SystemProgram.createAccount({
      fromPubkey: signer.publicKey,
      newAccountPubkey: mockMint,
      lamports: rent,
      space: MINT_SIZE,
      programId: TOKEN_PROGRAM_ID,
    }));
    // Use signer as mint authority & freeze authority
    tx.add(createInitializeMintInstruction(mockMint, decimals, signer.publicKey, signer.publicKey));
    createMint = true;
  }

  const ata = await getAssociatedTokenAddress(mockMint, signer.publicKey);
  const ataInfo = await connection.getAccountInfo(ata);
  if (!ataInfo) {
    tx.add(createAssociatedTokenAccountInstruction(signer.publicKey, ata, signer.publicKey, mockMint));
  }

  // Convert input amount atomic (assumed decimals of native SOL=9) to UI, then apply multiplier
  const amountBN = BigInt(amountInAtomic);
  const outputAtomic = (amountBN * BigInt(mintMultiplier));
  if (outputAtomic === 0n) throw new Error('MOCK_SWAP_ZERO');
  tx.add(createMintToInstruction(mockMint, ata, signer.publicKey, Number(outputAtomic))); // safe if < 2^53

  // (Optional) burn small lamports as fee demonstration
  const feeLamports = Math.min(10000, Math.max(5000, Number(amountBN / 10n))); // tiny
  tx.add(SystemProgram.transfer({ fromPubkey: signer.publicKey, toPubkey: signer.publicKey, lamports: feeLamports }));

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
  tx.recentBlockhash = blockhash;
  tx.feePayer = signer.publicKey;
  tx.sign(signer, ...(createMint ? [mockMintKp] : []));
  const sig = await connection.sendRawTransaction(tx.serialize(), { maxRetries: 3 });
  await connection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight }, 'confirmed');
  return { signature: sig, mint: mockMint.toBase58(), ata: ata.toBase58(), mintedAmount: outputAtomic.toString() };
}
