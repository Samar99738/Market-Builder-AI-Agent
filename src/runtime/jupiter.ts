import fetch from "cross-fetch";
import { withRetry } from "./retry";

export type QuoteParams = {
  inputMint: string;
  outputMint: string;
  amount: string;
  slippageBps?: number;
  environment?: "mainnet-beta" | "devnet";
};

export type QuoteResponse = any;

// fetch a quote from Jupiter's API with retry logic and a small random delay
async function fetchQuote(qs: URLSearchParams) {
  const url = `https://quote-api.jup.ag/v6/quote?${qs.toString()}`;
  const preDelay = 120 + Math.floor(Math.random() * 240);
  return withRetry(async () => {
    await new Promise((r) => setTimeout(r, preDelay));
    const res = await fetch(url);
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Jupiter quote error ${res.status}${text ? `: ${text}` : ""}`);
    }
    return res.json();
  });
}

// get a strict quote (only direct routes, limited accounts) for a swap
export async function getQuote(params: QuoteParams): Promise<QuoteResponse> {
  const { inputMint, outputMint, amount, slippageBps = 50, environment } = params;
  const strict = new URLSearchParams({
    inputMint,
    outputMint,
    amount,
    slippageBps: String(slippageBps),
    restrictIntermediateTokens: "true",
    onlyDirectRoutes: "true",
    maxAccounts: "22",
    swapMode: "ExactIn",
  });
  if (environment) strict.set("environment", environment);
  return fetchQuote(strict);
}

//  choose the best swap route (try strict first, then relax constraints if needed)
export async function getBestRoute(params: QuoteParams): Promise<any> {
  const data = await getQuote(params).catch(() => null);
  let routes = Array.isArray(data?.data) ? data.data : (data?.data || data ? [data?.data || data] : []);
  // On devnet, prefer AMMs known to be deployed (e.g., Orca) to avoid unsupported programs
  if (params.environment === "devnet" && Array.isArray(routes) && routes.length) {
    const allowed = new Set(["Orca", "Whirlpool", "Raydium", "Lifinity", "Aldrin"]);
    const filtered = routes.filter((r: any) => Array.isArray(r?.marketInfos) && r.marketInfos.every((m: any) => allowed.has(m?.label)));
    if (!filtered.length) {
      const labels = routes.map((r: any) => (r?.marketInfos || []).map((m: any) => m?.label));
      console.log(`[Jupiter][devnet] No route matched allowlist. Candidate AMM labels: ${JSON.stringify(labels)}`);
    }
    if (filtered.length) {
      return filtered[0];
    }
  }
  let best = routes[0];
  if (best) return best;

  // fallback: allow intermediate tokens and indirect routes
  // Note: Free tier does not support restrictIntermediateTokens=false.
  // Instead, omit the flag (defaults to true on server) and relax onlyDirectRoutes.
  const loose = new URLSearchParams({
    inputMint: params.inputMint,
    outputMint: params.outputMint,
    amount: params.amount,
    slippageBps: String(params.slippageBps ?? 50),
    // restrictIntermediateTokens omitted to comply with free tier
    onlyDirectRoutes: "false",
    swapMode: "ExactIn",
  });
  if (params.environment) loose.set("environment", params.environment);
  const data2 = await fetchQuote(loose);
  routes = Array.isArray(data2?.data) ? data2.data : (data2?.data || data2 ? [data2?.data || data2] : []);
  if (params.environment === "devnet" && Array.isArray(routes) && routes.length) {
  const allowed = new Set(["Orca", "Whirlpool", "Raydium", "Lifinity", "Aldrin"]);
  const filtered = routes.filter((r: any) => Array.isArray(r?.marketInfos) && r.marketInfos.every((m: any) => allowed.has(m?.label)));
    if (filtered.length) {
      return filtered[0];
    }
  }
  best = routes[0];
  if (!best) throw new Error("No best route");
  return best;
}
