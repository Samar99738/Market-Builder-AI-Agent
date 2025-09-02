"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.llmComplete = llmComplete;
require("dotenv/config");
const openai_1 = __importDefault(require("openai"));
const provider = process.env.LLM_PROVIDER || "openai";
const model = process.env.MODEL || "gpt-4o-mini";
let openai = null;
function getOpenAI() {
    if (!openai) {
        const key = process.env.OPENAI_API_KEY;
        if (!key)
            throw new Error("OPENAI_API_KEY is not set");
        openai = new openai_1.default({ apiKey: key });
    }
    return openai;
}
async function llmComplete(prompt, opts) {
    const temperature = opts?.temperature ?? 0;
    if (provider === "openai") {
        const client = getOpenAI();
        const resp = await client.chat.completions.create({
            model,
            temperature,
            messages: [
                {
                    role: "system",
                    content: "You are a helpful assistant that returns concise, structured outputs. If asked for JSON, respond with a single JSON object only.",
                },
                { role: "user", content: prompt },
            ],
            response_format: opts?.json ? { type: "json_object" } : undefined,
        });
        const firstChoice = Array.isArray(resp.choices) ? resp.choices[0] : undefined;
        const content = (firstChoice &&
            firstChoice.message &&
            typeof firstChoice.message.content === "string" &&
            firstChoice.message.content) ||
            "";
        const text = (content || "").trim();
        return { text };
    }
    throw new Error(`Unsupported LLM_PROVIDER: ${provider}`);
}
//# sourceMappingURL=llm.js.map