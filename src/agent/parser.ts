import "dotenv/config";
import { StrategySpecSchema, StrategySpec } from "../schema";
import { llmComplete } from "./llm";

// uses regex to handle a simple "Buy" command format
function parseSimpleBuy(nl: string): StrategySpec | null {
  if (typeof nl !== "string" || !nl.trim()) return null;

  // match instructions like: Buy TOKEN for 10 USDC every 1 hour
  const pattern =
    /^Buy\s+([A-Za-z0-9:_\-]+)\s+for\s+(\d+(?:\.\d+)?)\s+(USDC|SOL)(?:\s+every\s+(\d+)\s+(minutes?|hours?))?$/i;

  const m = nl.trim().match(pattern);
  if (!m) return null;

  const tokenOrMint = m[1];
  const amount = Number(m[2]);
  const currency = m[3].toUpperCase() as "USDC" | "SOL";

  const everyN = m[4] ? Number(m[4]) : undefined;
  const unitRaw = m[5] ? String(m[5]).toLowerCase() : undefined;
  const unit =
    unitRaw?.startsWith("hour") ? "hours" : unitRaw?.startsWith("minute") ? "minutes" : undefined;

  if (!amount || amount <= 0) return null;

  // define the steps for the strategy (buy, and maybe wait)
  const steps: StrategySpec["steps"] = [
    {
      type: "buy",
      token: tokenOrMint,
      budget: { amount, currency },
    } as any,
  ];

  if (everyN && unit) {
    steps.push({
      type: "wait",
      every: everyN,
      unit: unit as "minutes" | "hours",
    } as any);
  }

  // return a structured strategy object
  return {
    name: `Buy ${tokenOrMint} for ${amount} ${currency}${everyN && unit ? ` every ${everyN} ${unit}` : ""}`,
    steps,
  };
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
