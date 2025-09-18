"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.llmComplete = llmComplete;
require("dotenv/config");
const node_fetch_1 = __importDefault(require("node-fetch"));
// Model name for Gemini
const model = process.env.MODEL || "gemini-2.5-pro";
// Function to call Gemini and get completion
async function llmComplete(prompt, opts) {
    const key = process.env.GEMINI_API_KEY;
    if (!key)
        throw new Error("GEMINI_API_KEY is not set");
    const url = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${key}`;
    const body = {
        contents: [
            {
                parts: [
                    { text: prompt }
                ]
            }
        ]
    };
    const resp = await (0, node_fetch_1.default)(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    });
    if (!resp.ok) {
        throw new Error(`Gemini API error: ${resp.status} ${await resp.text()}`);
    }
    const data = await resp.json();
    // Gemini returns candidates[0].content.parts[0].text
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    return { text: text.trim() };
}
