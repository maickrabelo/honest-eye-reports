---
name: Pulse Survey Module
description: Avaliações curtas e periódicas (semanal/quinzenal/mensal/trimestral/semestral), anônimas, com escala emoji ou Likert 1-5 e envio automático de email-resumo ao gestor ao final de cada ciclo
type: feature
---

## Visão Geral
Nova ferramenta para "pulso" frequente do time. Cria campanhas que rodam em ciclos automáticos; ao fechar cada ciclo, envia email-resumo ao `manager_email` e abre o próximo ciclo automaticamente.

## Tabelas
- `pulse_surveys` — campanha (company_id, title, frequency, use_emojis, status, manager_email)
- `pulse_survey_questions` — perguntas editáveis (text, category, order_index, required)
- `pulse_survey_cycles` — ciclo (cycle_number, started_at, ended_at, closed_at, total_responses, summary_email_sent_at)
- `pulse_survey_departments` — segmentação opcional
- `pulse_survey_responses` (anônima) e `pulse_survey_answers` (score 1-5)

## Funções
- `pulse_cycle_duration(frequency)` — converte frequência em interval
- `pulse_create_next_cycle(survey_id)` — cria próximo ciclo a partir do último número
- Trigger `pulse_surveys_after_insert` cria primeiro ciclo automaticamente ao criar campanha ativa

## Edge Function
- `pulse-survey-close-cycle` (verify_jwt=false) — chamada pelo pg_cron a cada hora ('0 * * * *', job `pulse-survey-close-cycle-hourly`)
- Fecha ciclos com `ended_at <= now()`, calcula médias por pergunta, envia email via Resend, marca `summary_email_sent_at`, gera próximo ciclo

## Rotas
- `/pulse-survey` — dashboard de campanhas
- `/pulse-survey/nova` — criar
- `/pulse-survey/editar/:id` — editar
- `/pulse-survey/:id` — detalhe + gráfico de evolução
- `/pulse/:surveyId` — formulário público anônimo

## Templates (src/data/pulseSurveyTemplates.ts)
- Bem-estar, Engajamento, Carga de Trabalho (editáveis)
- `EMOJI_SCALE` (😡😕😐🙂😄 = 1..5) e `LIKERT_SCALE` (Discordo→Concordo = 1..5)

## RLS
- Leitura pública apenas de campanhas com `status='active'` e respectivas perguntas/ciclos/departamentos
- Inserção anônima de respostas/respostas apenas em ciclos abertos (`closed_at IS NULL AND ended_at > now()`)
- Gestão restrita a admin / usuário da empresa / SST atribuída
