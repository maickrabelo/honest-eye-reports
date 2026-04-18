
A gestora SST precisa controlar quais ferramentas cada empresa cliente tem acesso. Preciso ver o Dashboard da empresa para saber onde aplicar os gates.

## Plano

### Objetivo
Permitir que a gestora SST habilite/desabilite por empresa cinco ferramentas: **Ouvidoria, Riscos Psicossociais (HSE-IT/COPSOQ), Burnout, Pesquisa de Clima, Treinamentos**. Quando desabilitada, a ferramenta some/aparece bloqueada no dashboard da empresa cliente.

### Backend

**Nova tabela `company_feature_access`** (1 linha por empresa, booleans por ferramenta):
```
company_id (uuid, PK, FK companies)
ouvidoria_enabled (bool, default true)
psicossocial_enabled (bool, default true)
burnout_enabled (bool, default true)
clima_enabled (bool, default true)
treinamentos_enabled (bool, default true)
updated_at, updated_by
```

**RLS**:
- SST gestora da empresa: SELECT/INSERT/UPDATE (via `company_sst_assignments`)
- Empresa (role `company`): SELECT da própria linha
- Admin: ALL

**Função helper** `public.get_company_features(_company_id uuid)` SECURITY DEFINER retornando os flags (cria default `true` se não existir registro) — evita bloqueio por RLS no fetch da empresa.

### Frontend

**1. Painel SST — Card da empresa (`SSTDashboard.tsx`)**
- Adicionar novo ícone (`Settings2` ou `ToggleRight`) ao lado do ícone de chave.
- Abre `ManageFeaturesDialog` com 5 switches (uma para cada ferramenta) — usa o componente `Switch` já existente.
- Salva via upsert em `company_feature_access`.
- Toast de confirmação.

**2. Hook `useCompanyFeatures(companyId)`**
- Busca os flags da empresa ativa via RPC `get_company_features`.
- Retorna `{ ouvidoria, psicossocial, burnout, clima, treinamentos, isLoading }`.
- Usado no Dashboard da empresa.

**3. Dashboard da empresa (`Dashboard.tsx`)**
- Antes de renderizar cada card de ferramenta, checar o flag.
- Se desabilitado: ocultar o card OU mostrar versão "bloqueada" com badge "Indisponível — Fale com seu gestor SST".
- Padrão: **ocultar** (mais limpo). Se todos desabilitados exceto HSE-IT, só HSE-IT aparece, conforme exemplo do usuário.

**4. Proteção de rotas (defesa em profundidade)**
- Nas páginas das ferramentas (`Reports`, `BurnoutManagement`, `COPSOQManagement`, `HSEITManagement`, `ClimateSurveyManagement`, `CompanyTrainings`), checar o flag no mount; se desabilitado, redirecionar para `/dashboard` com toast "Ferramenta indisponível".

### Comportamento esperado
- Default: todas ferramentas habilitadas (não quebra empresas existentes).
- Mudança aplica imediato na próxima carga do dashboard da empresa.
- Multi-empresa: cada empresa tem seus flags independentes (já que `activeCompanyId` define qual carregar).

### Arquivos a criar/editar
- **Migração SQL**: tabela `company_feature_access` + RLS + função `get_company_features`
- **Novo**: `src/components/sst/ManageFeaturesDialog.tsx`
- **Novo**: `src/hooks/useCompanyFeatures.ts`
- **Editar**: `src/pages/SSTDashboard.tsx` (botão de toggle no card)
- **Editar**: `src/pages/Dashboard.tsx` (gating dos cards)
- **Editar**: páginas das ferramentas (guard de rota)
