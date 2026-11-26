import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { chargeForPayment, validateBlackFriday } from '../_shared/blackFridayPromo.ts';

const before = new Date('2026-11-25T12:00:00Z');

Deno.test('2 primeiros meses custam R$ 9,90 e o 3º volta ao preço normal', () => {
  assertEquals([1, 2, 3, 4].map((n) => chargeForPayment(n, 19900)), [990, 990, 19900, 19900]);
});
Deno.test('oferta exige cartão de crédito', () => {
  assertEquals(validateBlackFriday('ouvidoria', 'monthly', 'PIX', before) !== null, true);
  assertEquals(validateBlackFriday('ouvidoria', 'monthly', 'CREDIT_CARD', before), null);
});
Deno.test('oferta só vale para planos de ouvidoria mensais', () => {
  assertEquals(validateBlackFriday('ouvidoria-smart', 'monthly', 'CREDIT_CARD', before), null);
  assertEquals(validateBlackFriday('ouvidoria', 'annual', 'CREDIT_CARD', before) !== null, true);
  assertEquals(validateBlackFriday('gestor-basic', 'monthly', 'CREDIT_CARD', before) !== null, true);
});
Deno.test('oferta recusada depois de 30/11/2026 23:59', () => {
  assertEquals(validateBlackFriday('ouvidoria', 'monthly', 'CREDIT_CARD', new Date('2026-12-01T03:00:01Z')) !== null, true);
});
