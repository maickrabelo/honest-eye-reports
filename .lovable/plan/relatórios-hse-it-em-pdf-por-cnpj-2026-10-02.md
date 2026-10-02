# Relatórios HSE-IT em PDF por CNPJ

## Objetivo
Gerar e entregar, em Arquivos, o relatório PDF HSE-IT (modelo PGR, igual ao que é baixado no painel) de cada empresa. Os CNPJs pedidos são estes (o 04.393.475/0001-46 aparece duas vezes na lista e será feito uma vez só):
- 04.393.475/0001-46
- 04.393.475/0003-08
- 04.393.475/0004-99
- 04.393.475/0006-50
- 04.393.475/0007-31
- 04.393.475/0008-12

## Passos
1. Encontrar cada empresa pelo CNPJ e listar suas avaliações HSE-IT e quantas respostas cada uma tem.
2. Se uma empresa tiver mais de uma avaliação, usar a mais recente que tenha respostas.
3. Gerar o PDF de cada empresa com o mesmo cálculo e o mesmo layout do relatório PGR HSE-IT do painel: médias por dimensão, semáforo, setores incluindo os que não têm respostas, e plano de ação.
4. Conferir cada PDF visualmente (médias diferentes de zero, setores corretos, nada cortado).
5. Entregar os 6 PDFs, nomeados `HSEIT_<CNPJ>_<empresa>.pdf`, e também um ZIP com todos.
6. Avisar quais CNPJs não têm avaliação ou respostas, se houver.

## Detalhes técnicos
- Consultas somente de leitura em `companies`, `hseit_assessments`, `hseit_responses`, `hseit_answers` e `hseit_departments`.
- O PDF é gerado com a mesma lógica de `HSEITPGRReportPDF.tsx`, rodada com Playwright no app local (com sessão de admin) ou num script que reproduz o mesmo cálculo.
- Nenhuma alteração no código do app.
