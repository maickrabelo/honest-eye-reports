
# Trial para Gestoras SST

## Resumo
Criar um fluxo de cadastro trial de 7 dias para empresas gestoras SST, permitindo que testem a plataforma com o limite de cadastro de apenas 1 empresa durante o periodo de teste.

## Como vai funcionar

1. Nova rota `/teste-gratis-sst` com formulario de cadastro simplificado para gestoras SST
2. Uma nova Edge Function (`create-sst-trial-account`) cria automaticamente o registro na tabela `sst_managers`, o usuario com role `sst`, e configura `max_companies = 1`
3. O SST Dashboard ja respeita o `max_companies` existente, entao o limite de 1 empresa funcionara automaticamente
4. Adicionar campos `subscription_status` e `trial_ends_at` na tabela `sst_managers` para controlar a expiracao do trial
5. Banner de trial e overlay de expiracao no SST Dashboard (similar ao que ja existe para empresas)

## O que muda

### 1. Migracao de banco de dados

Adicionar colunas de controle de trial na tabela `sst_managers`:

```sql
ALTER TABLE public.sst_managers 
  ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'inactive',
  ADD COLUMN IF NOT EXISTS trial_ends_at timestamp with time zone;
```

### 2. Nova Edge Function: `create-sst-trial-account`

Recebe os dados da gestora SST e:
- Cria o registro em `sst_managers` com `max_companies = 1`, `subscription_status = 'trial'` e `trial_ends_at = now() + 7 dias`
- Cria o usuario auth com senha temporaria
- Atualiza o perfil com `sst_manager_id`
- Define role como `sst`
- Envia email de boas-vindas com credenciais via Resend

### 3. Nova pagina: `SSTTrialSignup.tsx` (rota `/teste-gratis-sst`)

Formulario com:
- Nome da gestora SST
- Email
- Nome do responsavel
- Telefone (opcional)
- Botao "Iniciar teste gratis"

### 4. Verificacao de trial SST no contexto de autenticacao

Atualizar `RealAuthContext.tsx` para tambem verificar trial de SST managers (usando `sst_manager_id` do perfil em vez de `company_id`).

### 5. Banner e overlay no SST Dashboard

Reutilizar os componentes `TrialBanner` e `TrialExpiredOverlay` ja existentes no `SSTDashboard.tsx`, alimentados pelos dados de trial do SST manager.

### 6. Links na landing page

Adicionar botao "Teste gratis para Gestoras SST" na landing page principal e/ou na pagina comercial.

## Detalhes tecnicos

### Arquivos criados
- `supabase/functions/create-sst-trial-account/index.ts` -- edge function para criar conta trial SST
- `src/pages/SSTTrialSignup.tsx` -- pagina de cadastro trial para gestoras SST

### Arquivos editados
- `src/App.tsx` -- adicionar rota `/teste-gratis-sst`
- `src/contexts/RealAuthContext.tsx` -- expandir `checkTrialStatus` para verificar trial de SST managers
- `src/pages/SSTDashboard.tsx` -- adicionar TrialBanner e TrialExpiredOverlay
- `supabase/config.toml` -- configurar `verify_jwt = false` para nova function
- `src/components/landing/HeroSection.tsx` ou `src/components/commercial/PricingSection.tsx` -- adicionar link para trial SST

### Logica de limite

O `SSTDashboard.tsx` ja usa `maxCompanies` da tabela `sst_managers` e desabilita o botao "Nova Empresa" quando `companies.length >= maxCompanies`. Como o trial sera criado com `max_companies = 1`, o limite sera automaticamente respeitado sem alteracoes adicionais. O trigger `validate_sst_company_limit` no banco de dados tambem ja impede a criacao acima do limite.
