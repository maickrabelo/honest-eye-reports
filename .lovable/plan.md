# Modo Multisetorial — HSE-IT e COPSOQ

Permitir que avaliações sejam configuradas como multisetoriais. Nesse modo, o respondente que atua em mais de um setor marca todos os setores em que atua, e sua resposta é contabilizada em cada um deles (tanto na pontuação quanto no denominador de participação por setor).

## 1. Banco de dados

Migration única adicionando:

- `hseit_assessments.multi_sector_enabled boolean default false`
- `copsoq_assessments.multi_sector_enabled boolean default false`
- Coluna `departments text[]` em `hseit_responses` e `copsoq_responses` (mantém `department` para compatibilidade — quando multi, ficará com o primeiro selecionado e o array conterá todos).
- Coluna `multi_sector_count integer default 0` em `hseit_departments` e `copsoq_departments` (opcional — pode ser calculado em tempo real; mantém-se como cache se necessário). *Decisão: calcular em tempo real para evitar dessincronização.*

## 2. Configuração da avaliação (criação/edição)

Em `HSEITManagement.tsx` e `COPSOQManagement.tsx`, no formulário de criar/editar avaliação:

- Novo checkbox **"Permitir avaliação multisetorial (colaborador atua em mais de um setor)"**.
- Abaixo do checkbox, quando marcado, um banner informativo explicando:
  > "Nesta modalidade, colaboradores que atuam em mais de um setor poderão marcar todos os setores em que atuam. A resposta será contabilizada em cada setor selecionado — tanto na pontuação quanto no total de colaboradores do setor, para que o percentual de participação fique correto."

## 3. Formulário do respondente

Em `HSEITForm.tsx` e `COPSOQForm.tsx`, no passo de seleção de setor:

- Se `multi_sector_enabled = true`:
  - Substituir o `Select` por uma lista de **checkboxes** com todos os setores disponíveis.
  - Texto: "Selecione todos os setores em que você atua".
  - Validação: pelo menos 1 selecionado.
- Se `false`: comportamento atual (single select).
- Ao submeter, gravar `departments: string[]` (e `department` = primeiro item para compatibilidade).

## 4. Resultados / Dashboards

Em `HSEITResults.tsx`, `COPSOQResults.tsx`, `HSEITDashboardContent.tsx`, `COPSOQDashboardContent.tsx` e nos componentes de exportação (`AssessmentExportButton`, PDFs):

- Ao agregar dados por setor, "expandir" cada resposta: uma resposta com `departments = ['A','B']` conta como 1 em A e 1 em B (tanto para pontuação média quanto para contagem de participantes).
- Manter contagem global de respondentes únicos (sem duplicar) usando `respondent_token` — exibir como "Total de respondentes" separado de "Soma de participações por setor".
- Adicionar um **aviso visual (callout)** no topo dos resultados quando a avaliação for multisetorial:
  > "Esta avaliação foi configurada como multisetorial. Colaboradores que atuam em mais de um setor são contabilizados em cada setor que selecionaram, para refletir corretamente o percentual de participação em cada um."

## 5. Detalhes técnicos

- Migration usa `ALTER TABLE ADD COLUMN IF NOT EXISTS`; preencher `departments` retroativo com `ARRAY[department]` quando `department IS NOT NULL` para respostas existentes.
- RLS não muda (colunas novas em tabelas existentes).
- Tipos do Supabase serão regenerados após a migration.
- Hooks de leitura (`usePGRDashboardData` se usar setores, e queries diretas nas páginas de resultados) precisam normalizar `departments ?? [department].filter(Boolean)` para a agregação por setor.
- Burnout e Clima **não** recebem essa funcionalidade nesta entrega (escopo é HSE-IT e COPSOQ, conforme pedido).

## Arquivos afetados (principais)

- `supabase/migrations/*` (nova)
- `src/pages/HSEITManagement.tsx`, `src/pages/COPSOQManagement.tsx`
- `src/pages/HSEITForm.tsx`, `src/pages/COPSOQForm.tsx`
- `src/pages/HSEITResults.tsx`, `src/pages/COPSOQResults.tsx`
- `src/components/psychosocial/HSEITDashboardContent.tsx`, `COPSOQDashboardContent.tsx`
- `src/components/assessments/AssessmentExportButton.tsx`
- PDFs (`HSEITReportPDF.tsx`, `HSEITPGRReportPDF.tsx`, e equivalente COPSOQ) — ajustar agregação por setor

Quer que eu siga com a implementação?
