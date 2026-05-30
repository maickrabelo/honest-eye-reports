
# Planos SMS para venda na Hotmart

5 planos novos, vendidos só na Hotmart (escondidos da landing), com IA bloqueada e regras específicas de cadastro de empresas. Upgrades de excedente cobrados manualmente via Asaas no padrão atual (próxima fatura mensal cheia, sem proporcional).

## 1. Novos planos em `subscription_plans`

| Slug | Nome | Categoria | Preço/mês | Empresas | Vidas | `create_company_login` | `ai_enabled` | `ouvidoria_enabled` |
|---|---|---|---|---|---|---|---|---|
| `tecnico-sst-sms` | Técnico SST SMS | manager | R$ 249,90 | 30 | 3000 | **false** | false | false |
| `gestora-sst-sms-basic` | Gestora SST SMS Basic | manager | R$ 499,00 | 10 | 1000 | true | false | false |
| `gestora-sst-sms-pro` | Gestora SST SMS Pro | manager | R$ 599,00 | 30 | 3000 | true | false | false |
| `empresa-sms-starter` | Empresa SMS Starter | company | R$ 149,90 | 1 | 49 | — | false | false |
| `empresa-sms-corporate` | Empresa SMS Corporate | company | R$ 249,90 | 1 | 99 | — | false | false |

Todos com `visibility = 'hotmart_only'` → `PricingSection.tsx` adiciona `.eq('visibility','public')` e eles não aparecem na landing.

## 2. Schema (migration única)

`subscription_plans`: adicionar
- `visibility text default 'public'` (`public` | `hotmart_only`)
- `ai_enabled boolean default true`
- `ouvidoria_enabled boolean default true`
- `create_company_login boolean default true`

Nova tabela `plan_upgrade_pricing` (`plan_id`, `kind` `company|employee`, `unit_price_cents`) populada com:
- `tecnico-sst-sms`: empresa R$ 8,00 / vida R$ 0,08
- `gestora-sst-sms-basic|pro`: empresa R$ 19,90 / vida R$ 0,19
- `empresa-sms-starter|corporate`: vida R$ 2,30 (sem empresa)

`sst_extra_slot_purchases`: adicionar `kind text default 'company'` e `unit_price_cents int`. Nova `company_extra_employee_slots` análoga, ou reaproveitar coluna nova `extra_employee_slots` em `companies` e `sst_managers`.

Função `has_ai_access(_user_id uuid) returns boolean` security definer: retorna `plan.ai_enabled` da subscription ativa do owner (company ou manager). Usada para gating server-side.

## 3. Mapeamento Hotmart

5 linhas em `hotmart_product_plans` — os `product_id` da Hotmart você cadastra depois (tabela já existe).

## 4. Provisionamento (`hotmart-webhook` + `create-sst-company`)

- `manager` com `create_company_login = false` (Técnico SMS): cria `sst_managers` normalmente; ao cadastrar empresa filha, `create-sst-company` ramifica e **não cria `auth.users` / `profiles` / e-mail de credenciais**. Empresa fica como registro de dados, gerenciada via o **CompanySelector** já existente no dashboard do técnico.
- `gestora-sst-sms-basic/pro`: fluxo atual de gestora SST (cria login por empresa filha).
- `empresa-sms-*`: fluxo atual de company (1 login, sem subempresas).
- Ao provisionar empresa filha de qualquer plano SMS, webhook grava `company_feature_access` com `ouvidoria_enabled = false` (e demais flags como já existem).

## 5. Bloqueio de IA (UI + backend)

**Backend** — `sonia-chat`, `analyze-reports`, `analyze-climate-survey`, `chat-report`: chamar `has_ai_access(userId)` no início; se falso → 403 `ai_not_available_in_plan`. Garante zero consumo de crédito.

**Frontend** — novo hook `useAiAccess()` (padrão de `useCompanyFeatures`). Esconde:
- `SoniaChat` (sidebar) e `SoniaFormChat` (questionário por IA)
- Botões "Analisar com IA" em `AIAnalysisCard`, `AIInsightsCard`, fluxos de `analyze-reports`
- Ouvidoria nos dashboards já é coberta automaticamente via `useCompanyFeatures` lendo `ouvidoria_enabled = false`

## 6. Upgrades manuais via Asaas

Extensão do `UpgradeSlotDialog` / `purchase-extra-company-slot` existentes:
- Novo `UpgradeEmployeeSlotDialog` (vidas extras).
- Nova edge function `purchase-extra-employee-slot` que cria assinatura recorrente Asaas usando `plan_upgrade_pricing.unit_price_cents`.
- `purchase-extra-company-slot` deixa de hard-codear R$ 19,90 e passa a ler de `plan_upgrade_pricing`.
- **Cobrança sempre na próxima fatura mensal cheia** (mantém padrão atual, sem proporcional).
- `useSubscriptionLimits` ganha contadores de empresas e vidas; `SSTDashboard` / `AddCompanyDialog` / dashboards de empresa disparam o dialog correto ao atingir limite.

## 7. Itens fora da landing

- `PricingSection.tsx`: adicionar `.eq('visibility','public')` no select de `subscription_plans`.
- Sem rota nova, sem botão de checkout interno — venda 100% via Hotmart.

## Detalhes técnicos

- Migration inclui `GRANT SELECT ON public.plan_upgrade_pricing TO authenticated` e mantém grants atuais de `subscription_plans`.
- `hotmart-webhook` continua idempotente via `hotmart_transaction_id`.
- `useAiAccess` cacheado por sessão (React Query) para evitar martelar `has_ai_access`.
- Memory novo: `mem://features/planos-sms-hotmart` resumindo flags (`ai_enabled`, `create_company_login`, `visibility`) e padrão de upgrades para futuras alterações.
