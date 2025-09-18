"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.strategyToJavaScript = strategyToJavaScript;
// Function to transform a StrategySpec into executable JavaScript code
// It generates a script that can be run in your repo using runtime helpers.
function strategyToJavaScript(spec, opts) {
    // Use provided options or fall back to defaults
    const network = opts?.network ?? "devnet";
    const slippageBps = typeof opts?.slippageBps === "number" ? opts.slippageBps : 50;
    // Collect lines of code as strings
    const lines = [];
    lines.push(`// Auto-generated script for strategy: ${spec.name}`);
    lines.push(`import { getConnection } from "./runtime/solana";`);
    lines.push(`import { inputMintForCurrency, resolveTokenMeta, getQuoteSummary } from "./runtime/functions";`);
    lines.push(``);
    lines.push(`async function run() {`);
    lines.push(`  const network = "${network}" as const;`);
    lines.push(`  const slippageBps = ${slippageBps};`);
    lines.push(`  const conn = getConnection(network);`);
    lines.push(``);
    // Iterate over each step in the strategy and generate corresponding code
    for (const step of spec.steps) {
        if (step.type === "buy") {
            // Generate code for a buy step
            const tok = step.token ?? step.outputMint ?? "";
            const amount = step.budget?.amount ?? step.amount ?? 0;
            const currency = (step.budget?.currency ?? "USDC");
            lines.push(`  // Step: buy ${tok} for ${amount} ${currency}`);
            lines.push(`  try {`);
            lines.push(`    const inMeta = inputMintForCurrency("${currency}", network);`);
            lines.push(`    const outMeta = await resolveTokenMeta("${tok}", network);`);
            lines.push(`    const quote = await getQuoteSummary("${currency}", "${tok}", ${amount}, slippageBps, network);`);
            lines.push(`    console.log("quote", { inMint: inMeta.mint, outMint: outMeta.mint, quote });`);
            lines.push(`  } catch (e) {`);
            lines.push(`    console.error("QUOTE_FAILED", String((e as Error)?.message || e));`);
            lines.push(`  }`);
            lines.push(``);
        }
        else if (step.type === "wait") {
            // Generate placeholder code for wait step
            lines.push(`  // Step: wait every ${step.every} ${step.unit}`);
            lines.push(`  // Implement scheduling/cron externally; this code is single-run.`);
            lines.push(``);
        }
        else {
            // Handle unsupported step types
            lines.push(`  // Unsupported step: ${step.type}`);
            lines.push(``);
        }
    }
    // Close the run function
    lines.push(`}`);
    lines.push(``);
    // Add error handling for running the generated script
    lines.push(`run().catch((e) => { console.error(e); process.exit(1); });`);
    // Return the generated code as a single string
    return lines.join("\n");
}
