## Pulse Survey — nova ferramenta

Avaliações curtas, periódicas e anônimas (link/QR), com templates editáveis, escala Likert 1‑5 ou emojis (configurável), e envio automático de email-resumo ao gestor ao fim de cada ciclo.

### 1. Banco de dados (migração)

Novas tabelas:

- `pulse_surveys` — configuração da campanha
  - `id`, `company_id`, `created_by`, `title`, `description`
  - `frequency` (`weekly` | `biweekly` | `monthly` | `quarterly` | `semiannual`)
  - `use_emojis` (bool) — alterna entre escala emoji e Likert 1‑5
  - `status` (`active` | `paused` | `archived`)
  - `manager_email` (destino do resumo; default = email do gestor)
  - `next_cycle_start_at`, `next_cycle_end_at`
  - `created_at`, `updated_at`
- `pulse_survey_questions` — perguntas da campanha (cópia editável do template)
  - `id`, `pulse_survey_id`, `text`, `category`, `order_index`, `required`
- `pulse_survey_cycles` — cada janela periódica
  - `id`, `pulse_survey_id`, `cycle_number`, `started_at`, `ended_at`, `closed_at`
  - `total_responses`, `summary_email_sent_at`
- `pulse_survey_departments` — segmentação (espelho de `hseit_departments`)
- `pulse_survey_responses` — envio anônimo
  - `id`, `cycle_id`, `department_name`, `submitted_at`
- `pulse_survey_answers`
  - `id`, `response_id`, `question_id`, `score` (1‑5)

RLS + GRANTs no padrão do projeto:
- `INSERT` anônimo em `pulse_survey_responses`/`answers` (mesma lógica das outras avaliações públicas).
- `SELECT` em `pulse_surveys` público para a página de resposta (somente registros `active`).
- Demais tabelas: somente gestor da empresa / SST atribuída / admin / sales.

### 2. Templates de perguntas

Arquivo `src/data/pulseSurveyTemplates.ts` com 3 templates iniciais (editáveis ao criar):
- **Bem-estar** (humor, energia, estresse)
- **Engajamento** (motivação, propósito, reconhecimento)
- **Carga de trabalho** (volume, prazos, equilíbrio)

Cada template = 3‑5 perguntas curtas. Gestor pode adicionar/editar/remover antes de ativar.

### 3. Frontend

Rotas novas:
- `/pulse-survey` — dashboard (lista de campanhas + KPIs por ciclo)
- `/pulse-survey/nova` — wizard de criação (empresa → template → perguntas → frequência → emojis on/off → email destino)
- `/pulse-survey/:id` — detalhe da campanha (histórico de ciclos, médias, gráfico de evolução)
- `/pulse/:surveyId` — página pública de resposta (anônima, escolhe departamento, responde)

Componentes:
- `PulseEmojiQuestion` (😡 😕 😐 🙂 😄 mapeados para 1‑5)
- `PulseLikertQuestion` (radio 1‑5, "Discordo totalmente" → "Concordo totalmente")
- `PulseTemplatePicker`, `PulseQuestionEditor` (reutiliza padrão do `QuestionManager`)
- `PulseCycleCard`, `PulseEvolutionChart`
- Card no `SSTDashboard`/`Dashboard` da empresa para acessar a ferramenta
- Busca de empresa no wizard (padrão dos outros módulos)

Acesso controlado por `useCompanyFeatures` (novo flag `pulse_survey_enabled`, default `true`).

### 4. Backend / Edge Functions

- `pulse-survey-close-cycle` — fechamento automático
  - Roda via `pg_cron` a cada hora
  - Para cada `pulse_survey_cycles` com `ended_at < now()` e `closed_at IS NULL`:
    - Calcula médias por pergunta, média geral, nº de respostas, comparação com ciclo anterior
    - Envia email-resumo (template app-email novo `pulse-survey-summary`) ao `manager_email`
    - Cria o próximo ciclo de acordo com `frequency`
    - Marca `closed_at` e `summary_email_sent_at`

- Template de email `pulse-survey-summary` (React Email):
  - Cabeçalho com nome da campanha e período do ciclo
  - KPIs: nº de respostas, média geral, melhor/pior pergunta
  - Tabela curta com média por pergunta e delta vs ciclo anterior
  - CTA "Ver detalhes" → `/pulse-survey/:id`

Pré-requisitos de email já atendidos (Resend + infra existente). Caso o projeto ainda não tenha infra de app-email, rodar `setup_email_infra` + `scaffold_transactional_email` antes.

### 5. Integrações

- Registrar `pulse-survey-close-cycle` em `supabase/config.toml`
- Adicionar Pulse Survey nos cards do dashboard (SST e Empresa) com ícone Activity/Heart
- Memória `mem://features/pulse-survey-module` documentando o módulo
- Atualizar índice de memória

### Detalhes técnicos

- Anônimo: nenhum `user_id` em respostas; gating apenas por `pulse_survey_id` + `cycle_id` ativos.
- Score sempre normalizado 1‑5 (emoji e Likert compartilham o mesmo storage), facilitando gráficos de evolução.
- Comparação entre ciclos = `media_atual - media_anterior` por pergunta.
- Cron usa `pg_net.http_post` chamando a edge function com header `apikey` (anon), padrão do projeto.
- Reaproveita padrões existentes: segmentação por departamento (como HSE-IT), export Power BI futuro (fora deste escopo), white-label nos componentes.

### Fora deste escopo (pode vir em iterações)

- Análise de IA por ciclo
- Export Power BI (Excel/CSV)
- App mobile / push notifications
- Comentários abertos por pergunta
