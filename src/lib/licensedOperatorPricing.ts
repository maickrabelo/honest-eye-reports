export type OperatorPlanSlug = "ouvidoria" | "ouvidoria-smart";
export type OperatorBillingCycle = "monthly" | "annual";
export type OperatorBillingMode = "direct" | "operator";

/** Fator aplicado ao plano Ouvidoria Smart sobre a tabela base. */
export const SMART_FACTOR = 0.7;

export const OPERATOR_PRICING = {
  monthly: {
    upTo50Cents: 14900,
    upTo100Cents: 19900,
    perLifeCents: 180,
  },
  annual: {
    // valores mensais equivalentes (cobrados em 12x sem juros)
    upTo50Cents: 9900,
    upTo100Cents: 14900,
    perLifeCents: 140,
  },
} as const;

export const OPERATOR_PLAN_LABELS: Record<OperatorPlanSlug, string> = {
  ouvidoria: "Ouvidoria",
  "ouvidoria-smart": "Ouvidoria Smart",
};

export const OPERATOR_CYCLE_LABELS: Record<OperatorBillingCycle, string> = {
  monthly: "Mensal",
  annual: "Anual (12x sem juros)",
};

export const OPERATOR_MODE_LABELS: Record<OperatorBillingMode, string> = {
  direct: "Faturamento direto para a empresa",
  operator: "Faturamento para o licenciado",
};

export interface OperatorPriceResult {
  monthlyCents: number;
  totalChargeCents: number;
  installments: number;
  installmentCents: number;
  tier: string;
}

export function calculateOperatorPrice(
  planSlug: OperatorPlanSlug,
  employeeCount: number,
  billingCycle: OperatorBillingCycle,
): OperatorPriceResult {
  const employees = Math.max(1, Math.round(employeeCount || 0));
  const table = OPERATOR_PRICING[billingCycle];

  let base: number;
  let tier: string;
  if (employees <= 50) {
    base = table.upTo50Cents;
    tier = "Até 50 colaboradores";
  } else if (employees <= 100) {
    base = table.upTo100Cents;
    tier = "Até 100 colaboradores";
  } else {
    base = table.perLifeCents * employees;
    tier = `${employees} vidas × ${(table.perLifeCents / 100).toFixed(2).replace(".", ",")}/vida`;
  }

  const factor = planSlug === "ouvidoria-smart" ? SMART_FACTOR : 1;
  const monthlyCents = Math.round((base * factor) / 10) * 10;

  const installments = billingCycle === "annual" ? 12 : 1;
  const totalChargeCents = monthlyCents * installments;

  return {
    monthlyCents,
    totalChargeCents,
    installments,
    installmentCents: monthlyCents,
    tier,
  };
}

export function formatBRL(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
