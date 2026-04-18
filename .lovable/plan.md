
User confirmou e ajustou apenas o texto do popup. Plano permanece igual ao anterior, com a mensagem do popup atualizada.

## Objetivo
Adicionar **quantidade de colaboradores ativos** como atributo da empresa (capturado na criação, editável depois) e usar esse total no `DepartmentManager` para validar a alocação por setor nas avaliações.

## Backend
- Migração: adicionar `companies.employee_count` (integer, NOT NULL, default 0).

## Frontend

### 1. Captura/edição
- **`AddCompanyDialog.tsx`** (SST): novo campo obrigatório "Quantidade de colaboradores ativos" (number, min 1).
- **`EditCompanyDialog.tsx`** (SST) e **`CompanyProfile.tsx`** (empresa): campo editável.
- **`SSTTrialSignup.tsx`, `TrialSignup.tsx`, `Checkout.tsx`**: mesmo campo no cadastro.

### 2. `DepartmentManager.tsx` — saldo + validação
- Header: badge "Empresa: X colaboradores" + "Restantes: Y" (verde Y=0 / âmbar Y>0 / vermelho soma>X).
- Bloqueio: se soma > total, erro inline e impede salvar.
- Aviso ao salvar: se Y>0, abrir `AlertDialog` → **"Y colaboradores não estão sendo considerados na estrutura da empresa. Continuar?"** → Confirmar / Cancelar.
- Recebe `companyEmployeeCount` via prop.

### 3. Integração nos formulários de avaliação
Telas que usam `DepartmentManager` (HSE-IT, COPSOQ, Burnout, Clima): passar `companyEmployeeCount` da empresa ativa e interceptar submit para disparar o popup.

### 4. Migração de empresas existentes
Default `0`. Banner não-bloqueante no Dashboard: "Configure a quantidade de colaboradores ativos" → link para edição.

## Arquivos
**Migração**: `companies.employee_count`.

**Novo**: `src/hooks/useCompanyEmployeeCount.ts`.

**Editar**:
- `src/components/sst/AddCompanyDialog.tsx`, `EditCompanyDialog.tsx`
- `src/pages/SSTTrialSignup.tsx`, `TrialSignup.tsx`, `Checkout.tsx`, `CompanyProfile.tsx`, `Dashboard.tsx`
- `src/components/climate-survey/DepartmentManager.tsx`
- `HSEITManagement.tsx`, `COPSOQManagement.tsx`, `BurnoutManagement.tsx`, `ClimateSurveyManagement.tsx`
