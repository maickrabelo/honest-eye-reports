export type OperatorPlanSlug = "ouvidoria" | "ouvidoria-smart";
export type OperatorBillingCycle = "monthly" | "annual";
export type OperatorBillingMode = "direct" | "operator";

export const SMART_FACTOR = 0.7;

export const OPERATOR_PRICING = {
  monthly: { upTo50Cents: 14900, upTo100Cents: 19900, perLifeCents: 180 },
  annual: { upTo50Cents: 9900, upTo100Cents: 14900, perLifeCents: 140 },
} as const;

export const OPERATOR_PLAN_LABELS: Record<OperatorPlanSlug, string> = {
  ouvidoria: "Ouvidoria",
  "ouvidoria-smart": "Ouvidoria Smart",
};

export function calculateOperatorPrice(
  planSlug: OperatorPlanSlug,
  employeeCount: number,
  billingCycle: OperatorBillingCycle,
) {
  const employees = Math.max(1, Math.round(employeeCount || 0));
  const table = OPERATOR_PRICING[billingCycle];

  let base: number;
  if (employees <= 50) base = table.upTo50Cents;
  else if (employees <= 100) base = table.upTo100Cents;
  else base = table.perLifeCents * employees;

  const factor = planSlug === "ouvidoria-smart" ? SMART_FACTOR : 1;
  const monthlyCents = Math.round((base * factor) / 10) * 10;
  const installments = billingCycle === "annual" ? 12 : 1;

  return {
    monthlyCents,
    totalChargeCents: monthlyCents * installments,
    installments,
    installmentCents: monthlyCents,
  };
}

export function brl(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
