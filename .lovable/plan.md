
## Objetivo
Permitir que cada risco no Inventário de Riscos do PGR utilize uma matriz de severidade × probabilidade independente (3×3, 4×4 ou 5×5), com classificação de nível de risco apropriada à matriz escolhida e exportação no PDF respeitando cada matriz utilizada (conforme NR-1 / ABNT NBR ISO 31000, que admitem matrizes de diferentes ordens desde que documentadas).

## Mudanças no banco (`pgr_risks`)

1. Adicionar coluna `matrix_size SMALLINT NOT NULL DEFAULT 5` com `CHECK (matrix_size IN (3,4,5))`.
2. Substituir a coluna gerada `risk_level` por uma calculada via trigger `BEFORE INSERT/UPDATE`, pois a classificação passa a depender da matriz:

| Matriz | Trivial | Tolerável | Moderado | Substancial | Intolerável |
|--------|---------|-----------|----------|-------------|-------------|
| 3×3 (máx 9) | 1 | 2 | 3–4 | 6 | 9 |
| 4×4 (máx 16) | 1–2 | 3–4 | 5–8 | 9–12 | 15–16 |
| 5×5 (máx 25) | 1–3 | 4–7 | 8–14 | 15–19 | 20–25 |

Os 5 níveis (`trivial`, `tolerable`, `moderate`, `substantial`, `intolerable`) e suas cores ficam preservados.

## Frontend — `src/components/pgr/RiskInventory.tsx`

- Adicionar campo "Matriz de risco" no formulário (select 3×3 / 4×4 / 5×5), default 5×5.
- Os selects de Severidade e Probabilidade passam a ter o range dinâmico (1..N) conforme a matriz escolhida; ao trocar a matriz, valores acima de N são truncados.
- A grade visual única "Matriz 5×5" passa a renderizar **uma matriz por tamanho efetivamente usado** (3×3, 4×4, 5×5), com contagem de riscos por célula daquela matriz. Matrizes sem riscos ficam ocultas (mantendo a 5×5 visível por padrão se não houver nenhum risco).
- Tabela do inventário ganha coluna "Matriz" (badge "3×3"/"4×4"/"5×5") logo antes de S/P.

## Frontend — `src/components/pgr/PGRReportPDF.ts`

- Tabela do inventário por GHE: alterar a coluna "Risco" para exibir `S{n}×P{n} (matriz N×N) — NÍVEL`.
- Na seção "Matriz de Risco", renderizar uma matriz visual para cada tamanho utilizado no documento, cada uma com sua legenda de faixas, justificando o uso conforme NR-1.

## Hooks / tipos

- `src/integrations/supabase/types.ts` será regenerado após a migration (não editar manualmente).
- `src/hooks/usePGRDashboardData.ts` continua usando `risk_level` (sem alteração funcional, apenas inclui `matrix_size` no select para futuras métricas).

## Compatibilidade

- Riscos existentes recebem `matrix_size = 5` (default), mantendo classificação idêntica à atual.
- Nenhum impacto em planos/permissões; ajuste 100% dentro do módulo PGR.

## Arquivos afetados

- Migration nova (add coluna + trigger + drop da coluna gerada)
- `src/components/pgr/RiskInventory.tsx`
- `src/components/pgr/PGRReportPDF.ts`
- `src/hooks/usePGRDashboardData.ts` (apenas select)
