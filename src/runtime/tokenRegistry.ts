import fetch from "cross-fetch";

// Define structure for token info coming from Jupiter registry
type TokenInfo = { address: string; symbol: string; decimals: number };

// Simple in-memory cache to avoid fetching registry repeatedly
let cache: { cluster: "devnet" | "mainnet"; bySymbol: Record<string, TokenInfo> } | null = null;

// Fetch token registry for a given Solana cluster (devnet/mainnet)
export async function getRegistry(
  network: "devnet" | "mainnet"
): Promise<{ bySymbol: Record<string, TokenInfo> }> {
  // Return from cache if already loaded for this cluster
  if (cache?.cluster === network) return { bySymbol: cache.bySymbol };

  // Pick registry URL based on network
  const url =
    network === "devnet"
      ? "https://token.jup.ag/strict?cluster=devnet"
      : "https://token.jup.ag/strict?cluster=mainnet";

  // Fetch registry data
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load token registry (${network}): ${res.status}`);

  // Convert list into a symbol → token lookup
  const list = (await res.json()) as TokenInfo[];
  const bySymbol: Record<string, TokenInfo> = {};
  for (const t of list) {
    if (t.symbol) bySymbol[(t.symbol || "").toUpperCase()] = t;
  }

  // Cache results for reuse
  cache = { cluster: network, bySymbol };
  return { bySymbol };
}

// Resolve a token symbol to its mint address + decimals via registry
export async function resolveSymbolViaRegistry(
  symbol: string,
  network: "devnet" | "mainnet"
): Promise<{ mint: string; decimals: number } | undefined> {
  if (!symbol) return undefined;
  try {
    const reg = await getRegistry(network);
    const t = reg.bySymbol[(symbol || "").toUpperCase()];
    if (!t) return undefined;
    return { mint: t.address, decimals: t.decimals };
  } catch {
    return undefined;
  }
}
