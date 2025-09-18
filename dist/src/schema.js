"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StrategySpecSchema = exports.ActionSchema = exports.WaitActionSchema = exports.ConstraintsSchema = exports.BudgetCurrencySchema = exports.TimeUnitSchema = void 0;
exports.validateStrategySpec = validateStrategySpec;
const zod_1 = require("zod");
exports.TimeUnitSchema = zod_1.z.enum(["minutes", "hours"]);
exports.BudgetCurrencySchema = zod_1.z.enum(["USDC", "SOL", "TOKENS"]);
exports.ConstraintsSchema = zod_1.z.object({
    min_mcap: zod_1.z.number().positive().optional(),
    max_token_age_days: zod_1.z.number().int().positive().optional(),
    max_top_holder_pct: zod_1.z.number().min(0).max(100).optional(),
    require_social: zod_1.z.boolean().optional(),
    slippage_bps: zod_1.z.number().int().min(1).max(1000).optional(),
});
const BuyActionSchema = zod_1.z.object({
    type: zod_1.z.literal("buy"),
    token: zod_1.z.string().min(1).optional(),
    outputMint: zod_1.z.string().min(32).optional(),
    inputMint: zod_1.z.string().min(32).optional(),
    budget: zod_1.z.object({
        amount: zod_1.z.number().positive(),
        currency: exports.BudgetCurrencySchema.optional(),
    }).optional(),
    amountAtomic: zod_1.z.string().optional(),
    note: zod_1.z.string().optional(),
});
exports.WaitActionSchema = zod_1.z.object({
    type: zod_1.z.literal("wait"),
    every: zod_1.z.number().int().positive(),
    unit: exports.TimeUnitSchema,
});
exports.ActionSchema = zod_1.z.discriminatedUnion("type", [
    BuyActionSchema,
    exports.WaitActionSchema,
]);
exports.StrategySpecSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    steps: zod_1.z.array(exports.ActionSchema).min(1),
    constraints: exports.ConstraintsSchema.optional(),
}).superRefine((spec, ctx) => {
    for (let i = 0; i < spec.steps.length; i++) {
        const step = spec.steps[i];
        if (step.type === "buy") {
            if (!step.token && !step.outputMint) {
                ctx.addIssue({
                    code: zod_1.z.ZodIssueCode.custom,
                    message: "BuyAction requires either token or outputMint.",
                    path: ["steps", i, "token"],
                });
            }
        }
    }
});
function validateStrategySpec(spec) {
    return exports.StrategySpecSchema.safeParse(spec);
}
