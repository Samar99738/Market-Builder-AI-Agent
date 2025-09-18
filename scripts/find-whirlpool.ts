import { Connection, PublicKey } from '@solana/web3.js';
import { PDAUtil, ORCA_WHIRLPOOL_PROGRAM_ID } from '@orca-so/whirlpools-sdk';
import dotenv from 'dotenv';
import { resolveTokenMeta, inputMintForCurrency } from '../src/runtime/functions';

dotenv.config();

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error('Usage: ts-node scripts/find-whirlpool.ts <TOKEN_SYMBOL_OR_MINT_A> <TOKEN_SYMBOL_OR_MINT_B> [network=devnet]');
    process.exit(1);
  }
  const [tokA, tokB, networkArg] = args;
  const network = (networkArg as any) === 'mainnet' ? 'mainnet' : 'devnet';
  const endpoint = network === 'devnet' ? (process.env.SOLANA_DEVNET_RPC_URL || 'https://api.devnet.solana.com') : (process.env.SOLANA_MAINNET_RPC_URL || 'https://api.mainnet-beta.solana.com');
  const conn = new Connection(endpoint, 'confirmed');

  // Resolve tokens to mints (supports SOL, USDC, symbols in registry, or raw mint addresses)
  async function resolve(m: string): Promise<{ mint: string; decimals: number; symbol: string }> {
    if (m.toUpperCase() === 'SOL') return { mint: inputMintForCurrency('SOL', network).mint, decimals: 9, symbol: 'SOL' };
    // Try full resolution (will throw if invalid)
    const meta = await resolveTokenMeta(m, network as any);
    return { mint: meta.mint, decimals: meta.decimals, symbol: meta.symbol };
  }

  const a = await resolve(tokA);
  const b = await resolve(tokB);
  console.log(`[INFO] Resolved A: ${a.symbol} => ${a.mint}`);
  console.log(`[INFO] Resolved B: ${b.symbol} => ${b.mint}`);

  const programId = new PublicKey(ORCA_WHIRLPOOL_PROGRAM_ID);
  const configCandidates = [
    // Observed config in API sample
    '2LecshUwdy9xi7meFgHtFJQNSKk4KdTrcpvaB56dP2NQ',
    // Placeholder for potential alternate configs (add more if needed)
  ].map(k => new PublicKey(k));

  const tickSpacings = [1,2,4,8,16,32,64,96,128,256,512,1024,32896];

  const results: any[] = [];

  for (const cfg of configCandidates) {
    for (const ts of tickSpacings) {
      for (const order of [0,1] as const) {
        const mintA = order === 0 ? a.mint : b.mint;
        const mintB = order === 0 ? b.mint : a.mint;
        try {
          const { publicKey } = PDAUtil.getWhirlpool(programId, cfg, new PublicKey(mintA), new PublicKey(mintB), ts);
          const info = await conn.getAccountInfo(publicKey);
          if (info) {
            results.push({ cfg: cfg.toBase58(), tickSpacing: ts, address: publicKey.toBase58(), size: info.data.length, owner: info.owner.toBase58() });
            console.log(`[FOUND] cfg=${cfg.toBase58()} ts=${ts} addr=${publicKey.toBase58()} owner=${info.owner.toBase58()} size=${info.data.length}`);
          } else {
            console.log(`[MISS] cfg=${cfg.toBase58()} ts=${ts} addr=${publicKey.toBase58()}`);
          }
        } catch (e) {
          console.log(`[ERR] cfg=${cfg.toBase58()} ts=${ts} order=${order} error=${(e as Error).message}`);
        }
      }
    }
  }

  if (!results.length) {
    console.log('No Whirlpool pools found for this pair on this network with the tested configs/tick spacings.');
  } else {
    console.log('\nSummary:');
    console.table(results);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
