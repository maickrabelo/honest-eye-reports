# Parecer técnico — laudos HSE-IT CULTSP (04.393.475/*) e ajustes propostos

Sem os dados brutos (questionários excluídos), o parecer abaixo explica, a partir do algoritmo real da plataforma, o que cada questionamento indica. Ao final, as correções propostas para que isso não se repita.

## Parte 1 — Parecer por questionamento

**1. Grupos com mais respondentes do que pessoas**
- a) A área é escolhida pelo próprio respondente no início do questionário. A plataforma não usa a lista de colaboradores do cliente nem limita quantas respostas cada área recebe.
- Quando o questionário está configurado como "multissetor", a pessoa pode marcar mais de uma área. Nesse caso ela é contada em cada área marcada.
- O link é público e anônimo. Não há trava contra a mesma pessoa responder duas vezes.
- b) Sim, alguém pode ter marcado a área errada ou várias áreas. As respostas dela entram na média de cada área marcada. Em grupos pequenos (4 a 9 pessoas), uma resposta a mais muda bastante a média.

**2. Soma dos grupos diferente do total**
- Explicação provável: respostas com mais de uma área marcada. O total da unidade conta cada pessoa uma vez; cada grupo conta todas as pessoas que marcaram aquela área. Diferenças como 97 x 84 (CULTSP PRO) e 135 x 125 (Museu do Amanhã) correspondem a cerca de 13 e 10 marcações extras.
- Paço do Frevo (27/27) indica que ali ninguém marcou mais de uma área.
- O total da unidade (80, 29, 15, 125, 84, 38, 27) é o número correto de pessoas que responderam. Os números por grupo são "marcações", não pessoas.

**3. Médias da unidade que não batem**
- A média da unidade é calculada juntando todas as respostas válidas da unidade, cada pessoa uma vez, e tirando a média por tema (escala de 1 a 5, já com inversão).
- As médias dos grupos contam várias vezes as pessoas que marcaram várias áreas. Por isso nenhuma ponderação a partir dos grupos (por respondentes, por pessoas na área ou sem peso) chega ao valor da unidade.
- No Museu do Amanhã, as pessoas com várias áreas marcadas tendem a ter notas mais baixas. Elas pesam uma vez na unidade, mas quando aparecem em grupos com notas baixas também puxam a média para baixo. Isso é compatível com a unidade ficar em 3,98 mesmo com 14 dos 17 grupos acima de 4,0.
- b) Pelo algoritmo, o valor da unidade é o mais correto, porque conta cada pessoa uma vez. Já as médias dos grupos estão infladas pelas respostas duplicadas.
- c) O consolidado IDG não é gerado pela plataforma. Foi feito fora dela e precisa ser revisado por quem o elaborou.

**4. Consolidado sem os 4 grupos Intoleráveis**
- O consolidado é um documento externo à plataforma. Pela régua do sistema, notas abaixo de 2,33 são "Intolerável — intervenção imediata". Por isso os 4 grupos citados precisam constar no consolidado.
- A frase sobre o "padrão consistente" é texto interpretativo e não vale para a CULTSP PRO.

**5. Notas extremas e inversão**
- b) Confirmado: as perguntas negativas, como as de Demandas e Relacionamentos, são invertidas (nota final = 6 − resposta). Assim, 5 é sempre o melhor resultado. Na versão 3.0 do formulário, as questões 16 e 21 foram reescritas de forma positiva e por isso não são invertidas.
- Notas 5,00 ou 1,00 aparecem quando todas as respostas de um grupo pequeno são iguais. Com 1 a 3 respondentes, isso é comum. Também pode acontecer com uma resposta contada em várias áreas.
- Pelo algoritmo, Relacionamentos = 1,00 significa que todos responderam "sempre" às perguntas negativas, ou seja, assédio e conflitos frequentes. Vale confirmar se o grupo entendeu a escala.
- a) A distribuição de 1 a 5 só pode ser refeita com os dados, que foram excluídos.

**6. Datas**
- O sistema não imprime um "período de coleta". Cada resposta registra o horário em que foi concluída. As datas de um único dia que aparecem nos laudos foram preenchidas manualmente na edição do laudo ou correspondem à data em que o laudo foi gerado.
- Não é possível reconstruir o período real sem os dados. Isso só seria possível com uma restauração de backup.

**7. Critério de classificação**
A régua da plataforma é única:
- Muito Baixo: a partir de 4,21
- Baixo: de 3,67 a 4,20
- Moderado: de 3,00 a 3,66
- Alto: de 2,33 a 2,99
- Muito Alto: abaixo de 2,33

Severidade e probabilidade acompanham o mesmo nível. Tolerabilidade: Tolerável a partir de 3,67; Moderado de 2,33 a 3,66; Intolerável abaixo de 2,33. Isso confirma o que o cliente deduziu (3,67 e cerca de 2,33).

A régua de unidade "Favorável a partir de 4,0 / Intermediário de 3,0 a 3,9 / Crítico abaixo de 3,0" não é da plataforma. Ela foi introduzida no texto do laudo e gera a contradição apontada (3,80 aparece como Tolerável no grupo e Intermediário na unidade).

**8 e 9. Trechos faltando e erros de texto**
São problemas de redação: seções narrativas, contagens citadas no texto e cabeçalhos editados à mão ou gerados fora da plataforma. Exemplos: o cabeçalho "Institucional – Sede — Museu das Amazônias" e o método falando em 19 setores quando o laudo avalia 17. No método, o número de setores reflete os setores cadastrados, inclusive os que não tiveram resposta. Já as seções detalhadas só mostram setores com respostas. Isso explica "8 setores no método x 4 avaliados" e casos parecidos.

**Conclusão:** as inconsistências de 1 a 3 têm uma causa só: a escolha livre de mais de uma área e a falta de controle de duplicidade. Os itens 4 e de 6 a 9 vêm da edição externa dos laudos. O cálculo e a inversão das perguntas estão corretos.

## Parte 2 — Correções propostas na plataforma

1. Exibir no laudo, por setor, "respondentes únicos" e "marcações". Incluir uma nota explicando quando houver pessoas com várias áreas marcadas.
2. Opção para a gestora definir o número de colaboradores por setor e um alerta quando as respostas passarem desse número.
3. Aviso no questionário multissetor ("marque apenas a área onde você atua") e opção de desativar a escolha de várias áreas por padrão.
4. Imprimir automaticamente o período real de coleta (primeira e última resposta) e a data de emissão, separadas.
5. Seção automática "Grupos em nível Intolerável" no resumo do laudo.
6. Método passa a citar "X setores cadastrados, Y com respostas".
7. Corrigir a inconsistência interna: hoje a seção de recomendações por setor considera só a primeira área marcada, enquanto as tabelas consideram todas.

## Detalhes técnicos
- Escolha de setor: `HSEITForm.tsx` grava `department` (primeira área) e `departments[]` (todas).
- Média da unidade: `calculateCategoryAverage` sobre todas as respostas concluídas. Inversão via `normalizeScore` (6 − valor) e `getIsInverted` (substituições da versão 3.0 nas questões 16 e 21).
- Tabelas por setor no PDF filtram por `departments.includes(dept)`. As recomendações (cerca da linha 913) filtram só por `department`, por isso o item 7.
- Régua: `getPGRLevel` / `getTolerance` em `HSEITPGRReportPDF.tsx`.
