"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const parser_1 = require("../agent/parser");
const generator_1 = require("../agent/generator");
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
// Simple homepage with a form to test endpoints
app.get("/", (_req, res) => {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(`<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Market Builder AI — Demo</title>
  <style>
    body { font-family: system-ui, Arial, sans-serif; padding: 24px; max-width: 960px; margin: auto; }
    textarea, input, select { width: 100%; padding: 8px; margin: 8px 0; }
    code, pre { background: #f5f5f5; padding: 12px; display: block; white-space: pre-wrap; overflow-x: auto; }
    .row { display: flex; gap: 16px; }
    .row > div { flex: 1; min-width: 300px; }
    button { padding: 10px 16px; }
    .note { font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <h1>Market Builder AI — Demo</h1>
  <p>Enter a strategy and choose an action. Example: <em>Buy BONK for 1 USDC every 1 hour</em></p>

  <div class="row">
    <div>
      <label>Strategy</label>
      <textarea id="text" rows="5">Buy BONK for 1 USDC every 1 hour</textarea>
    </div>
    <div>
      <label>Network</label>
      <select id="network">
        <option value="devnet" selected>devnet</option>
        <option value="mainnet">mainnet</option>
      </select>

      <label>Slippage (bps)</label>
      <input id="slippage" type="number" value="50" />

      <label>Action</label>
      <select id="action">
        <option value="simulate" selected>Simulate</option>
        <option value="generate-code">Generate Code</option>
        <option value="execute">Execute (devnet)</option>
      </select>

      <button id="run">Run</button>
      <p class="note">
        Execute requires EXECUTE_STRICT=1 and FOLLOWER_PRIVATE_KEY_BASE58 set in .env. Default input is USDC.
      </p>
    </div>
  </div>

  <h2>Response</h2>
  <pre id="out"></pre>

  <script>
    const out = document.getElementById("out");
    document.getElementById("run").addEventListener("click", async () => {
      out.textContent = "Running...";
      const text = (document.getElementById("text").value || "").trim();
      const network = document.getElementById("network").value || "devnet";
      const slippageBps = Number(document.getElementById("slippage").value || "50");
      const action = document.getElementById("action").value;

      try {
        let url = "/simulate";
        if (action === "generate-code") url = "/generate-code";
        else if (action === "execute") url = "/execute";

        const resp = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, network, slippageBps }),
        });

        const ct = resp.headers.get("content-type") || "";
        if (!resp.ok) {
          if (ct.includes("application/json")) {
            const err = await resp.json().catch(() => ({}));
            out.textContent = JSON.stringify(err, null, 2);
          } else {
            const errText = await resp.text().catch(() => "Request failed");
            out.textContent = errText;
          }
          return;
        }

        if (ct.includes("text/plain")) {
          const code = await resp.text();
          out.textContent = code;
        } else {
          const data = await resp.json();
          out.textContent = JSON.stringify(data, null, 2);
        }
      } catch (e) {
        out.textContent = String(e);
      }
    });
  </script>
</body>
</html>`);
});
// Health check
app.get("/health", (_req, res) => {
    res.json({ ok: true });
});
// Simulate endpoint: parse NL -> spec -> run (simulate only in Phase 1)
app.post("/simulate", async (req, res) => {
    try {
        const { text, network = "devnet", slippageBps = 50 /*, constraints */ } = req.body || {};
        if (!text || typeof text !== "string") {
            return res.status(400).json({ ok: false, error: "Missing text" });
        }
        const spec = await (0, parser_1.parseNaturalLanguage)(text);
        const run = (0, generator_1.generateExecutable)(spec, { network, slippageBps }); // removed constraints
        const results = await run();
        res.json({ ok: true, network, spec, results });
    }
    catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        res.status(500).json({ ok: false, error: msg });
    }
});
// Generate-code endpoint: returns a plain JavaScript script to copy-paste
app.post("/generate-code", async (req, res) => {
    try {
        const { text, network = "devnet", slippageBps = 50 } = req.body || {};
        if (!text || typeof text !== "string") {
            return res.status(400).json({ ok: false, error: "Missing text" });
        }
        const spec = await (0, parser_1.parseNaturalLanguage)(text);
        const script = `// Auto-generated by Market Builder AI
// Strategy: ${spec.name}
// Network: ${network}, Slippage: ${slippageBps}bps

(async () => {
  // --- Embedded Strategy Spec (parsed & validated) ---
  const strategy = ${JSON.stringify(spec, null, 2)};

  // --- Utilities ---
  async function getJupiterTokenList() {
    const res = await fetch("https://token.jup.ag/all");
    if (!res.ok) throw new Error("Failed to load Jupiter token list: " + res.status);
    return res.json();
  }

  function symbolToMeta(symbol, tokenList) {
    const sym = (symbol || "").toUpperCase();
    const found = tokenList.find(t => (t.symbol || "").toUpperCase() === sym);
    if (!found) return undefined;
    return { mint: found.address, decimals: found.decimals };
  }

  function looksLikeMint(s) {
    return typeof s === "string" && /^[1-9A-HJ-NP-Za-km-z]+$/.test(s) && s.length >= 32;
  }

  async function resolveTokenMeta(token, tokenList) {
    if (!token) throw new Error("Missing token");
    if (looksLikeMint(token)) {
      const fromList = tokenList.find(t => t.address === token);
      if (fromList) return { mint: token, decimals: fromList.decimals };
      return { mint: token, decimals: 9 }; // fallback if mint not in list
    }
    const local = symbolToMeta(token, tokenList);
    if (local) return local;
    throw new Error("Unknown token symbol: " + token);
  }

  async function getQuote({ inputMint, outputMint, amountAtomic, slippageBps = 50 }) {
    const base = "https://quote-api.jup.ag/v6/quote";
    const qs = new URLSearchParams({
      inputMint,
      outputMint,
      amount: amountAtomic,
      slippageBps: String(slippageBps),
      onlyDirectRoutes: "false",
      asLegacyTransaction: "false",
      maxAccounts: "32",
    });
    const res = await fetch(base + "?" + qs.toString());
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error("Jupiter quote error " + res.status + (text ? ": " + text : ""));
    }
    return res.json();
  }

    // --- Constants ---
  const SOL = { mint: "So11111111111111111111111111111111111111112", decimals: 9 };
  const USDC = { mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", decimals: 6 };

  // --- Runner (simulate only) ---
  async function runSim() {
    const tokenList = await getJupiterTokenList();
    const results = [];

    for (const step of strategy.steps) {
      if (step.type === "buy") {
        const token = step.token;
        const amount = (step.budget && step.budget.amount) || 0;
        const currency = (step.budget && step.budget.currency) || "USDC";

        if (!token || !amount || amount <= 0) {
          results.push({ step: "buy", skipped: true, reason: "missing token or amount" });
          continue;
        }

        try {
          const outMeta = await resolveTokenMeta(token, tokenList);
          const inMeta = currency === "SOL" ? SOL : USDC;
          const amountAtomic = Math.max(1, Math.round(amount * 10 ** inMeta.decimals)).toString();

          const data = await getQuote({
            inputMint: inMeta.mint,
            outputMint: outMeta.mint,
            amountAtomic,
            slippageBps: ${'${slippageBps}'},
          });
          const best = (Array.isArray(data?.data) ? data.data[0] : data?.data) || data;
          const outAmountAtomic = String(best?.outAmount || "");
          const outAmount = outAmountAtomic ? Number(outAmountAtomic) / 10 ** outMeta.decimals : 0;

          results.push({
            step: "buy",
            token,
            simulate: true,
            input: currency,
            amountIn: amount,
            outMint: outMeta.mint,
            outDecimals: outMeta.decimals,
            outAmountAtomic,
            outAmountApprox: Number(outAmount.toFixed(8)),
            routes: Array.isArray(data?.data) ? data.data.length : 1
          });
        } catch (e) {
          results.push({
            step: "buy",
            token,
            input: currency,
            error: e instanceof Error ? e.message : String(e),
          });
        }
      } else if (step.type === "wait") {
        results.push({
          step: "wait",
          every: step.every,
          unit: step.unit,
          simulate: true,
        });
      } else {
        results.push({ step: step.type, skipped: true, reason: "unsupported in demo" });
      }
    }

    return results;
  }


  // --- Execute demo ---
  try {
    const results = await runSim();
    console.log("=== Market Builder AI — Simulation Results ===");
    console.log(JSON.stringify({ ok: true, network: "${network}", strategy: strategy.name, results }, null, 2));
  } catch (e) {
    console.error("Simulation failed:", e);
    console.log(JSON.stringify({ ok: false, error: e instanceof Error ? e.message : String(e) }, null, 2));
  }
})();
`;
        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        res.status(200).send(script);
    }
    catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        res.status(500).json({ ok: false, error: msg });
    }
});
// Execute endpoint: performs an on-chain swap via Jupiter (guarded by env)
app.post("/execute", async (req, res) => {
    try {
        const { text, network = "devnet", slippageBps = 50 } = req.body || {};
        if (!text || typeof text !== "string") {
            return res.status(400).json({ ok: false, error: "Missing text" });
        }
        const spec = await (0, parser_1.parseNaturalLanguage)(text);
        // The generator handles safety checks (EXECUTE_STRICT, key presence, mainnet guard)
        const run = (0, generator_1.generateExecutable)(spec, { network, slippageBps, execute: true });
        const results = await run();
        res.json({ ok: true, network, spec, results });
    }
    catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        res.status(500).json({ ok: false, error: msg });
    }
});
const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;
console.log("[api] booting server…");
const server = app.listen(PORT, () => {
    console.log(`[api] listening on http://localhost:${PORT}`);
});
// Friendly shutdown
function shutdown() {
    console.log("[api] shutting down…");
    server.close(() => {
        console.log("[api] closed");
        process.exit(0);
    });
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
0;
//# sourceMappingURL=server.js.map