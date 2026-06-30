# Nova variante HSE-IT: "Positiva 2.0"

Hoje o HSE-IT tem 2 redações (Padrão e Positiva) controladas por um Switch. Vou adicionar uma 3ª variante chamada **Positiva 2.0**, com a redação exata da tabela anexada (mistura de "positiva", "original traduzida" e versões próprias alinhadas ao inglês), e trocar o Switch por um **dropdown de seleção**.

## Mudanças

### 1. `src/data/hseitQuestions.ts`
- `HSEITWordingVariant`: passa a aceitar `'standard' | 'positive' | 'positive_v2'`.
- Adicionar campo `textPositiveV2: string` em cada uma das 35 questões, mapeando 1:1 com a tabela enviada (ex.: Q1 "Tenho clareza sobre o que é esperado de mim no trabalho.", Q6 "Tenho prazos inatingíveis.", Q9 "A dinâmica das minhas atividades exige um ritmo de trabalho muito intenso.", Q12 "Preciso deixar algumas tarefas de lado porque tenho trabalho em excesso.", Q16 "Consigo realizar as pausas necessárias durante o expediente de trabalho." (invertida — vira positiva, ver nota abaixo), etc.).
- `getQuestionText(q, variant)`: retorna `textPositiveV2` quando `variant === 'positive_v2'`, com fallback para `textPositive` / `text`.

**Nota importante sobre polaridade:** algumas frases da tabela invertem o sentido (ex.: Q16 "Consigo realizar as pausas..." é positiva, mas a questão é `isInverted: true`). Como combinado no padrão atual, **a variante só altera wording, não recalcula score**. Vou sinalizar isso no tooltip da UI para o gestor decidir conscientemente. Caso prefira inverter automaticamente a polaridade dessas questões na Positiva 2.0, me avise e ajusto.

### 2. `src/pages/HSEITManagement.tsx`
- Estado: `wordingVariant` aceita `'standard' | 'positive' | 'positive_v2'`.
- Substituir o bloco do Switch "Avaliação Positiva" por um **Select** com 3 opções:
  - **Padrão HSE-IT** — tradução fiel do instrumento original.
  - **Positiva** — redação acolhedora (atual).
  - **Positiva 2.0** — redação revisada conforme curadoria (mistura positiva + original traduzida + ajustes próprios alinhados ao inglês).
- Persiste em `hseit_assessments.wording_variant` (coluna text já existe, aceita o novo valor sem migration).

### 3. Renderização do formulário
- Onde a questão é exibida (HSEITForm e SoniaFormChat para HSE-IT), já usam `getQuestionText(q, assessment.wording_variant)` — nenhuma mudança necessária, basta a função suportar a nova variante.

## Fora de escopo
- Não alteramos cálculo de risco, categorias, nem o banco (a coluna `wording_variant` é text livre).
- Não mexemos em COPSOQ, Burnout ou Clima.

## Detalhes técnicos
- Sem migration: `wording_variant` já é `text`.
- Tipagem: ampliar união do tipo em `hseitQuestions.ts` e cast no `setWordingVariant` do Management.
- A leitura de assessments existentes continua compatível (valores `standard`/`positive` permanecem).
