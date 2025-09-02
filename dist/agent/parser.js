"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseNaturalLanguage = parseNaturalLanguage;
require("dotenv/config");
const schema_1 = require("../schema");
const llm_1 = require("./llm");
/**
 * Regex fallback for simple buy instructions.
 * Examples:
 *  - "Buy BONK for 1 USDC"
 *  - "Buy <MINT> for 1 USDC"
 *  - "Buy BONK for 1 USDC every 1 hour"
 */
function parseSimpleBuy(nl) {
    if (typeof nl !== "string" || !nl.trim())
        return null;
    const pattern = /^Buy\s+([A-Za-z0-9:_\-]+)\s+for\s+(\d+(?:\.\d+)?)\s+(USDC|SOL)(?:\s+every\s+(\d+)\s+(minutes?|hours?))?$/i;
    const m = nl.trim().match(pattern);
    if (!m)
        return null;
    const tokenOrMint = m[1];
    const amount = Number(m[2]);
    const currency = m[3].toUpperCase();
    const everyN = m[4] ? Number(m[4]) : undefined;
    const unitRaw = m[5]?.toLowerCase();
    const unit = unitRaw?.startsWith("hour") ? "hours" : unitRaw?.startsWith("minute") ? "minutes" : undefined;
    if (!amount || amount <= 0)
        return null;
    const steps = [
        {
            type: "buy",
            token: tokenOrMint,
            budget: { amount, currency },
        },
    ];
    if (everyN && unit) {
        steps.push({
            type: "wait",
            every: everyN,
            unit: unit,
        });
    }
    return {
        name: `Buy ${tokenOrMint} for ${amount} ${currency}${everyN && unit ? ` every ${everyN} ${unit}` : ""}`,
        steps,
    };
}
async function parseNaturalLanguage(nl) {
    if (!nl || typeof nl !== "string") {
        throw new Error("Missing or invalid input text");
    }
    // 1) Try LLM JSON if key present
    if (process.env.OPENAI_API_KEY) {
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
            const resp = await (0, llm_1.llmComplete)(prompt, { json: true, temperature: 0 });
            const parsed = JSON.parse(resp.text || "{}");
            const validated = schema_1.StrategySpecSchema.safeParse(parsed);
            if (validated.success)
                return validated.data;
        }
        catch {
            // fallthrough to regex
        }
    }
    // 2) Regex fallback
    const simple = parseSimpleBuy(nl);
    if (simple) {
        const v = schema_1.StrategySpecSchema.safeParse(simple);
        if (v.success)
            return v.data;
    }
    // 3) Fail
    throw new Error("Unable to parse. Try: Buy BONK for 1 USDC [every 1 hour]. Or set OPENAI_API_KEY for advanced parsing.");
}
//# sourceMappingURL=parser.js.map