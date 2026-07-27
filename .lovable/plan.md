# Nova avaliação psicossocial: Aprendizes CLASA (NR-01)

Criar um 4º tipo de avaliação psicossocial (ao lado de HSE-IT, COPSOQ II e Burnout), com as 29 questões de múltipla escolha + 1 campo aberto da planilha enviada, visível **apenas** para a gestora Futuramed (`sst_managers.id = b493c525-…f15`, confirmado no banco) e para admin.

## Conteúdo do instrumento

- 2 campos iniciais de texto: **Turma / Período do Programa** e **Mês / Ano da Pesquisa** (obrigatórios, gravados em `demographics`).
- **Q01–Q29**: múltipla escolha com 3 alternativas (1 = favorável/proteção, 2 = intermediária/alerta, 3 = desfavorável/risco), texto exatamente como na planilha.
- **Q30**: texto longo opcional (elogios/críticas/sugestões).
- 9 eixos + síntese:
  A Clima Social e Relações Interpessoais (Q1-3), B Carga Mental e Organização da Rotina (Q4-6), C Infraestrutura e Ergonomia (Q7-9), D Propósito e Valorização Profissional (Q10-12), E Prevenção de Riscos e Integridade Moral (Q13-15), F Comunicação e Transparência (Q16-18), G Escuta Ativa e Reconhecimento (Q19-21), H Adaptação Profissional e Saúde Emocional (Q22-24), I Diversidade, Inclusão e Equidade (Q25-27), Síntese e Recomendação (Q28-29).

## Cálculo de risco (proposto)

Como a escala é 1–3 com 1 sempre favorável, o score por eixo será a média das respostas normalizada em 0–100 (`(média-1)/2*100`, quanto maior pior):

- 0–33: Risco Baixo (verde)
- 34–66: Risco Médio (amarelo)
- 67–100: Risco Alto (vermelho)

Mesma faixa aplicada ao score global. Eixo E (assédio/segurança) e Q25 (preconceito) recebem destaque de alerta crítico quando qualquer resposta 3 aparecer.

## Banco de dados (migration)

Espelhando o padrão do Burnout:

- `clasa_assessments` — company_id, title, description, start/end_date, is_active, collection_mode, created_by
- `clasa_departments` — turmas/setores (name, employee_count, order_index)
- `clasa_responses` — assessment_id, department, respondent_token, demographics (turma, mês/ano), total_score, risk_level, open_feedback, completed_at
- `clasa_answers` — response_id, question_number, answer_value (1–3)

Com GRANTs para `authenticated`/`service_role` (+ `anon` nas políticas públicas de resposta) e RLS igual às demais avaliações: leitura pública apenas de avaliações ativas, inserção anônima de respostas, gestão restrita a admin / empresa dona / gestora SST atribuída.

## Frontend

- `src/data/clasaQuestions.ts` — questões, eixos, labels, cores, helpers de score.
- `src/pages/CLASAManagement.tsx` — criar/editar avaliação, turmas, link + QR code (reusa padrão do Burnout).
- `src/pages/CLASAForm.tsx` — formulário público anônimo (`/clasa/:companySlug/:assessmentId`), rádio de 3 opções por questão, dados iniciais e campo aberto no fim.
- `src/pages/CLASAResults.tsx` — dashboard de resultados: KPI global, gráfico por eixo, semáforos, distribuição de respostas, lista de comentários abertos, filtro por turma, botão de export (reusando `AssessmentExportButton`) e PDF via padrão do `COPSOQReportPDF`.
- `src/pages/CLASADashboard.tsx` — listagem de avaliações.
- Rotas em `App.tsx`: `/clasa-dashboard`, `/clasa/new`, `/clasa/:id`, `/clasa/results/:id`, `/clasa/:companySlug/:assessmentId`.

## Gating (exclusividade Futuramed)

- Novo hook `useHasCLASAAccess()` que retorna true se o usuário for admin ou estiver vinculado ao `sst_manager_id` da Futuramed (via `user_sst_managers` / `profiles.sst_manager_id`), e para empresas cuja gestora atribuída seja a Futuramed.
- Card da ferramenta no `SSTDashboard` e aba extra no `PsychosocialDashboard` só renderizam quando o hook retorna true.
- Reforço no banco: políticas RLS de gestão limitadas às empresas da Futuramed (o formulário público continua acessível a qualquer respondente com o link).

## Fora de escopo

- Não altera HSE-IT, COPSOQ, Burnout nem Clima.
- Não integra automaticamente ao inventário de riscos do PGR nesta etapa (posso adicionar depois, igual ao HSE-IT).

## Observação

O texto do questionário cita "CLASA" nominalmente em quase todas as perguntas. Vou manter literal como na planilha; se preferir tornar genérico (substituindo por um nome de instituição configurável na criação da avaliação), me avise que ajusto.
