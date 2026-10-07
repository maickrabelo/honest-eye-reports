# Parecer técnico — laudos HSE-IT CULTSP (base: PDFs gerados pela plataforma)

Analisei os 8 PDFs enviados. Todos foram gerados pela plataforma (gerador jsPDF do SOIA): 7 de 13/08/2026 e 1 da CULTSP PRO de 20/07/2026. Os dois arquivos da Institucional – Sede são idênticos. Não há PDF do Museu das Amazônias.

## Principal conclusão

Os números questionados pelo cliente **não são os destes PDFs de 13/08**. Eles batem com versões **antigas**, geradas em julho, quando havia um erro na plataforma, já corrigido. Exemplo: a CULTSP PRO de 20/07 mostra Performance com Relacionamentos 1,00; Atendimento com 5,00 em Apoio da Chefia, Suporte dos Pares e Mudanças; e "Operações ou TI" com 0,00 em tudo.

**O erro:** a busca de respostas trazia no máximo 1.000 linhas. Uma unidade com 84 pessoas tem 84 × 35 = 2.940 notas, então parte das notas não era carregada. Grupos ficavam com poucas notas, o que gerava 5,00 e 1,00, ou com nenhuma, o que gerava 0,00. O erro foi corrigido em seguida, e os PDFs de 13/08 já saíram com todas as notas.

**Consequência:** os laudos que o cliente recebeu misturam números de versões antigas, com notas faltando, e de versões novas. Os valores válidos são os dos PDFs de 13/08.

## Respostas ponto a ponto

**1. Mais respondentes do que pessoas na área**
- a) O próprio respondente escolhe a área. O questionário estava no modo de várias áreas, então uma pessoa podia marcar mais de uma e era contada em cada área marcada. A plataforma não usou a lista de colaboradores do cliente.
- b) Sim, é possível marcar a área errada ou áreas a mais. Essas notas entram na média de cada área marcada. Nos PDFs de 13/08, os números conferem com os do cliente, por exemplo CULTSP Diretoria ou Comunicação com 11 e Escola de Ciências com 7. O excedente vem de pessoas que marcaram várias áreas.

**2. Soma dos grupos diferente do total** (números confirmados nos PDFs de 13/08)

| Unidade | Soma dos grupos | Total (pessoas) | Marcações extras |
|---|---|---|---|
| Institucional – Sede | 82 | 80 | 2 |
| Museu do Jardim Botânico | 32 | 29 | 3 |
| Museu do Amanhã | 135 | 125 | 10 |
| CULTSP PRO | 97 | 84 | 13 |
| Museu das Favelas | 45 | 38 | 7 |
| Paço do Frevo | 27 | 27 | 0 |

O total da unidade é o número correto de pessoas. O número de cada grupo conta marcações. A CULTSP de 20/07 somava 84 porque a versão antiga considerava só a primeira área marcada.

**3. Médias da unidade x médias dos grupos**
- a) A média da unidade junta todas as notas da unidade, com cada pessoa contada uma vez e as perguntas negativas já invertidas. A base são as 80, 29, 125, 84, 38 e 27 respostas.
- Recalculei a partir dos próprios PDFs de 13/08, ponderando pelo número de respondentes de cada grupo. Os valores ficam próximos, mas não iguais, porque quem marcou várias áreas entra mais de uma vez:
  - Museu do Amanhã: Relacionamentos 3,97 (recálculo 3,95); Papel 4,24 (4,22); Apoio da Chefia 3,91 (3,88). Paço do Frevo bate exatamente, porque ali ninguém marcou mais de uma área.
  - A maior diferença é no Museu das Favelas: Apoio da Chefia 3,28 x 3,10. É a unidade com mais marcações extras em proporção.
- Os valores que o cliente cita (Relacionamentos 3,98, Papel 4,14 e a Escola de Ciências com Mudanças 1,28) **não aparecem nos PDFs de 13/08**. No PDF de 13/08, a Escola de Ciências tem Mudanças 3,43 e Relacionamentos 4,54. Esses valores vêm de uma versão antiga.
- b) Os valores corretos são os da unidade nos PDFs de 13/08. As médias dos grupos de 13/08 também são válidas, com a ressalva das marcações múltiplas.
- c) O consolidado IDG não é gerado pela plataforma. Precisa ser refeito a partir dos PDFs de 13/08.

**4. Grupos Intoleráveis**
Os 4 grupos citados existem só nas versões antigas, com notas faltando. A CULTSP Performance de 20/07 tinha os 7 temas Intoleráveis. No PDF de 13/08, o mesmo grupo tem notas entre 2,94 e 4,03, sem nenhum Intolerável. Nos PDFs de 13/08, os temas abaixo de 2,33 aparecem só em Museu das Favelas, "Operações ou TI", Mudanças = 2,33, que fica no limite. O consolidado deve ser refeito com os PDFs de 13/08 antes de discutir intervenção emergencial.

**5. Notas extremas**
- Os 5,00 e 1,00 listados vêm das versões antigas. Nos PDFs de 13/08, os mesmos grupos têm, por exemplo: CULTSP Atendimento entre 3,23 e 4,31; Museu do Amanhã Exposições com Apoio da Chefia 4,56 e Pares 4,78; Inovação e LAA com Relacionamentos 3,44.
- b) Confirmado: as perguntas negativas são invertidas (nota = 6 − resposta), de modo que 5 é sempre o melhor.
- a) A distribuição de 1 a 5 só pode ser feita com os dados brutos, que foram excluídos depois.

**6. Datas**
- Todos os PDFs informam "Data da avaliação: 16/06/2026", que é a data de abertura do questionário e está dentro do cronograma de 15/06 a 26/06.
- As datas citadas pelo cliente (13/07, 14/07, 15/07, 20/07, 22/07) são **datas em que os relatórios foram gerados**, não de coleta. O próprio nome do arquivo usa a data de geração, como em "CULTSP_PRO_2026-07-20".
- O laudo de 13/08 informa "Data de Elaboração: 13/08/2026" separada da data da avaliação.

**7. Critério de classificação**
- Os PDFs de 13/08 ainda usam a versão anterior do gerador. A tabela 4.3 traz a régua 4,21 / 3,41 / 2,61 / 1,81, com símbolos ilegíveis. A legenda do semáforo (4.4) estava invertida. Já as colunas Nível (Tolerável / Moderado / Intolerável) usam os cortes 3,67 e 2,33, o que confirma a dedução do cliente.
- Essas falhas foram corrigidas em 06/09. O gerador atual usa uma régua única: Muito Baixo a partir de 4,21; Baixo de 3,67 a 4,20; Moderado de 3,00 a 3,66; Alto de 2,33 a 2,99; Muito Alto abaixo de 2,33. Severidade e probabilidade acompanham o mesmo nível, e a tolerabilidade vem descrita na metodologia.
- A régua de unidade "Favorável a partir de 4,0 / Intermediário 3,0–3,9 / Crítico abaixo de 3,0" não existe na plataforma. Foi criada no laudo externo.

**8 e 9. Trechos faltando e erros de texto**
- Os PDFs da plataforma não têm a seção "5. Análise dos fatores psicossociais" nem os itens 6.1, 6.6, 6.8, 6.10 ou 9.2. Esses textos foram escritos fora da plataforma pela responsável técnica e precisam ser corrigidos por ela.
- Nos PDFs de 13/08, o número de setores no método bate com os grupos avaliados: Museu do Amanhã 17, Jardim Botânico 5, Paço do Frevo 4, Museu das Favelas 6. Os números 19, 6, 8 e 9 citados vêm do texto externo ou do cadastro antigo.
- As contagens corretas por grupo são as dos PDFs de 13/08. Exemplos: CULTSP Gestão ou RH 7; Jardim Botânico Curadoria 6 e Comunicação 5; Institucional Orçamento e Custos 6; Favelas Desenvolvimento Institucional 4 e Operações ou TI 3.

## Recomendação ao cliente
1. Descartar todos os laudos de julho.
2. Usar os PDFs de 13/08 como base oficial e refazer o consolidado e as análises escritas a partir deles.
3. Se quiserem, emitir novos PDFs com o gerador atual, que tem a régua e o semáforo corrigidos. Isso não é possível agora, porque os dados foram excluídos. Só seria possível com uma restauração de backup.

## Ajustes propostos na plataforma (opcional)
1. Exibir, por setor, "respondentes únicos" e "marcações", com uma nota quando houver pessoas com várias áreas marcadas.
2. Permitir cadastrar o número de pessoas por setor, com alerta quando houver mais respostas do que pessoas.
3. Aviso no formulário ("marque apenas a área onde você atua") e modo de uma única área como padrão.
4. Imprimir o período real de coleta (primeira e última resposta) separado da data de emissão.
5. Seção automática "Grupos em nível Intolerável" no resumo.
6. Corrigir a seção de recomendações por setor, que hoje considera só a primeira área marcada.

## Detalhes técnicos
- Comparação feita extraindo o texto dos 8 PDFs e recalculando as médias ponderadas por setor.
- Erro de 1.000 linhas por consulta já corrigido com paginação nas consultas de respostas. A régua e o semáforo foram corrigidos em `HSEITPGRReportPDF.tsx`.
- Os ajustes 1 a 6 envolveriam `HSEITForm.tsx`, `HSEITManagement.tsx`, `HSEITPGRReportPDF.tsx` e uma coluna de número de pessoas em `hseit_departments`.
