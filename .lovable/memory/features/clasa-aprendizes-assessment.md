---
name: CLASA Aprendizes Assessment
description: Avaliação psicossocial NR-01 exclusiva da gestora Futuramed para jovens aprendizes (29 questões, 9 eixos, escala 1-3)
type: feature
---

## Visão Geral
Instrumento "Diagnóstico de Clima, Bem-Estar e Riscos Psicossociais (NR-01) — Aprendizagem CLASA".
Exclusivo da gestora SST **Futuramed** (`sst_managers.id = b493c525-48bf-45d2-848a-72bc0eaffb15`) e de admins.

## Estrutura
- 29 questões objetivas, escala 1 (Proteção) / 2 (Alerta) / 3 (Risco) + 1 campo aberto opcional
- 9 eixos temáticos (A-I) + eixo "Síntese e Recomendação"
- Dados iniciais: Turma/Período e Mês/Ano (gravados em `demographics`)
- Índice normalizado 0-100: `((média - 1) / 2) * 100`; risco baixo <33, moderado <66, alto >=66

## Tabelas
`clasa_assessments`, `clasa_departments`, `clasa_responses` (com `open_feedback`), `clasa_answers`.
RLS espelha o módulo Burnout: leitura pública de avaliações ativas, insert anônimo de respostas.

## Arquivos
- `src/data/clasaQuestions.ts` — questões, labels e `calculateCLASAScores`
- `src/hooks/useHasCLASAAccess.ts` — gate de acesso (admin ou vínculo Futuramed)
- `src/pages/CLASADashboard|CLASAManagement|CLASAForm|CLASAResults.tsx`
- `src/components/clasa/CLASAReportPDF.ts` — relatório PDF (jsPDF)

## Rotas
`/clasa-dashboard`, `/clasa/new`, `/clasa/:id`, `/clasa/results/:id`, `/clasa/:companySlug/:assessmentId` (público)
