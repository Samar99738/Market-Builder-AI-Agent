import { getMarketCap } from "../runtime/functions";
import "dotenv/config";
import express from "express";
import cors from "cors";
import { parseNaturalLanguage } from "../agent/parser";
import { generateExecutable } from "../agent/generator";
import { strategyToJavaScript } from "../agent/codegen";

// Global error visibility
process.on("uncaughtException", (e) => {
  console.error("[fatal] uncaughtException:", e);
});
process.on("unhandledRejection", (e) => {
  console.error("[fatal] unhandledRejection:", e);
});

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files from public directory
app.use(express.static("public"));

// Market cap lookup endpoint
app.get("/api/marketcap", async (req, res) => {
  const symbol = String(req.query.symbol || "").trim();
  const quote = String(req.query.quote || "USDC").trim();
  if (!symbol) {
    return res.status(400).json({ ok: false, error: "Missing symbol" });
  }
  try {
    const marketCap = await getMarketCap(symbol, quote);
    res.json({ ok: true, symbol, quote, marketCap });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e?.message || String(e) });
  }
});

// Parse only
app.post("/api/parse", async (req, res) => {
  try {
    const text = String(req.body?.text || "");
    const spec = await parseNaturalLanguage(text);
    res.json({ ok: true, spec });
  } catch (e: any) {
    res.status(400).json({ ok: false, error: e?.message || String(e) });
  }
});

// Parse + generate + run
app.post("/api/run", async (req, res) => {
  try {
    const text = String(req.body?.text || "");
    const network = (req.body?.network === "mainnet" ? "mainnet" : "devnet") as
      | "devnet"
      | "mainnet";
    const execute = !!req.body?.execute;
    const slippageBps =
      typeof req.body?.slippageBps === "number" ? req.body.slippageBps : 50;

    const spec = await parseNaturalLanguage(text);
    const run = generateExecutable(spec, { network, execute, slippageBps });
    const results = await run();
    res.json({ ok: true, network, execute, results });
  } catch (e: any) {
    res.status(400).json({ ok: false, error: e?.message || String(e) });
  }
});

// Generate deterministic JavaScript for the strategy
app.post("/api/code", async (req, res) => {
  try {
    const text = String(req.body?.text || "");
    const network = (req.body?.network === "mainnet" ? "mainnet" : "devnet") as "devnet" | "mainnet";
    const slippageBps = typeof req.body?.slippageBps === "number" ? req.body.slippageBps : 50;

    const spec = await parseNaturalLanguage(text);
    const code = strategyToJavaScript(spec, { network, slippageBps });
    res.json({ ok: true, code });
  } catch (e: any) {
    res.status(400).json({ ok: false, error: e?.message || String(e) });
  }
});

const port = Number(process.env.PORT || 3000);
app.listen(port, () => {
  console.log(`[http] listening on http://localhost:${port}`);
});
