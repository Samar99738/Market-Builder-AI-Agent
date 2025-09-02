import "dotenv/config";
import fetch from "node-fetch";

// Response type for LLM output
type LLMResponse = { text: string };

// Model name for Gemini
const model = process.env.MODEL || "gemini-2.5-pro";

// Function to call Gemini and get completion
export async function llmComplete(
  prompt: string,
  opts?: { json?: boolean; temperature?: number }
): Promise<LLMResponse> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not set");
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
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!resp.ok) {
    throw new Error(`Gemini API error: ${resp.status} ${await resp.text()}`);
  }
  const data = await resp.json();
  // Gemini returns candidates[0].content.parts[0].text
  const text =
    data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  return { text: text.trim() };
}