// Black Friday Ouvidoria 2026 — keep in sync with src/lib/blackFridayPromo.ts
export const BF_PROMO_CODE = 'blackfriday-2026';
export const BF_PROMO_PRICE_CENTS = 990;
export const BF_PROMO_MONTHS = 3;
export const BF_PROMO_DEADLINE = '2026-12-01T02:59:59Z'; // 30/11/2026 23:59 (BRT)
export const BF_PROMO_PLANS = ['ouvidoria', 'ouvidoria-smart'];

export function validateBlackFriday(
  planSlug: string, billingCycle: string, billingType: string, now = new Date(),
): string | null {
  if (now.getTime() > new Date(BF_PROMO_DEADLINE).getTime()) return 'A oferta Black Friday foi encerrada.';
  if (!BF_PROMO_PLANS.includes(planSlug)) return 'Oferta válida apenas para os planos de Ouvidoria.';
  if (billingCycle !== 'monthly') return 'Oferta válida apenas no plano mensal.';
  if (billingType !== 'CREDIT_CARD') return 'Oferta válida apenas com cartão de crédito.';
  return null;
}

/** Valor da cobrança de número `n` (1-based). */
export function chargeForPayment(n: number, regularCents: number): number {
  return n <= BF_PROMO_MONTHS ? BF_PROMO_PRICE_CENTS : regularCents;
}
