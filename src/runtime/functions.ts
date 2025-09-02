import fetch from "node-fetch";
import { PublicKey, Connection, clusterApiUrl } from "@solana/web3.js";
import { getMint } from "@solana/spl-token";
import { getBestRoute } from "./jupiter";
import { resolveSymbolViaRegistry as resolveViaRegistryRaw } from "./tokenRegistry";

/**
 * Fetches real-time market cap for a token symbol and quote (e.g., 'JUP', 'USDC')
 * Returns marketCap in USD if available, else null
 */
export async function getMarketCap(symbol: string, quote: string = "USDC"): Promise<number | null> {
  try {
    const url = `https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(symbol)}/${encodeURIComponent(quote)}`;
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`Dexscreener API error: ${resp.status}`);
    const data = await resp.json();
    // Find the first pair with a marketCap field
    const pair = Array.isArray(data.pairs) ? data.pairs.find(p => typeof p.marketCap === "number") : null;
    return pair?.marketCap ?? null;
  } catch (err) {
    console.error("[getMarketCap]", err);
    return null;
  }
}

type Network = "devnet" | "mainnet";
type TokenMeta = { symbol: string; mint: string; decimals: number };

// Helper: returns a Solana RPC connection for the given network
function getConn(network: Network): Connection {
  const endpoint =
    network === "mainnet"
      ? process.env.SOLANA_MAINNET_RPC_URL || clusterApiUrl("mainnet-beta")
      : process.env.SOLANA_DEVNET_RPC_URL || clusterApiUrl("devnet");
  return new Connection(endpoint, "confirmed");
}

// Helper: checks if a string looks like a valid mint address
function looksLikeMint(s: string): boolean {
  try {
    const pk = new PublicKey(s);
    return pk.toBase58() === s;
  } catch {
    return false;
  }
}

// Local fallback mapping for common tokens (SOL, USDC)
// Used when registry lookup fails or isn’t available
function localSymbolToMeta(symbol: string, network: Network): TokenMeta | null {
  const sym = (symbol || "").toUpperCase();
  if (sym === "SOL") {
    return { symbol: "SOL", mint: "So11111111111111111111111111111111111111112", decimals: 9 };
  }
  if (sym === "USDC") {
    if (network === "mainnet") {
      return {
        symbol: "USDC",
        mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
        decimals: 6,
      };
    }
    // Devnet fallback
    return {
      symbol: "USDC",
      mint: "Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr",
      decimals: 6,
    };
  }
  return null;
}

// Fetch decimals for a token mint directly from chain
async function getDecimalsForMint(mint: string, network: Network): Promise<number> {
  const conn = getConn(network);
  const mi = await getMint(conn, new PublicKey(mint));
  return mi.decimals;
}

// Registry wrapper: attempts to resolve symbol via external token registry
// Returns null if not found or registry call fails
async function resolveViaRegistry(
  symbol: string,
  network: Network
): Promise<TokenMeta | null> {
  try {
    const reg = await resolveViaRegistryRaw(symbol, network);
    if (!reg) return null;
    return { symbol: symbol.toUpperCase(), mint: reg.mint, decimals: reg.decimals };
  } catch {
    return null;
  }
}

// Exported: helper to resolve input mint for a given currency (SOL or USDC)
export function inputMintForCurrency(
  currency: "USDC" | "SOL",
  network: Network
): { mint: string; decimals: number } {
  if (currency === "SOL") {
    return { mint: "So11111111111111111111111111111111111111112", decimals: 9 };
  }
  // USDC resolution for mainnet/devnet
  if (network === "mainnet") {
    return { mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", decimals: 6 };
  }
  return { mint: "Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr", decimals: 6 };
}

// Exported: resolves metadata (symbol, mint, decimals) for a given token
// Resolution order: literal mint → registry lookup → local fallback
export async function resolveTokenMeta(token: string, network: Network): Promise<TokenMeta> {
  // 1) If token is a literal mint address, fetch decimals from chain
  if (looksLikeMint(token)) {
    const decimals = await getDecimalsForMint(token, network);
    return { symbol: token, mint: token, decimals };
  }

  const sym = token.toUpperCase().trim();

  // 2) Try registry lookup
  const reg = await resolveViaRegistry(sym, network);
  if (reg) {
    // Guard against using mainnet USDC on devnet
    if (
      network === "devnet" &&
      sym === "USDC" &&
      reg.mint === "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
    ) {
      throw new Error(
        "USDC maps to mainnet mint on devnet; use the devnet USDC test mint (Gh9Z...) or switch to mainnet."
      );
    }
    return reg;
  }

  // 3) Local fallback for core tokens
  const local = localSymbolToMeta(sym, network);
  if (local) return local;

  // Throw explicit error if symbol isn’t found for given network
  if (network === "devnet") {
    throw new Error(
      `Unknown token symbol or not listed on devnet: ${sym}. Try a devnet-listed symbol, switch to mainnet, or use a mint address.`
    );
  }
  throw new Error(`Unknown token symbol or mint: ${sym}`);
}

// Exported: fetches swap quote summary using Jupiter
// Returns route count, output amounts (atomic & human-readable), and decimals
export async function getQuoteSummary(
  currency: "USDC" | "SOL",
  token: string,
  amount: number,
  slippageBps: number,
  network: Network
): Promise<{ routeCount: number; outAmountAtomic: string; outDecimals: number; outAmountHuman: number }> {
  const inMeta = inputMintForCurrency(currency, network);
  const outMeta = await resolveTokenMeta(token, network);
  const amountAtomic = String(Math.max(1, Math.round(amount * 10 ** inMeta.decimals)));

  // Get best swap route from Jupiter
  const route = await getBestRoute({
    inputMint: inMeta.mint,
    outputMint: outMeta.mint,
    amount: amountAtomic,
    slippageBps,
  });

  // Extract output amount (different Jupiter versions may store it in different fields)
  const outAmountAtomic = String(
    (route as any)?.outAmount ??
      (route as any)?.outAmountWithSlippage ??
      (route as any)?.otherAmountThreshold ??
      "0"
  );
  const outDecimals = outMeta.decimals ?? 6;
  const outAmountHuman = Number(outAmountAtomic) / 10 ** outDecimals;

  return {
    routeCount: Array.isArray((route as any)?.routes) ? (route as any).routes.length : 1,
    outAmountAtomic,
    outDecimals,
    outAmountHuman,
  };
}
