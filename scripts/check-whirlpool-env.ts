import { Connection, PublicKey } from '@solana/web3.js';
import { ORCA_WHIRLPOOL_PROGRAM_ID, ORCA_WHIRLPOOLS_CONFIG } from '@orca-so/whirlpools-sdk';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  const network = process.argv[2] === 'mainnet' ? 'mainnet' : 'devnet';
  const endpoint = network === 'devnet' ? (process.env.SOLANA_DEVNET_RPC_URL || 'https://api.devnet.solana.com') : (process.env.SOLANA_MAINNET_RPC_URL || 'https://api.mainnet-beta.solana.com');
  const conn = new Connection(endpoint, 'confirmed');

  const programPk = new PublicKey(ORCA_WHIRLPOOL_PROGRAM_ID);
  const configPk = new PublicKey(ORCA_WHIRLPOOLS_CONFIG);

  async function fetchInfo(label: string, pk: PublicKey) {
    const info = await conn.getAccountInfo(pk);
    if (!info) {
      console.log(`[MISSING] ${label} account ${pk.toBase58()} not found`);
      return null;
    }
    console.log(`[FOUND] ${label} executable=${info.executable} owner=${info.owner.toBase58()} lamports=${info.lamports} dataLen=${info.data.length}`);
    return info;
  }

  console.log(`[INFO] Checking Whirlpool program + config on ${network} endpoint ${endpoint}`);
  const prog = await fetchInfo('PROGRAM', programPk);
  const cfg = await fetchInfo('CONFIG', configPk);

  if (!prog || !prog.executable) {
    console.log('[SUMMARY] Whirlpool program not deployed or not executable on this cluster.');
  }
  if (!cfg) {
    console.log('[SUMMARY] Whirlpool global config missing. No pools can exist without it.');
  }

  if (prog && prog.executable && cfg) {
    // Sample: list up to 10 program accounts to see if any pools exist (filter by reasonable data size > 500 bytes)
    console.log('[SCAN] Fetching small sample of program accounts (may take time)...');
    const accs = await conn.getProgramAccounts(programPk, { dataSlice: { offset: 0, length: 0 }, commitment: 'confirmed' });
    console.log(`[SCAN] Program accounts count=${accs.length}`);
    if (accs.length === 0) {
      console.log('[SUMMARY] No program accounts found under Whirlpool program.');
    } else {
      console.log('[SCAN] Listing first 15 pubkeys:');
      accs.slice(0,15).forEach((a,i)=> console.log(`  [${i}] ${a.pubkey.toBase58()}`));
    }
  }
}

main().catch(e => { console.error(e); process.exit(1); });
