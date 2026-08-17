# HSE-IT Positivo 3.0 — nova variante de redação

Adicionar a redação "Positiva 3.0" como quarta opção de wording do HSE-IT, mantendo as 35 questões e todo o cálculo/estrutura de categorias inalterados. Apenas o texto exibido muda.

## O que muda

- Nova opção **Positiva 3.0** no seletor de redação da criação/edição da avaliação HSE-IT (Padrão, Positiva, Positiva 2.0, Positiva 3.0). Não vira padrão.
- Formulário do respondente, impressão do questionário manual e relatórios passam a exibir o texto 3.0 quando a avaliação for criada nessa variante.
- Avaliações já existentes continuam com a redação escolhida originalmente.

## Textos da versão 3.0

Aplicados conforme a lista enviada, por número original:

- Cargo/Papel: 1, 4, 11, 13, 17
- Controle: 2, 10 (autonomia de ritmo), 15 (autonomia sobre a forma de executar), 19 (definir prioridades), 30 (flexibilidade)
- Demandas: 3, 6, 9, 12, 16, 18 ("As demandas do meu trabalho fazem com que eu permaneça trabalhando além do horário da minha jornada habitual?"), 22 (pressão com prazos irreais)
- Relacionamentos: 5 (brincadeiras/comentários desconfortáveis), 14 (atritos), 21 (liberdade para expressar opiniões e discordâncias)
- Apoio dos Colegas: 7, 24, 27, 31
- Apoio da Liderança: 8 (feedbacks construtivos), 23, 29 (abertura com a liderança), 33, 35
- Mudanças: 26, 28, 32

As 3 questões marcadas como "proposta de exclusão" (originais 20, 25 e 34) permanecem no instrumento; para elas a 3.0 reaproveita o texto atual da versão 2.0.

## Observação de interpretação

A questão 21 na 3.0 é redigida de forma positiva ("Sinto-me à vontade para expressar opiniões e discordâncias"), enquanto no instrumento ela é uma questão invertida (mais = pior). Para não distorcer o resultado, a 3.0 marcará a 21 como não invertida apenas nessa variante, mantendo "mais = melhor" coerente com o texto. O mesmo tratamento vale para a 16 (pausas) e a 5, seguindo o sentido do texto de cada uma. Isso mantém o cálculo por categoria correto sem alterar avaliações antigas.

## Detalhes técnicos

- `src/data/hseitQuestions.ts`: adicionar `'positive_v3'` ao tipo `HSEITWordingVariant`, campo `textPositiveV3` em cada questão, tratamento em `getQuestionText`, e um mapa de inversão por variante usado por `normalizeScore`/médias quando a variante for 3.0.
- `src/pages/HSEITManagement.tsx`: novo `SelectItem` "Positiva 3.0" e texto auxiliar correspondente.
- `src/pages/HSEITForm.tsx`: reconhecer `positive_v3` na leitura de `wording_variant`.
- `src/components/PrintQuestionnaireButton.tsx` e componentes de relatório que exibem enunciados: repassar a variante.
- Coluna `wording_variant` já é texto livre — sem migração necessária.
