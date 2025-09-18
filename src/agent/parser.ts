import "dotenv/config";
import { StrategySpecSchema, StrategySpec } from "../schema";
import { llmComplete } from "./llm";
import { localSymbolToMeta } from "../runtime/functions";

// uses regex to handle a simple "Buy" command format
function parseSimpleBuy(nl: string): StrategySpec | null {
  if (typeof nl !== "string" || !nl.trim()) return null;

  // match instructions like: Buy TOKEN for 10 USDC every 1 hour [when the market cap is > ...]
  const pattern = /^Buy\s+([A-Za-z0-9:_\-]+)\s+for\s+(\d+(?:\.\d+)?)\s+(USDC|SOL)(?:\s+every\s+(\d+)\s+(minutes?|hours?))?(?:\s+when\s+the\s+market\s+cap\s+is\s*>\s*(\d+))?/i;

  const m = nl.trim().match(pattern);
  if (!m) return null;

  let tokenOrMint = m[1];
  const amount = Number(m[2]);
  const currency = m[3].toUpperCase() as "USDC" | "SOL";
  // Patch: map common tokens to devnet mint addresses
  const devnetMints: Record<string, string> = {
    JUP: "JUPy4wrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN", // Example: replace with actual devnet JUP mint
    USDC: "Ejmc1UB4EsES5UfwnG6RZotwA9b6GzEhhQ1muQ8vG7hM", // Devnet USDC mint
  };
  // Import localSymbolToMeta from runtime/functions
  // Use ES import at top of file
  let buyStep: any = { type: "buy", budget: { amount, currency } };
  // Always resolve mint address and set outputMint
  let resolvedMint = undefined;
  if (tokenOrMint.toUpperCase() in devnetMints) {
    resolvedMint = devnetMints[tokenOrMint.toUpperCase()];
  } else {
    // Try to resolve symbol to mint address using localSymbolToMeta
    const meta = localSymbolToMeta(tokenOrMint, "devnet");
    if (meta && meta.mint) {
      resolvedMint = meta.mint;
    } else {
      // Fallback: treat tokenOrMint as mint address
      resolvedMint = tokenOrMint;
    }
  }
  buyStep.outputMint = resolvedMint;
  if (buyStep.token) delete buyStep.token;

  const everyN = m[4] ? Number(m[4]) : undefined;
  const unitRaw = m[5] ? String(m[5]).toLowerCase() : undefined;
  const unit =
    unitRaw?.startsWith("hour") ? "hours" : unitRaw?.startsWith("minute") ? "minutes" : undefined;

  const minMcap = m[6] ? Number(m[6]) : undefined;

  if (!amount || amount <= 0) return null;

  const steps: StrategySpec["steps"] = [buyStep];

  if (everyN && unit) {
    steps.push({
      type: "wait",
      every: everyN,
      unit: unit as "minutes" | "hours",
    } as any);
  }

  // return a structured strategy object
  const strategy: StrategySpec = {
    name: `Buy ${tokenOrMint} for ${amount} ${currency}${everyN && unit ? ` every ${everyN} ${unit}` : ""}${minMcap ? ` when the market cap is > ${minMcap}` : ""}`,
    steps,
  };
  if (minMcap) {
    (strategy as any).constraints = { min_mcap: minMcap };
  }
  return strategy;
}

// try to parse the natural language into a structured strategy
export async function parseNaturalLanguage(nl: string): Promise<StrategySpec> {
  if (!nl || typeof nl !== "string") {
    throw new Error("Missing or invalid input text");
  }

  // Always try LLM parsing first
  const prompt = `Parse the following instruction into this JSON schema only (single object, no prose):
{
  "name": string,
  "steps": Array<
    | { "type": "buy", "token"?: string, "outputMint"?: string,
        "budget"?: { "amount": number, "currency"?: "USDC" | "SOL" | "TOKENS" },
        "amountAtomic"?: string, "note"?: string }
    | { "type": "wait", "every": number, "unit": "minutes" | "hours" }
  >,
  "constraints"?: {
    "min_mcap"?: number,
    "max_token_age_days"?: number,
    "max_top_holder_pct"?: number,
    "require_social"?: boolean,
    "slippage_bps"?: number
  }
}
Instruction:
"""${nl}"""`;

  try {
    const resp = await llmComplete(prompt, { json: true, temperature: 0 });
    //console.log("[LLM raw response]", resp);
    let parsed;
    let cleaned = resp.text?.trim() || "";
    // Remove code block markers if present
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/```[a-zA-Z]*\n?/, "").replace(/```$/, "").trim();
    }
    try {
      parsed = JSON.parse(cleaned);
    } catch (err) {
      console.error("[LLM parse error]", err, resp.text);
      throw new Error("LLM response was not valid JSON");
    }
    const validated = StrategySpecSchema.safeParse(parsed);
    if (validated.success) return validated.data;
    else {
      console.error("[LLM schema validation failed]", validated.error, parsed);
    }
  } catch (err) {
    console.error("[LLM call failed]", err);
    // If LLM fails, fall back to regex
  }

  // try the simple regex parser
  const simple = parseSimpleBuy(nl);
  if (simple) {
    const v = StrategySpecSchema.safeParse(simple);
    if (v.success) return v.data;
  }

  // If nothing works, throw an error
  throw new Error(
    "Unable to parse. Try: Buy BONK for 1 USDC [every 1 hour]. Advanced parsing uses LLM."
  );
}
