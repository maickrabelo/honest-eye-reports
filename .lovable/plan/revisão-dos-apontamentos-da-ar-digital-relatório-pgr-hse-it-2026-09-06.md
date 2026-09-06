# Revisão dos apontamentos da AR Digital — Relatório PGR (HSE-IT)

Conferi cada ponto no gerador do relatório. Resumo: **cinco dos seis apontamentos procedem** e devem ser corrigidos; um procede apenas em parte. E encontrei um erro mais grave que eles não apontaram.

## Erro crítico encontrado além da lista deles

A legenda do "Semáforo de Impacto na Saúde" está **invertida** em relação ao cálculo real do sistema.

- O sistema classifica média **alta** como *Favorável* (verde) e média **baixa** como *Risco* (vermelho) — correto, porque a escala é normalizada para "quanto maior, melhor".
- O texto impresso na metodologia diz o contrário: "Favorável (menor que 2,33)" e "Risco (a partir de 3,67)".

Ou seja, a legenda ensina o leitor a interpretar o relatório ao inverso das cores e das medidas que aparecem nas tabelas. Correção: inverter as faixas do texto (Risco abaixo de 2,33; Intermediário de 2,33 a 3,66; Favorável a partir de 3,67).

## Ponto 1 — Nomes das dimensões variam entre seções

**Procede em parte.** A visão geral usa os nomes do instrumento HSE-IT (Demandas, Controle, Apoio da Chefia, Apoio dos Colegas, Papel/Cargo, Mudanças) e as tabelas por GHE usam nomes técnicos de agente de risco (Exigências do Trabalho, Autonomia e Controle, Suporte da Gestão, Suporte dos Pares, Clareza de Papel, Gestão de Mudanças).

Isso não é erro de extração: no inventário do PGR a coluna é "Agente de Risco", e a linguagem de agente de risco é a esperada ali. O que falta é a ponte entre as duas nomenclaturas.

Correção: nas tabelas por GHE passar a exibir o nome do instrumento seguido do agente entre parênteses — por exemplo "Demandas (Exigências do Trabalho)" — e incluir na metodologia um quadro de equivalência das 7 dimensões com seus agentes de risco.

## Ponto 2 — "Muito Baixo (≤ 4,21)" corrompido

**Procede.** O relatório usa os sinais "maior ou igual" e "menor ou igual", que a fonte padrão do PDF não possui — por isso saem embaralhados na extração de texto.

Correção: trocar por texto ("a partir de 4,21", "acima de", "abaixo de", "de 3,41 a 4,20") em toda a régua de classificação.

## Ponto 3 — Semáforo com caracteres corrompidos ("Ø=ßâ")

**Procede.** São os emojis de bolinha verde/amarela/vermelha, que a fonte do PDF também não suporta.

Correção: substituir os emojis por bolinhas coloridas desenhadas (mesmo recurso já usado na tabela de classificação de risco) e escrever "Favorável / Intermediário / Risco" em texto puro.

## Ponto 4 — Duas classificações diferentes (Moderado/Tolerável/Intolerável vs. Muito Baixo…Muito Alto)

**Procede.** Hoje a metodologia descreve uma régua de cinco níveis que **não é usada em nenhuma tabela do relatório**; as tabelas usam uma régua de três níveis com nomes de tolerabilidade. Duas réguas, sem explicação de como se relacionam.

Correção: adotar uma régua única de cinco níveis nas tabelas (Muito Baixo a Muito Alto), com uma coluna adicional de tolerabilidade NR-1 (Tolerável / Moderado / Intolerável) e uma frase na metodologia explicando que a primeira mede intensidade e a segunda define a decisão de intervenção. Assim as duas linguagens continuam presentes, mas conciliadas e derivadas do mesmo cálculo.

## Ponto 5 — "Medida Proposta" vs. "Medida" e termos diferentes

**Procede.** As colunas têm títulos diferentes e os termos das medidas divergem: visão geral usa Manter / Monitoramento / Ação imediata; as tabelas por setor usam Manter / Plano de ação / Intervenção urgente.

Correção: padronizar o título como "Medida Proposta" em todas as tabelas e usar um único conjunto de termos — Manter e monitorar / Plano de ação / Intervenção imediata.

## Ponto 6 — Gráficos com nomes cortados ("Apoio da Che.", "Relacionamen.")

**Procede.** Os rótulos são cortados por limite de caracteres para caber no espaço.

Correção: usar abreviações legíveis e definidas (por exemplo "Apoio Chefia", "Relacionam.", "Apoio Colegas") em vez de corte cego, quebrar rótulos longos em duas linhas no gráfico de radar, e incluir a legenda completa das dimensões abaixo dos gráficos.

## Detalhes técnicos

Arquivos afetados:

- `src/components/hseit/HSEITPGRReportPDF.tsx`
  - Faixas do semáforo (seção 4.4): inverter e remover emojis, desenhando círculos coloridos.
  - Régua 4.3: substituir `≥`/`<` por texto; adicionar coluna/observação de tolerabilidade.
  - `getRiskClassification`, `getSeverity`, `getProbability`: passar a derivar de `getRiskLevel` (5 níveis) e mapear para a tolerabilidade NR-1.
  - Tabela 5.1 e tabelas por GHE: título "Medida Proposta" e conjunto único de medidas; nome da dimensão com agente entre parênteses.
  - `drawRadarChart` e `drawHorizontalBarChart`: mapa de abreviações por dimensão em vez de `substring`, com quebra em duas linhas no radar.
  - Novo quadro de equivalência dimensão ↔ agente de risco na metodologia.
- `src/data/hseitQuestions.ts`: adicionar apenas o mapa de abreviações para gráficos (nenhuma alteração de cálculo).

Nenhum limiar de cálculo será alterado — apenas a apresentação e os textos passam a refletir o cálculo já existente.
