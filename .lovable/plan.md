

## Plano: Suporte a Múltiplas Empresas por Email

### Problema Atual
Hoje, `profiles.company_id` é um campo único — cada usuário só pode estar vinculado a uma empresa. Isso impede que o mesmo email acesse múltiplos CNPJs.

### Arquitetura Proposta

```text
┌──────────────┐       ┌──────────────────┐       ┌──────────────┐
│  auth.users  │──1:1──│    profiles       │       │  companies   │
│  (email)     │       │  (full_name, etc) │       │  (name,cnpj) │
└──────────────┘       └──────────────────┘       └──────────────┘
        │                                                 │
        └──────────── N:M ────────────────────────────────┘
                  user_companies
              (user_id, company_id)
```

### Etapas de Implementação

#### 1. Banco de Dados
- Criar tabela **`user_companies`** (`user_id uuid`, `company_id uuid`, `is_default boolean`, `created_at`) com unique constraint em `(user_id, company_id)`
- Migrar dados existentes: `INSERT INTO user_companies SELECT id, company_id, true FROM profiles WHERE company_id IS NOT NULL`
- RLS: usuários podem ver suas próprias associações; admins/SST podem gerenciar
- Manter `profiles.company_id` temporariamente para compatibilidade, mas ele passa a representar a **empresa ativa** (selecionada)

#### 2. Contexto de Autenticação (`RealAuthContext.tsx`)
- Adicionar ao contexto: `companies: {id, name, cnpj}[]`, `activeCompanyId: string | null`, `switchCompany(companyId): void`
- No login, buscar todas as empresas do usuário via `user_companies` join `companies`
- Se houver mais de uma empresa, mostrar tela de seleção antes de redirecionar
- `switchCompany` atualiza `profiles.company_id` com a empresa escolhida e faz refresh do estado

#### 3. Tela de Seleção de Empresa (nova: `CompanySelector.tsx`)
- Modal/página que aparece após login quando o usuário tem 2+ empresas
- Lista de cards com nome e CNPJ de cada empresa
- Ao selecionar, atualiza `profiles.company_id` e redireciona ao dashboard

#### 4. Menu de Troca de Empresa (`Navbar.tsx`)
- Para usuários com 2+ empresas, adicionar dropdown no Navbar mostrando empresa ativa e opções de troca
- Ao trocar, chama `switchCompany` que atualiza o banco e recarrega dados

#### 5. Cadastro de Empresa (`AddCompanyDialog.tsx` / `create-company-user`)
- Na edge function `create-company-user`: se o email já existe, ao invés de rejeitar, adicionar entrada em `user_companies` e atualizar `profiles.company_id`
- No `AddCompanyDialog`: tratar resposta 409 mostrando mensagem "Este email já tem acesso a [Empresa X]. Deseja adicionar mais uma empresa?"
- Na edge function `create-user-with-password`: lógica similar para admins

#### 6. Atualização dos Componentes Existentes
- Todos os 10+ arquivos que usam `profile.company_id` continuam funcionando pois o campo ainda existe — ele agora representa a empresa **ativa**
- Nenhuma mudança necessária nos componentes de dashboard, pois eles já lêem `profile.company_id`

### Resumo das Mudanças

| Arquivo/Recurso | Ação |
|---|---|
| Migration SQL | Criar `user_companies`, migrar dados, RLS |
| `RealAuthContext.tsx` | Adicionar `companies[]`, `activeCompanyId`, `switchCompany()` |
| `CompanySelector.tsx` (novo) | Tela de seleção pós-login |
| `Navbar.tsx` | Dropdown de troca de empresa |
| `create-company-user/index.ts` | Suportar email existente → add `user_companies` |
| `create-user-with-password/index.ts` | Mesma lógica para criação via admin |

