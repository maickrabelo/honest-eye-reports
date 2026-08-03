## Objetivo

Criar dois planos vendidos **somente** na landing `/ouvidoria`, com checkout funcionando e as demais ferramentas bloqueadas.

| Plano | Slug | Preço | Limite | IA | Canal |
|---|---|---|---|---|---|
| Ouvidoria | `ouvidoria` | R$ 99,00/mês | 1 empresa, 50 colaboradores | Sim | Ouvidoria tradicional (SOnIA) |
| Ouvidoria Smart | `ouvidoria-smart` | R$ 39,90/mês | 1 empresa, 50 colaboradores | Não | Ouvidoria Smart (formulário + protocolo) |

Somente cobrança **mensal** (sem trimestral/anual), pois os preços informados são mensais.

## 1. Banco de dados

- Inserir os 2 planos em `subscription_plans`: `category = 'company'`, `visibility = 'ouvidoria_only'` (novo valor, então não aparecem em `PricingSection`), `is_active = true`, `max_companies = 1`, `max_employees = 50`, `max_cnpjs = 1`, `price_monthly_cents` 9900 / 3990, demais preços nulos, `pgr_enabled = false`, `ouvidoria_enabled = true`, `ai_enabled = true` (Ouvidoria) / `false` (Smart), `features` com os bullets de cada um.
- Atualizar `company_has_smart_ouvidoria` para reconhecer também o slug `ouvidoria-smart` (hoje só `sst-smart`), na ramificação que usa `companies.parent_subscription_id`. Assim a empresa do plano Smart libera o canal beta e o `get_company_features` continua desligando a ouvidoria tradicional dela.

## 2. Provisionamento pós-pagamento

Em `supabase/functions/asaas-webhook/index.ts`, após criar a empresa: se o slug do plano for `ouvidoria` ou `ouvidoria-smart`, inserir linha em `company_feature_access` com `psicossocial_enabled`, `burnout_enabled`, `clima_enabled`, `treinamentos_enabled` = false e `ouvidoria_enabled` = true. Isso faz o `Dashboard` da empresa exibir apenas o canal de denúncias (o `useCompanyFeatures` já respeita esses flags), e o Smart cai automaticamente no canal sem IA.

## 3. Landing `/ouvidoria`

Adicionar uma seção de planos (antes do formulário final) em `src/pages/Ouvidoria.tsx`:
- Dois cards destacados no mesmo padrão visual da página (Ouvidoria em destaque "Mais completo", Smart como "Melhor custo").
- Comparativo curto: IA conversacional + triagem automática vs. formulário anônimo com protocolo e chave de acesso.
- Botão de cada card levando para `/checkout?plano=ouvidoria&ciclo=monthly` e `/checkout?plano=ouvidoria-smart&ciclo=monthly`, com `fbqTrack('InitiateCheckout')` (protegido por try/catch, como já feito na página).
- Nenhuma alteração na `PricingSection` da home: como a visibilidade é `ouvidoria_only`, os planos não aparecem lá. Vou confirmar se a `PricingSection` filtra por `visibility = 'public'`; se ela buscar todos os planos ativos, adiciono o filtro explícito.

## 4. Checkout

`src/pages/Checkout.tsx` já carrega qualquer plano por slug, mostra só os ciclos com preço (ficará apenas Mensal) e envia para `asaas-create-subscription`. Ajustes previstos:
- Garantir que o resumo funcione bem com apenas 1 ciclo disponível (esconder o seletor de ciclo quando houver uma única opção).
- Confirmar em `asaas-create-subscription` que o valor mensal é lido de `price_monthly_cents` sem depender de ciclo anual.

## Detalhes técnicos

- Migração SQL para os inserts de plano + `CREATE OR REPLACE FUNCTION public.company_has_smart_ouvidoria` (mantendo `security definer` e `search_path`).
- `company_feature_access` já existe com RLS; a inserção é feita pelo webhook com service role.
- Nada muda para gestoras SST nem para planos SMS/Hotmart existentes.
