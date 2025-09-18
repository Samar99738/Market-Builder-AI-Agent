"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const functions_1 = require("../runtime/functions");
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const parser_1 = require("../agent/parser");
const generator_1 = require("../agent/generator");
const codegen_1 = require("../agent/codegen");
const solana_1 = require("../runtime/solana");
const web3_js_1 = require("@solana/web3.js");
const jupiter_1 = require("../runtime/jupiter");
const swap_1 = require("../runtime/swap");
// Global error visibility
process.on("uncaughtException", (e) => {
    console.error("[fatal] uncaughtException:", e);
});
process.on("unhandledRejection", (e) => {
    console.error("[fatal] unhandledRejection:", e);
});
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Serve static files from public directory
app.use(express_1.default.static("public"));
// Market cap lookup endpoint
app.get("/api/marketcap", async (req, res) => {
    const symbol = String(req.query.symbol || "").trim();
    const quote = String(req.query.quote || "USDC").trim();
    if (!symbol) {
        return res.status(400).json({ ok: false, error: "Missing symbol" });
    }
    try {
        const marketCap = await (0, functions_1.getMarketCap)(symbol, quote);
        res.json({ ok: true, symbol, quote, marketCap });
    }
    catch (e) {
        res.status(500).json({ ok: false, error: e?.message || String(e) });
    }
});
// Parse only
app.post("/api/parse", async (req, res) => {
    try {
        const text = String(req.body?.text || req.body?.strategy || "");
        const spec = await (0, parser_1.parseNaturalLanguage)(text);
        res.json({ ok: true, spec });
    }
    catch (e) {
        res.status(400).json({ ok: false, error: e?.message || String(e) });
    }
});
// Parse + generate + run
app.post("/api/run", async (req, res) => {
    try {
        const text = String(req.body?.text || req.body?.strategy || "");
        const network = (req.body?.network === "mainnet" ? "mainnet" : "devnet");
        const execute = !!req.body?.execute;
        const slippageBps = typeof req.body?.slippageBps === "number" ? req.body.slippageBps : 50;
        const spec = await (0, parser_1.parseNaturalLanguage)(text);
        const run = (0, generator_1.generateExecutable)(spec, { network, execute, slippageBps });
        const results = await run();
        res.json({ ok: true, network, execute, results });
    }
    catch (e) {
        res.status(400).json({ ok: false, error: e?.message || String(e) });
    }
});
// Optional: debug route to prebuild a swap and list involved program IDs without sending
app.post("/api/debug/prebuild", async (req, res) => {
    try {
        const { inputMint, outputMint, amount, network = "devnet", slippageBps = 75 } = req.body || {};
        if (!inputMint || !outputMint || !amount) {
            return res.status(400).json({ error: "Missing inputMint/outputMint/amount" });
        }
        const conn = (0, solana_1.getConnection)(network);
        const dummy = web3_js_1.Keypair.generate();
        const route = await (0, jupiter_1.getBestRoute)({
            inputMint,
            outputMint,
            amount: String(amount),
            slippageBps,
            environment: network === "mainnet" ? "mainnet-beta" : "devnet",
        });
        const tx = await (0, swap_1.buildSwapTransaction)({
            connection: conn,
            user: dummy,
            quoteResponse: route,
            wrapAndUnwrapSol: true,
            environment: network === "mainnet" ? "mainnet-beta" : "devnet",
        });
        const ids = Array.from(new Set(tx.message.compiledInstructions?.map((ix) => tx.message.staticAccountKeys[ix.programIdIndex]?.toBase58?.() || "<unknown>") || []));
        res.json({ programIds: ids, marketInfos: route?.marketInfos?.map((m) => m?.label) || [] });
    }
    catch (e) {
        res.status(500).json({ error: String(e?.message || e) });
    }
});
// Generate deterministic JavaScript for the strategy
app.post("/api/code", async (req, res) => {
    try {
        const text = String(req.body?.text || req.body?.strategy || "");
        const network = (req.body?.network === "mainnet" ? "mainnet" : "devnet");
        const slippageBps = typeof req.body?.slippageBps === "number" ? req.body.slippageBps : 50;
        const spec = await (0, parser_1.parseNaturalLanguage)(text);
        const code = (0, codegen_1.strategyToJavaScript)(spec, { network, slippageBps });
        res.json({ ok: true, code });
    }
    catch (e) {
        res.status(400).json({ ok: false, error: e?.message || String(e) });
    }
});
const port = Number(process.env.PORT || 3000);
app.listen(port, () => {
    console.log(`[http] listening on http://localhost:${port}`);
});
