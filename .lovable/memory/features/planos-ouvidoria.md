---
name: Planos Ouvidoria
description: Planos "Ouvidoria" (R$99/mês, com IA) e "Ouvidoria Smart" (R$39,90/mês, sem IA) vendidos exclusivamente na landing /ouvidoria
type: feature
---
- Slugs `ouvidoria` e `ouvidoria-smart` em `subscription_plans`, `category = 'company'`, `visibility = 'ouvidoria_only'` (novo valor no CHECK), somente `price_monthly_cents` (9900 / 3990), 1 empresa, 50 colaboradores, `pgr_enabled = false`.
- Não aparecem na home: `PricingSection` filtra `visibility = 'public'`. Aparecem só na seção de planos de `src/pages/Ouvidoria.tsx`, que envia para `/contratar?plano=<slug>&ciclo=monthly` (rota do Checkout é `/contratar`, não `/checkout`).
- `asaas-webhook` cria a linha em `company_feature_access` (PK = company_id) com psicossocial/burnout/clima/treinamentos = false e ouvidoria = true quando o slug é um desses dois planos.
- `company_has_smart_ouvidoria` reconhece `ouvidoria-smart` além de `sst-smart`; para essas empresas o `get_company_features` desliga a ouvidoria tradicional e libera o canal Smart (formulário + protocolo).
- Checkout esconde o seletor de ciclo quando só há um preço e faz fallback automático de ciclo.
