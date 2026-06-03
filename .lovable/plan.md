## Objetivo

Permitir que uma gestora SST conceda acesso somente-leitura a setores (departments) específicos de avaliações HSE-IT e COPSOQ, para usuários externos que só verão o dashboard filtrado daquele(s) setor(es). Um mesmo usuário pode acumular vários setores em várias empresas da mesma gestora.

## Modelo de dados

Nova role `sector_viewer` em `app_role`.

Nova tabela `public.sector_viewer_access`:
- `user_id` (uuid)
- `sst_manager_id` (uuid) — gestora dona do convite (escopo)
- `company_id` (uuid)
- `assessment_type` (`'hseit' | 'copsoq'`)
- `department_name` (text) — nome do setor (HSE-IT usa `hseit_departments.name`; para COPSOQ, usar o mesmo nome textual coletado no formulário)
- `granted_by` (uuid)
- timestamps + UNIQUE(user_id, company_id, assessment_type, department_name)

Tabela `public.sector_viewer_invitations` (convite por e-mail, modelo igual a `account_invitations`):
- token, email, sst_manager_id, company_id, assessment_type, department_name[], expires_at, accepted_at.

GRANTs + RLS:
- `sector_viewer_access`: SELECT pelo próprio usuário; INSERT/DELETE pelo gestor SST dono (via `get_user_sst_manager_id`).
- Função `has_sector_access(_user, _company, _type, _dept)` SECURITY DEFINER.
- Função `get_user_sector_filters(_user, _company, _type)` retorna array de setores liberados.

## Backend (edge functions)

1. `invite-sector-viewer` — gestor SST cria convite, envia e-mail (Resend) com link `/convite-setor/:token`.
2. `accept-sector-viewer-invitation` — cria usuário (ou vincula existente), grava `user_roles` (sector_viewer) + linhas em `sector_viewer_access`, marca `must_change_password`.
3. `revoke-sector-viewer-access` — remove linhas específicas.

Registrar as 3 funções em `supabase/config.toml`.

## RLS dos dados de avaliação

Ampliar policies de SELECT em:
- `hseit_responses`, `hseit_departments`, `hseit_assessments`
- `copsoq_responses`, `copsoq_assessments`

Adicionar policy: usuário com role `sector_viewer` pode ler linhas cujo `(company_id, assessment_type, department)` esteja em `sector_viewer_access`. Para `hseit_responses` o filtro é por `department_id → hseit_departments.name`; para COPSOQ, por campo de setor da resposta.

## Frontend

**Gestão (gestor SST):**
- Em `HSEITManagement.tsx` e `COPSOQManagement.tsx`, novo botão "Compartilhar setor" abrindo `ShareSectorDialog` (e-mail + multi-select de setores). Lista de acessos já concedidos com botão revogar.

**Onboarding do convidado:**
- Rota `/convite-setor/:token` (componente novo `AcceptSectorInvitation.tsx`) — define senha e entra.
- Após login com role `sector_viewer`, redirecionar para nova página `/setor/dashboard` (em `RealAuthContext.navigateByRole`).

**Dashboard do sector_viewer (`SectorViewerDashboard.tsx`):**
- Lista acessos do usuário (empresa + tipo + setor) e abre visualização filtrada.
- Reusa `HSEITDashboardContent` e `COPSOQDashboardContent`, mas passando prop `sectorFilter` que força filtros e oculta seletor de empresa/avaliação.
- Bloquear export, edição, PDF — só leitura visual.

**Guard:** novo `useSectorViewerGuard` impede `sector_viewer` de acessar rotas fora de `/setor/*` e `/change-password`.

## Arquivos previstos

Novos:
- `supabase/functions/invite-sector-viewer/index.ts`
- `supabase/functions/accept-sector-viewer-invitation/index.ts`
- `supabase/functions/revoke-sector-viewer-access/index.ts`
- `src/pages/AcceptSectorInvitation.tsx`
- `src/pages/SectorViewerDashboard.tsx`
- `src/components/sector-sharing/ShareSectorDialog.tsx`
- `src/components/sector-sharing/SectorAccessList.tsx`
- `src/hooks/useSectorViewerAccess.ts`

Editados:
- `src/App.tsx` (rotas)
- `src/contexts/RealAuthContext.tsx` (role nova + redirect)
- `src/pages/HSEITManagement.tsx`, `src/pages/COPSOQManagement.tsx` (botão)
- `src/components/psychosocial/HSEITDashboardContent.tsx`, `COPSOQDashboardContent.tsx` (prop `sectorFilter`)
- `supabase/config.toml`

## Migration (resumo)

1. `ALTER TYPE app_role ADD VALUE 'sector_viewer'`
2. CREATE TABLE `sector_viewer_access` + GRANTs + RLS
3. CREATE TABLE `sector_viewer_invitations` + GRANTs + RLS
4. Funções `has_sector_access`, `get_user_sector_filters`
5. Policies adicionais em tabelas HSE-IT/COPSOQ

## Fora do escopo

- Burnout, Clima, Ouvidoria (apenas HSE-IT + COPSOQ, conforme respondido).
- Download de PDF/relatório para sector_viewer.
- Convite por usuário não-SST.
