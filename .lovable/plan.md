## Problema

A gestora **NR** tem 189 empresas atribuídas. Ao abrir "Nova Avaliação HSE-IT", a tela faz:

1. `SELECT company_id FROM company_sst_assignments WHERE sst_manager_id = ...` (189 UUIDs)
2. `SELECT id,name,slug FROM companies WHERE id IN (<189 UUIDs>)`

O passo 2 monta uma URL PostgREST com ~7,5 KB, ultrapassando o limite prático de query string, e retorna lista truncada — por isso **MIRANDA, ANANIAS CLINICOS ASSOCIADOS** (e potencialmente outras) não aparece no dropdown, embora exista em `companies` e em `company_sst_assignments`.

## Solução

Trocar o padrão de duas queries por **uma única query com JOIN via foreign key embedding** do PostgREST:

```ts
const { data } = await supabase
  .from('company_sst_assignments')
  .select('company:companies!inner(id, name, slug)')
  .eq('sst_manager_id', sstManagerId)
  .order('name', { foreignTable: 'companies', ascending: true });

companiesData = (data ?? []).map(r => r.company).filter(Boolean);
```

Isso elimina o `IN (...)` enorme e garante que todas as empresas (incluindo as recém-cadastradas) sejam listadas.

## Arquivos a alterar

Aplicar o mesmo refactor (apenas no branch `role === 'sst'` que carrega via `company_sst_assignments`):

- `src/pages/HSEITManagement.tsx` (linhas 92–115)
- `src/pages/COPSOQManagement.tsx` (mesmo padrão)
- `src/pages/BurnoutManagement.tsx` (mesmo padrão)
- `src/pages/ClimateSurveyManagement.tsx` (mesmo padrão)

Os dashboards (HSEITDashboard, BurnoutDashboard, ClimateSurveyDashboard) e SSTDashboard usam o mesmo padrão e devem ser revistos no mesmo passo se também listarem empresas em dropdown — confirmar e aplicar se necessário.

## Validação

1. Logar como NR e abrir "Nova Avaliação HSE-IT" → MIRANDA, ANANIAS deve aparecer.
2. Confirmar contagem do dropdown == 189 empresas.
3. Repetir nas telas COPSOQ / Burnout / Clima.

## Escopo

- Não altera RLS, schema, edge functions ou lógica de negócio.
- Mudança puramente de leitura no frontend.
