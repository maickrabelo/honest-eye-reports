
# Criar usuario automatico para empresa no cadastro SST

## Resumo
Quando um gestor SST cadastrar uma nova empresa pelo dashboard, o sistema vai automaticamente criar uma conta de acesso para essa empresa. A senha inicial sera o CNPJ informado no cadastro. No primeiro login, o usuario sera obrigado a criar uma nova senha antes de acessar o dashboard.

## Mudancas necessarias

### 1. Banco de dados
- Adicionar coluna `must_change_password` (boolean, default false) na tabela `profiles` para controlar se o usuario precisa trocar a senha no primeiro acesso.

### 2. Backend function - Criar empresa com usuario (nova edge function)
Criar uma nova edge function `create-company-user` que:
- Aceita chamadas de usuarios com role `sst` (alem de admin)
- Recebe os dados da empresa (nome, CNPJ, email, etc.)
- Valida que o CNPJ foi informado (obrigatorio para gerar a senha)
- Valida que o email foi informado (obrigatorio para criar o usuario)
- Usando o service role key:
  - Cria o usuario no auth com email da empresa e senha = CNPJ (somente digitos)
  - Confirma o email automaticamente
  - Cria/atualiza o profile com `company_id` e `must_change_password = true`
  - Atribui a role `company` ao usuario
- Retorna o user_id criado

### 3. Formulario de cadastro (AddCompanyDialog.tsx)
- Tornar os campos **CNPJ** e **Email** obrigatorios (atualmente sao opcionais)
- Adicionar validacao minima no CNPJ (pelo menos 11 digitos numericos)
- Apos criar a empresa e o assignment, chamar a edge function para criar o usuario da empresa
- Exibir mensagem de sucesso informando que o acesso foi criado com a senha sendo o CNPJ

### 4. Pagina de troca de senha obrigatoria (nova pagina)
- Criar `/change-password` com um formulario simples:
  - Campo "Nova senha"
  - Campo "Confirmar nova senha"
  - Botao "Salvar nova senha"
- Ao salvar, atualiza a senha via `supabase.auth.updateUser({ password })` e define `must_change_password = false` no profile
- Sem opcao de pular - o usuario so consegue acessar o sistema apos trocar a senha

### 5. Controle de redirecionamento (RealAuthContext.tsx)
- Apos o login, verificar se `must_change_password` e `true` no profile
- Se sim, redirecionar para `/change-password` ao inves do dashboard normal
- Bloquear navegacao para outras paginas enquanto a senha nao for trocada

### 6. Rota no App.tsx
- Adicionar rota `/change-password` apontando para a nova pagina

## Detalhes tecnicos

### Edge function `create-company-user`
```text
Fluxo:
1. Verificar auth token do chamador
2. Verificar se o chamador tem role 'sst' ou 'admin'
3. Extrair CNPJ somente digitos para usar como senha
4. Criar usuario via supabaseAdmin.auth.admin.createUser()
5. Atualizar profile com company_id e must_change_password = true
6. Inserir role 'company' em user_roles
7. Retornar user_id
```

### Validacao do CNPJ como senha
- O CNPJ sera limpo (somente digitos): "12.345.678/0001-90" vira "12345678000190"
- Minimo 11 caracteres numericos para funcionar como senha (supabase exige minimo 6)

### Migracao SQL
```text
ALTER TABLE profiles ADD COLUMN must_change_password boolean DEFAULT false;
```

### Protecao da rota /change-password
- A pagina verifica se o usuario esta autenticado
- Se `must_change_password` for false, redireciona para o dashboard normalmente
- Se o usuario tentar navegar para outra pagina com `must_change_password = true`, e redirecionado de volta
