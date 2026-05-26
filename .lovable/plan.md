## Objetivo

Adicionar uma nova opção de **Variante de Redação** na configuração da avaliação HSE-IT. Quando o gestor marcar **"Avaliação Positiva"**, o questionário apresentará uma redação alternativa (mais branda/positiva, sem palavras "gourmet" e sem inversão de polaridade) para as 35 perguntas — **sem alterar nenhuma lógica, categorias, inversão (`isInverted`), cálculo de scores ou classificação de risco**. Apenas o texto exibido muda.

## Mudanças

### 1. Banco de dados (migração)
- Adicionar coluna `wording_variant TEXT NOT NULL DEFAULT 'standard'` em `public.hseit_assessments` (valores aceitos: `'standard'` | `'positive'`).
- Nenhuma alteração em RLS ou grants existentes.

### 2. Textos alternativos das perguntas
Arquivo: `src/data/hseitQuestions.ts`
- Adicionar a cada item de `HSEIT_QUESTIONS` um novo campo `textPositive: string` com a redação da Coluna 2 do documento enviado.
- Mapeamento completo (número da pergunta → novo texto):

  1 → "Tenho clareza sobre o que é esperado de mim no trabalho."
  2 → "Tenho autonomia para gerenciar minhas pausas no trabalho."
  3 → "Diferentes áreas me direcionam demandas que, muitas vezes, são difíceis de conciliar entre si."
  4 → "Sinto-me capacitado e seguro para executar minhas tarefas diárias."
  5 → "Observo comentários ou comportamentos inapropriados direcionados a mim no trabalho."
  6 → "Os prazos estipulados para as minhas entregas são incompatíveis com o tempo necessário para execução."
  7 → "Recebo ajuda e o suporte necessário dos meus colegas quando preciso."
  8 → "Posso contar com a minha liderança para me apoiar na resolução de problemas no trabalho."
  9 → "A dinâmica das minhas atividades exige um ritmo de trabalho intenso."
  10 → "Eu tenho autonomia para definir o meu próprio ritmo de trabalho."
  11 → "Compreendo quais são as minhas responsabilidades e meu escopo de atuação."
  12 → "O volume de demandas pendentes faz com que algumas tarefas fiquem em segundo plano."
  13 → "Tenho clareza sobre as metas e os objetivos estabelecidos para a minha área."
  14 → "Há momentos de atrito entre colegas no meu ambiente de trabalho."
  15 → "Tenho autonomia para escolher a melhor forma para realizar o meu trabalho."
  16 → "Consigo realizar as pausas necessárias durante o expediente de trabalho."
  17 → "Compreendo claramente como o meu trabalho contribui para os objetivos da empresa."
  18 → "Sou pressionado a trabalhar por longas horas para além da minha jornada habitual de trabalho."
  19 → "Tenho liberdade para decidir o que fazer no meu trabalho."
  20 → "Tenho um ritmo de trabalho muito acelerado."
  21 → "Vivencio situações que me fazem sentir intimidado no trabalho."
  22 → "Sofro pressão com prazos irreais."
  23 → "Meus colegas mostram-se disponíveis para me ouvir e me ajudar com desafios profissionais."
  24 → "Recebo feedbacks construtivos que apoiam o desenvolvimento no trabalho." *(apoio dos colegas — mantém a categoria atual)*
  25 → "Tenho autonomia para decidir a forma como realizo o meu trabalho."
  26 → "Tenho oportunidades para questionar a minha liderança sobre as mudanças que ocorrem no trabalho."
  27 → "Sou tratado com respeito pelos meus colegas de trabalho."
  28 → "Os colaboradores são sempre consultados sobre mudanças que ocorrem no trabalho."
  29 → "Sinto-me confortável para compartilhar minhas preocupações ou incômodos com a minha liderança."
  30 → "O meu horário de trabalho pode ser flexível."
  31 → "Sou tratado com respeito pelos meus colegas." *(reforço do item 27, ajustado conforme documento)*
  32 → "Quando ocorrem mudanças no trabalho, eu tenho a clareza de como elas vão impactar na prática."
  33 → "Sou acolhido quando preciso lidar com demandas emocionalmente desgastantes."
  34 → "As relações no trabalho são tensas."
  35 → "Sinto-me encorajado e motivado pela minha liderança."

- Adicionar helper `getQuestionText(q, variant)` que retorna `q.textPositive` quando `variant === 'positive'` e cair em `q.text` em qualquer outro caso.
- **Nenhuma alteração** em `isInverted`, categorias, escala Likert, `normalizeScore`, `calculateCategoryAverage`, `getRiskLevel`, `getHealthImpact`.

### 3. Configuração na tela de gestão
Arquivo: `src/pages/HSEITManagement.tsx`
- Adicionar estado `wordingVariant` carregado do registro e salvo no insert/update.
- Adicionar bloco visual na seção de configurações com um `RadioGroup` (ou `Switch`) com duas opções:
  - **Padrão (original HSE-IT)** — recomendado para validade científica plena.
  - **Avaliação Positiva** — redação mais acolhedora, sem alterar a matriz de cálculo.
- Texto auxiliar curto explicando que a alteração é apenas de redação e não impacta cálculo de risco.

### 4. Renderização das perguntas
- `src/pages/HSEITForm.tsx`: carregar `wording_variant` do assessment ao iniciar e usar `getQuestionText(question, variant)` no lugar de `question.text` (linha 49 e qualquer outra que renderize o texto).
- `src/components/sonia/SoniaFormChat.tsx`: quando o contexto for HSE-IT, aplicar a mesma troca via `getQuestionText`.

### 5. Itens **não** alterados
- Resultados, exports, PDFs (`HSEITResults.tsx`, `HSEITReportPDF.tsx`, `HSEITPGRReportPDF.tsx`, `HSEITActionPlanEditor.tsx`, `CategoryRiskIndicators.tsx`, `assessmentExport.ts`, `RelatorioDemo.tsx`) continuam usando `question.text` original — porque relatórios precisam manter a referência científica do instrumento.

## Detalhes técnicos

- A coluna `wording_variant` é `TEXT` (não enum) para evitar migração futura caso surjam novas variantes.
- A propriedade `textPositive` é obrigatória nas 35 questões (TypeScript valida em build).
- Como os cálculos não mudam, `getRiskLevel`/`getHealthImpact` continuam idênticos — apenas o respondente vê a redação alternativa.

## Resumo curto
Toggle "Avaliação Positiva" na config do HSE-IT que troca somente os textos das 35 perguntas (sem mudar inversão, categorias nem cálculo).
