// Define a type for token metadata containing mint address and decimals
export type TokenMeta = { mint: string; decimals: number };

// Registry of supported tokens with their mint addresses and decimal precision
const registry: Record<string, TokenMeta> = {
  USDC: { mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", decimals: 6 },
  SOL:  { mint: "So11111111111111111111111111111111111111112", decimals: 9 },
};

// Get token metadata from its symbol (case-insensitive)
export function symbolToMeta(sym?: string): TokenMeta | undefined {
  if (!sym) return undefined;
  return registry[sym.toUpperCase()];
}

// Check if a string looks like a valid Solana mint address (base58 + length ≥ 32)
export function looksLikeMint(s: unknown): s is string {
  return !!(
    typeof s === "string" &&
    /^[1-9A-HJ-NP-Za-km-z]+$/.test(s) &&
    s.length >= 32
  );
}
