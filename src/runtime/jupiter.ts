import fetch from "cross-fetch";
import { withRetry } from "./retry";

export type QuoteParams = {
  inputMint: string;
  outputMint: string;
  amount: string;
  slippageBps?: number;
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
  const { inputMint, outputMint, amount, slippageBps = 50 } = params;
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
  return fetchQuote(strict);
}

//  choose the best swap route (try strict first, then relax constraints if needed)
export async function getBestRoute(params: QuoteParams): Promise<any> {
  const data = await getQuote(params).catch(() => null);
  let best = Array.isArray(data?.data) ? data.data[0] : data?.data || data;
  if (best) return best;

  // fallback: allow intermediate tokens and indirect routes
  const loose = new URLSearchParams({
    inputMint: params.inputMint,
    outputMint: params.outputMint,
    amount: params.amount,
    slippageBps: String(params.slippageBps ?? 50),
    restrictIntermediateTokens: "false",
    onlyDirectRoutes: "false",
    swapMode: "ExactIn",
  });
  const data2 = await fetchQuote(loose);
  best = Array.isArray(data2?.data) ? data2.data[0] : data2?.data || data2;
  if (!best) throw new Error("No best route");
  return best;
}
