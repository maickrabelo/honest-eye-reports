

## Liberar ferramentas (Psicossocial, Burnout, Clima) para empresas sem gestora SST

### Regra de negócio
- Empresa **sem** gestora SST vinculada (sem registro em `company_sst_assignments`) → acesso total a Riscos Psicossociais (HSE-IT + COPSOQ), Burnout e Pesquisa de Clima.
- Empresa **com** gestora SST vinculada → continua sem essas ferramentas (a gestora aplica). Mantém apenas Ouvidoria e Treinamentos.

### 1. Banco de dados (migration)

Criar uma função e políticas RLS para que o role `company` possa criar/editar/excluir suas próprias avaliações **apenas quando não tiver SST atribuído**.

```sql
-- Helper: verifica se a empresa NÃO tem SST atribuído
CREATE OR REPLACE FUNCTION public.company_has_no_sst(_company_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.company_sst_assignments WHERE company_id = _company_id
  )
$$;
```

Para cada uma das tabelas abaixo, adicionar policies INSERT / UPDATE / DELETE para `company` role gated por `company_has_no_sst(company_id)` + `profile.company_id = company_id`:
- `hseit_assessments`, `hseit_departments`
- `copsoq_assessments`, `copsoq_departments`
- `burnout_assessments`, `burnout_departments`
- `climate_surveys` (já tem policies de company — apenas validar gating)

### 2. Hook novo: `useCompanyHasSST`

`src/hooks/useCompanyHasSST.ts` — retorna `{ hasSST, isLoading }` consultando `company_sst_assignments` por `company_id`.

### 3. Dashboard da empresa (`src/pages/Dashboard.tsx`)

Adicionar uma seção **"Suas Ferramentas"** (cards estilo SSTDashboard), exibida **somente quando `!hasSST`** e respeitando `useCompanyFeatures`:

- Card **Riscos Psicossociais** → `/psychosocial-dashboard` (visível se `features.psicossocial`)
- Card **Avaliação Burnout** → `/burnout-dashboard` (visível se `features.burnout`)
- Card **Pesquisa de Clima** → `/climate-dashboard` (visível se `features.clima`)

Layout: grid 3 colunas com ícones (`Brain`, `Flame`, `ClipboardList`) seguindo o mesmo padrão visual dos cards do SSTDashboard.

### 4. Liberar acesso de rota para role `company`

Atualizar os guards de role nos dashboards de ferramentas para aceitar `company` (somente quando a empresa não tem SST):

- `src/pages/PsychosocialDashboard.tsx` — adicionar `'company'` ao array `['admin','sst','sales']`.
- `src/pages/BurnoutDashboard.tsx` — adicionar `'company'` à checagem `role !== 'admin' && role !== 'sst'`.
- `src/pages/HSEITDashboard.tsx` — adicionar `'company'` ao `includes`.
- `src/pages/ClimateSurveyDashboard.tsx` — já tem branch `role === 'company'` para fetch; validar e ajustar `backPath` para `/dashboard`.

Em cada um desses dashboards, quando `role === 'company'`:
- Fetch carrega dados apenas da empresa do `profile.company_id`.
- Esconde o seletor "Empresas" do filtro (única empresa).
- Botão "Voltar" aponta para `/dashboard`.
- Se a empresa **tiver** SST atribuído (verificar via `useCompanyHasSST`), redirecionar de volta para `/dashboard` com toast informativo.

### 5. Componentes de gestão (HSEITManagement, BurnoutManagement, COPSOQManagement, ClimateSurveyManagement)

Liberar role `company` nas guards e pré-selecionar `profile.company_id` automaticamente no campo "Empresa" (esconder o select de empresa para esse role).

### 6. Ajustes visuais

Manter o design existente da Dashboard (header roxo gradient + cards). Os novos cards de ferramentas ficam logo abaixo do título "Dashboard" e antes do card de Treinamentos, com animação `animate-fade-in`.

### Resumo técnico
- **1 migration SQL** (função helper + ~10 RLS policies novas para o role `company`).
- **1 hook novo** (`useCompanyHasSST`).
- **1 página alterada** (Dashboard — adiciona seção de ferramentas condicional).
- **~8 páginas alteradas** (dashboards e management screens — relaxar role guards e adaptar UI para empresa única).

