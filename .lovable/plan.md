

## Sistema de Convite de Colaboradores (Multi-usuário por conta)

Permitir que o usuário principal de uma **Gestora SST** ou **Empresa Final** convide colaboradores por e-mail, que ao se cadastrarem na SOIA recebem acesso automático ao mesmo dashboard e ferramentas.

### 1. Modelo de dados (migrations)

**Nova tabela `account_invitations`** — armazena convites pendentes:

| Coluna | Tipo | Notas |
|---|---|---|
| `id` | uuid | PK |
| `email` | text | normalizado (lowercase) |
| `account_type` | text | `'sst'` ou `'company'` |
| `sst_manager_id` | uuid nullable | FK quando `account_type='sst'` |
| `company_id` | uuid nullable | FK quando `account_type='company'` |
| `invited_by` | uuid | usuário que enviou |
| `token` | text unique | usado no link do convite |
| `status` | text | `pending` / `accepted` / `revoked` |
| `expires_at` | timestamptz | 7 dias |
| `accepted_at` / `accepted_by` | nullable | preenchido no aceite |

Constraint: exatamente um entre `sst_manager_id` e `company_id` deve estar preenchido.

**Nova tabela `user_sst_managers`** (espelha `user_companies`, hoje inexistente para SST):
- `user_id`, `sst_manager_id`, `is_default`, `created_at`
- Permite múltiplos usuários por gestora SST. O `profiles.sst_manager_id` continua representando a gestora "ativa" do usuário.

**RLS**:
- `account_invitations`: SELECT/INSERT/UPDATE para usuários vinculados à conta (gestora ou empresa) + admin. SELECT público apenas via edge function (token).
- `user_sst_managers`: SELECT do próprio user; admins gerenciam tudo; usuários vinculados à mesma gestora podem ver entradas dela.

### 2. Edge Functions

**`invite-collaborator`** (verify_jwt = false, valida JWT em código)
- Recebe `{ email, account_type, account_id }`.
- Valida que o caller pertence à conta (via `user_companies` ou `user_sst_managers` / `profiles.sst_manager_id`) e tem role compatível (`sst` ou `company`).
- Cria registro em `account_invitations` com token aleatório e expiração 7d.
- Envia e-mail via Resend com link `https://soia.app.br/convite/{token}` usando o template padrão SOIA.
- Retorna sucesso (não revela se e-mail já existe).

**`accept-invitation`** (verify_jwt = true)
- Recebe `{ token }` do usuário autenticado.
- Valida token (status, expiração) e e-mail bate com `auth.users.email`.
- Insere em `user_companies` ou `user_sst_managers`.
- Garante role correto em `user_roles` (`company` ou `sst`).
- Atualiza `profiles.company_id`/`sst_manager_id` se o usuário ainda não tinha vínculo (define como ativa).
- Marca convite como `accepted`.

**`revoke-invitation`** — remove/cancela convite pendente.

### 3. UI — Tela "Equipe / Colaboradores"

Novo card no perfil do usuário principal, em duas localizações:

**A. Para Gestora SST** — em `src/pages/SSTDashboard.tsx`, nova aba/tab **"Equipe"**:
- Lista colaboradores ativos da gestora (query em `user_sst_managers` join `profiles` + email via edge function `list-account-collaborators`).
- Lista convites pendentes com botão "Reenviar" e "Revogar".
- Botão **"Convidar colaborador"** → modal com input de e-mail.

**B. Para Empresa Final** — em `src/pages/CompanyProfile.tsx`, mesma estrutura, mas operando sobre `user_companies` da empresa ativa.

Componentes novos:
- `src/components/collaborators/TeamManagementCard.tsx` (genérico, recebe `accountType` + `accountId`)
- `src/components/collaborators/InviteCollaboratorDialog.tsx`
- `src/components/collaborators/PendingInvitationsList.tsx`

### 4. Fluxo de aceite

Nova rota pública `/convite/:token` → `src/pages/AcceptInvitation.tsx`:
- Se não logado: mostra info do convite (nome da gestora/empresa) e botão **"Criar conta / Entrar"** que redireciona para `/auth?invitation={token}&email={email}` com o e-mail pré-preenchido.
- Se logado com e-mail correto: chama `accept-invitation` automaticamente e redireciona para o dashboard apropriado.
- Se logado com e-mail diferente: pede para sair e logar com o e-mail convidado.

`AuthForm.tsx` é ajustado para, após signup/login, detectar o parâmetro `invitation` na URL e chamar `accept-invitation` antes de redirecionar.

### 5. Permissões dos colaboradores

Todos colaboradores vinculados a uma gestora/empresa têm o **mesmo nível de acesso** que o usuário original (sem hierarquia inicial). Já garantido pelas RLS atuais que verificam `profiles.sst_manager_id` ou `user_companies` — basta que o vínculo exista.

Diferença sutil: a coluna `is_default` em `user_sst_managers`/`user_companies` marca o "dono" original (não-removível), enquanto colaboradores convidados entram com `is_default=false` e podem ser removidos pelo dono.

### Detalhes técnicos

- **E-mail**: template HTML branded SOIA (mesmo padrão de `send-test-welcome`), assunto: "Você foi convidado para a {Nome da Conta} no SOIA".
- **Segurança**: token = `crypto.randomUUID()` + 32 bytes random base64; rate limit por IP (5 convites/hora) na edge function.
- **CompanySwitcher** já existe e funciona com `user_companies` — colaboradores multi-empresa ganham o seletor automaticamente.
- Para SST será criado um seletor análogo (`SSTManagerSwitcher`) caso um usuário venha a ser colaborador de várias gestoras (raro, mas suportado).
- **list-account-collaborators** edge function (admin-protegida pela conta) usa `auth.admin.listUsers` para juntar e-mails aos vínculos.
- Registro em `mem://features/multi-user-accounts` após implementação.

### Fora de escopo (futuro)

- Papéis/permissões granulares por colaborador (viewer/editor/owner).
- Logs de auditoria de convites enviados/aceitos (pode reusar `access_logs`).
- Limite máximo de colaboradores por plano.

