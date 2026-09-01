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

/* ---------------------------------------------------------------
 * Níveis de parceiro (gamificação por MRR da carteira)
 * --------------------------------------------------------------- */

export type PartnerTierSlug = "bronze" | "prata" | "ouro";

export interface PartnerTier {
  slug: PartnerTierSlug;
  label: string;
  commissionRate: number; // %
  minCents: number;
  maxCents: number | null; // null = sem limite
  criterion: string;
  projection: string;
}

export const PARTNER_TIERS: PartnerTier[] = [
  {
    slug: "bronze",
    label: "Parceiro Bronze",
    commissionRate: 20,
    minCents: 0,
    maxCents: 200000,
    criterion: "Carteira de R$0 a R$2.000,00 de MRR",
    projection: "Ganho projetado: R$0 a R$4.800,00 por ano",
  },
  {
    slug: "prata",
    label: "Parceiro Prata",
    commissionRate: 25,
    minCents: 200001,
    maxCents: 500000,
    criterion: "Carteira de R$2.000,01 a R$5.000,00 de MRR",
    projection: "Ganho projetado: R$6.000,03 a R$15.000,00 por ano",
  },
  {
    slug: "ouro",
    label: "Parceiro Ouro",
    commissionRate: 30,
    minCents: 500001,
    maxCents: null,
    criterion: "Carteira acima de R$5.000,01 de MRR",
    projection: "Ganho projetado: a partir de R$18.000,03 por ano",
  },
];

export interface PartnerTierProgress {
  current: PartnerTier;
  next: PartnerTier | null;
  missingCents: number;
  progressPercent: number;
}

export function getPartnerTierProgress(monthlyVolumeCents: number): PartnerTierProgress {
  const mrr = Math.max(0, monthlyVolumeCents || 0);
  const current =
    [...PARTNER_TIERS].reverse().find((t) => mrr >= t.minCents) ?? PARTNER_TIERS[0];
  const idx = PARTNER_TIERS.findIndex((t) => t.slug === current.slug);
  const next = PARTNER_TIERS[idx + 1] ?? null;

  const missingCents = next ? Math.max(0, next.minCents - mrr) : 0;
  const start = current.minCents;
  const end = next ? next.minCents : current.minCents;
  const progressPercent = next
    ? Math.min(100, Math.max(0, ((mrr - start) / Math.max(1, end - start)) * 100))
    : 100;

  return { current, next, missingCents, progressPercent };
}

export const BILLING_MODE_DETAILS: Record<
  OperatorBillingMode,
  { title: string; tagline: string; bullets: string[]; example: string[] }
> = {
  direct: {
    title: "Faturamento direto para a empresa",
    tagline: "Recomendado para revenda",
    bullets: [
      "Você cadastra seu cliente no seu portal",
      "A cobrança vai direto para ele (e-mail com link de pagamento)",
      "Quando seu cliente realizar o pagamento, o valor da sua comissão é contabilizado no seu portal conforme seu nível de parceiro",
      "Todo dia 20 do mês fechamos suas comissões e repassamos para você após emissão da NF",
      "O acesso da empresa é liberado após a confirmação do pagamento",
    ],
    example: [
      "Empresa assina plano de R$100,00",
      "A empresa paga R$100,00 para a SOIA",
      "Você recebe R$20,00 de comissão (nível Bronze)",
    ],
  },
  operator: {
    title: "Faturamento para o licenciado",
    tagline: "Recomendado para revenda + serviço de acompanhamento",
    bullets: [
      "Você cadastra seu cliente no seu portal",
      "A conta é liberada automaticamente para ele, sem esperar pagamento",
      "O valor da assinatura é cobrado de você, com o desconto referente ao seu nível de parceiro",
      "Você cobra do seu cliente o valor que preferir pelo canal de ouvidoria",
      "Todo dia 20 do mês fechamos sua fatura e emitimos a cobrança total para você realizar o pagamento",
    ],
    example: [
      "Empresa assina plano de R$100,00",
      "A empresa paga R$0 para a SOIA",
      "Você paga R$80,00 para a SOIA (nível Bronze) e cobra do cliente o valor que quiser",
    ],
  },
};
