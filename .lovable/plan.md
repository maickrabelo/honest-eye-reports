

# Cadastro de Empresas pelo SST (Limite de 50)

## Objetivo
Permitir que gestores SST cadastrem empresas diretamente pelo seu dashboard, com limite de 50 empresas, sem depender do administrador.

## O que muda para o usuario SST
- Um contador visivel no topo do dashboard mostrando "X/50 empresas cadastradas"
- Um botao "Nova Empresa" para abrir o formulario de cadastro
- Ao cadastrar, a empresa aparece automaticamente como card no dashboard
- A empresa ja fica vinculada automaticamente ao SST que a criou

## Etapas Tecnicas

### 1. Alteracoes no Banco de Dados

**Tabela `sst_managers`** - Adicionar coluna para controle do limite:
- `max_companies` (integer, default 50) - permite personalizar o limite por SST no futuro

**Politicas de Seguranca (RLS) na tabela `companies`:**
- Adicionar politica de INSERT para usuarios SST, permitindo criar empresas
- Adicionar politica de UPDATE para usuarios SST, restrita as empresas atribuidas a eles
- Adicionar politica de SELECT para usuarios SST, restrita as empresas atribuidas

**Politicas de Seguranca (RLS) na tabela `company_sst_assignments`:**
- Adicionar politica de INSERT para usuarios SST, restrita ao proprio `sst_manager_id`

**Trigger de validacao** no banco para impedir que o limite de 50 (ou o valor configurado em `max_companies`) seja ultrapassado, garantindo seguranca mesmo que o frontend falhe.

### 2. Alteracoes no Frontend (SSTDashboard.tsx)

- Adicionar estado para controle do formulario de nova empresa (`isAddCompanyOpen`)
- Buscar o `max_companies` do `sst_managers` para exibir o limite correto
- Exibir barra/contador de empresas: **"X / 50 empresas cadastradas"** com barra de progresso
- Botao "Nova Empresa" (desabilitado quando atingir o limite)
- Dialog/modal com formulario de cadastro contendo:
  - Nome da empresa (obrigatorio)
  - CNPJ
  - Email
  - Telefone
  - Endereco
  - Upload de logo
- Ao salvar:
  1. Gerar slug automaticamente a partir do nome
  2. Inserir na tabela `companies`
  3. Criar automaticamente o registro em `company_sst_assignments`
  4. Atualizar a lista de cards no dashboard

### 3. Fluxo de Seguranca

```text
SST clica "Nova Empresa"
        |
        v
Frontend verifica count < max_companies
        |
        v
Envia INSERT para tabela companies
        |
        v
RLS verifica: usuario tem role 'sst'?
        |
        v
Trigger verifica: count < max_companies?
        |
        v
Empresa criada -> INSERT em company_sst_assignments
        |
        v
Card aparece no dashboard
```

### 4. Arquivos Modificados

| Arquivo | Alteracao |
|---------|----------|
| Nova migracao SQL | Coluna `max_companies`, politicas RLS, trigger de limite |
| `src/pages/SSTDashboard.tsx` | Formulario, contador, logica de cadastro |

### 5. Validacoes

- Nome da empresa obrigatorio
- Slug unico (gerado automaticamente)
- Limite de 50 empresas (validado no frontend E no banco)
- Logo opcional com upload para storage existente
- CNPJ, email, telefone opcionais

