## Objetivo

Resolver de uma vez os problemas de primeiro acesso das empresas, resetando senhas em massa **apenas** para empresas com 1 único CNPJ vinculado ao email, e exibindo um aviso claro no login orientando o uso do CNPJ como senha temporária.

## Escopo

**Incluso:**
- Empresas (role = `company`) cujo email está vinculado a apenas 1 registro em `companies` (sem seletor de empresas).

**Excluído (NÃO mexer):**
- Gestoras SST.
- Empresas cujo email está vinculado a 2+ CNPJs (multi-empresa, com `CompanySelector`).
- Usuários que já trocaram a senha e cuja conta não esteja com problema.

## Etapas

### 1. Backend — Edge function de reset em massa

Criar nova edge function `reset-single-company-passwords` (não reaproveitar `fix-company-passwords` para evitar efeitos colaterais nas multi-empresa):

- Apenas admin pode invocar.
- Lógica:
  1. Listar todos auth users.
  2. Agrupar por email (lowercase).
  3. Para cada email que aparece em **exatamente 1** `companies.email`:
     - Validar que o usuário tem role `company` (não SST, não admin).
     - Confirmar que `user_companies` para esse user tem apenas 1 entrada (segurança extra).
     - Resetar senha para os dígitos do CNPJ da empresa (mínimo 8 dígitos).
     - Setar `must_change_password = true` no profile.
  4. Pular emails com 2+ empresas vinculadas.
- Registrar em `config.toml` (verify_jwt = false, validação manual).
- Retornar resumo: `{ resetados, pulados_multi_empresa, pulados_sst, erros }`.

### 2. Backend — Flag de "reset por atualização do sistema"

Adicionar coluna `password_reset_reason` (text nullable) em `profiles` para diferenciar:
- `'system_update'` → exibe aviso novo de "Devido a uma atualização do sistema...".
- `null` ou outros → fluxo padrão de primeiro acesso.

A edge function preenche `'system_update'` ao resetar.

### 3. Frontend — Aviso no login + tela de troca de senha

**`src/pages/Auth.tsx` / `LoginCard.tsx`:**
- Após login bem-sucedido, se `profile.must_change_password = true` E `password_reset_reason = 'system_update'`, exibir um `AlertDialog` ou toast destacado com a mensagem:
  > "Devido a uma atualização do sistema sua senha foi alterada para o número do seu CNPJ. Insira o número sem pontos e traços e defina uma nova senha."
- Em seguida redirecionar para `/change-password` (rota já existente).

**`src/pages/ChangePassword.tsx`:**
- Quando `password_reset_reason = 'system_update'`, trocar o título/descrição do card para refletir a mensagem do aviso (em vez do texto genérico de primeiro acesso).
- Ao salvar a nova senha, limpar `password_reset_reason` junto com `must_change_password = false`.

### 4. UI Admin — Botão para disparar o reset

No `MasterDashboard` (aba de empresas/SSTs), adicionar um botão "Resetar senhas de empresas single-CNPJ" com confirmação dupla, que invoca a edge function. Mostra resumo do resultado em toast.

### 5. Execução

- Após aprovar o plano e fazer deploy, disparar a função uma vez via UI admin.
- Validar com 2-3 contas single-CNPJ e 1 conta multi-CNPJ (essa NÃO pode ter sido alterada).

## Detalhes técnicos

- Critério "1 CNPJ vinculado": `count(*) = 1` em `companies WHERE lower(email) = lower(:email)` **E** `count(*) = 1` em `user_companies WHERE user_id = :id`. Ambos precisam bater.
- Senha = `cnpj.replace(/\D/g,'')`. Se < 8 dígitos, pular e logar erro.
- Não tocar em users com role `admin`, `sst`, `partner`, `affiliate`, `sales`.
- Edge function idempotente: rodar de novo não estraga quem já trocou (pula se `must_change_password = false` e `password_reset_reason IS NULL`).

## Arquivos previstos

- **Novo:** `supabase/functions/reset-single-company-passwords/index.ts`
- **Migração:** adicionar coluna `password_reset_reason` em `profiles`.
- **Edit:** `supabase/config.toml` (registro da função).
- **Edit:** `src/pages/Auth.tsx` ou `src/components/LoginCard.tsx` (aviso pós-login).
- **Edit:** `src/pages/ChangePassword.tsx` (texto contextual + limpar flag).
- **Edit:** `src/pages/MasterDashboard.tsx` (botão admin).
- **Edit:** `src/contexts/RealAuthContext.tsx` (expor `password_reset_reason` no profile, se necessário).
