import { z } from "zod";

export const TimeUnitSchema = z.enum(["minutes", "hours"]);
export const BudgetCurrencySchema = z.enum(["USDC", "SOL", "TOKENS"]);

export const ConstraintsSchema = z.object({
  min_mcap: z.number().positive().optional(),
  max_token_age_days: z.number().int().positive().optional(),
  max_top_holder_pct: z.number().min(0).max(100).optional(),
  require_social: z.boolean().optional(),
  slippage_bps: z.number().int().min(1).max(1000).optional(),
});

const BuyActionSchema = z.object({
  type: z.literal("buy"),
  token: z.string().min(1).optional(),
  outputMint: z.string().min(32).optional(),
  inputMint: z.string().min(32).optional(),
  budget: z.object({
    amount: z.number().positive(),
    currency: BudgetCurrencySchema.optional(),
  }).optional(),
  amountAtomic: z.string().optional(),
  note: z.string().optional(),
});

export const WaitActionSchema = z.object({
  type: z.literal("wait"),
  every: z.number().int().positive(),
  unit: TimeUnitSchema,
});

export const ActionSchema = z.discriminatedUnion("type", [
  BuyActionSchema,
  WaitActionSchema,
]);

export const StrategySpecSchema = z.object({
  name: z.string().min(1),
  steps: z.array(ActionSchema).min(1),
  constraints: ConstraintsSchema.optional(),
}).superRefine((spec: any, ctx) => {
  for (let i = 0; i < spec.steps.length; i++) {
    const step = spec.steps[i] as any;
    if (step.type === "buy") {
      if (!step.token && !step.outputMint) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "BuyAction requires either token or outputMint.",
          path: ["steps", i, "token"],
        });
      }
    }
  }
});

export type StrategySpec = z.infer<typeof StrategySpecSchema>;
export function validateStrategySpec(spec: unknown) {
  return StrategySpecSchema.safeParse(spec);
}
