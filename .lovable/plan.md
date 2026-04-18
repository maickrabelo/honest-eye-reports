
## Objetivo
Reestruturar planos e checkout: 5 novos planos (3 PJ + 2 Gestor) com 3 ciclos de pagamento, integração Asaas, liberação automática de acesso pós-pagamento e gates de uso.

## Backend

### Migração — `subscription_plans` reformulada
Limpar planos antigos e inserir os 5 novos. Colunas adicionadas:
- `category` (`company` | `manager`), `tier` (`starter`|`corporate`|`business_pro`|`gestor_basic`|`gestor_pro`|`gestor_master`)
- `max_companies`, `max_cnpjs`, `max_employees`
- `price_monthly_cents`, `price_quarterly_cents`, `price_annual_cents`
- `is_custom_quote` (true para Business Pro e Gestor Master)
- `features` (jsonb), `roi_initial_cents`, `roi_monthly_cents` (para cards de gestor)

### Novas tabelas
- **`subscriptions`**: `id`, `owner_user_id`, `plan_id`, `billing_cycle` (`monthly`|`quarterly`|`annual`), `status` (`pending`|`active`|`past_due`|`canceled`), `asaas_customer_id`, `asaas_subscription_id`, `current_period_start`, `current_period_end`, `next_charge_date`.
- **`user_companies.parent_subscription_id`** (nova coluna): agrupa CNPJs sob 1 assinatura Corporate.

### RLS
- Usuário vê própria subscription; admin vê tudo.
- Webhook usa service role.

## Integração Asaas (substitui Stripe nesses fluxos)

**Secret necessário**: `ASAAS_API_KEY` (vou solicitar após aprovação).

### Edge Functions novas
1. **`asaas-create-subscription`** — cria customer + assinatura recorrente Asaas (PIX/Boleto/Cartão), retorna `invoiceUrl`. Salva `subscriptions` com `status=pending`.
2. **`asaas-webhook`** (`verify_jwt=false`) — escuta `PAYMENT_CONFIRMED`/`PAYMENT_RECEIVED`/`PAYMENT_OVERDUE`/`SUBSCRIPTION_DELETED`. Ao confirmar: cria `auth.user` (via lógica de `create-user-with-password`), cria company(s), atribui role (`company` ou `sst`), envia credenciais por email (Resend).
3. **`asaas-check-payment`** — polling do status pelo frontend na tela de sucesso.

### Fluxo end-to-end
```
Landing → escolhe plano + ciclo → /contratar?plano=X&ciclo=Y
  → Checkout (form: empresa/gestor + ciclo + método)
  → asaas-create-subscription → redirect para invoiceUrl
  → Pagamento confirmado → webhook libera acesso + envia credenciais
  → /checkout/sucesso (polling até confirmar) → login
```

## Frontend

### 1. `PricingSection.tsx` — reescrita
- 2 abas: **"Para sua empresa"** | **"Para gestores"**
- Cada card com toggle de ciclo (Mensal/Trimestral/Anual) + badge "Economize X%" no anual
- Cards de gestor exibem **ROI estimado** ("Receita potencial: R$45.000 inicial + R$3.500/mês")
- Planos sob demanda (Business Pro / Gestor Master): botão "Falar com consultor" → WhatsApp

### 2. `Checkout.tsx` — refatorar para Asaas
- Form adaptado por categoria (empresa vs gestor)
- Para Corporate: UI dinâmica para listar até 5 CNPJs (add/remove)
- Seletor de ciclo + método (PIX/Boleto/Cartão)
- Submit → `asaas-create-subscription` → redireciona

### 3. `CheckoutSuccess.tsx`
- Polling em `asaas-check-payment` (5s, max 2min)
- Estado pendente: "Aguardando confirmação (PIX/Boleto pode demorar)"
- Confirmado: mostra credenciais + "Acessar painel"

### 4. Gates de uso
- Hook `useSubscriptionLimits(ownerId)` retorna limites + uso atual.
- `AddCompanyDialog` (gestor) e fluxo Corporate validam contra `max_companies`/`max_cnpjs` antes de salvar.
- Soma de colaboradores das empresas validada contra `max_employees` (planos de gestor).
- Banner "Limite atingido — fazer upgrade".

## Migração de dados
- Empresas existentes: marcadas `legacy_plan=true`, sem cobrança nova.
- Stripe permanece funcional como fallback para legados.

## Arquivos
**Migração SQL**: reset `subscription_plans` + insert dos 5 planos + tabela `subscriptions` + coluna `parent_subscription_id`.

**Edge Functions novas**:
- `supabase/functions/asaas-create-subscription/index.ts`
- `supabase/functions/asaas-webhook/index.ts`
- `supabase/functions/asaas-check-payment/index.ts`
- `supabase/config.toml` — registrar as 3 (webhook com `verify_jwt=false`)

**Frontend**:
- `src/components/commercial/PricingSection.tsx` (reescrita)
- `src/pages/Checkout.tsx` (refatorar p/ Asaas + ciclos + multi-CNPJ)
- `src/pages/CheckoutSuccess.tsx` (polling)
- `src/hooks/useSubscriptionLimits.ts` (novo)
- `src/components/sst/AddCompanyDialog.tsx` (validação de limite)

## Pontos críticos
- **Asaas API Key**: solicito via add_secret após aprovação. Sem ela não testo a integração.
- **Webhook URL**: após deploy informo a URL para você cadastrar em Asaas → Configurações → Integrações → Webhooks.
- **Sandbox primeiro**: começo em `sandbox.asaas.com/api/v3`; troca p/ produção quando confirmar.
- **Multi-CNPJ Corporate**: usa o mesmo padrão `user_companies` + `CompanySwitcher` já existente.
