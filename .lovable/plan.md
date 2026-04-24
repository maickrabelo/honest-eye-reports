## Exportação de Dados das Avaliações (Excel + Power BI)

Adicionar capacidade de exportar **dados brutos e agregados** de todas as avaliações da plataforma em formatos compatíveis com Excel e Power BI.

### Módulos contemplados

1. **HSE-IT** (`hseit_assessments`, `hseit_responses`, `hseit_answers`)
2. **COPSOQ II** (`copsoq_assessments`, `copsoq_responses`, `copsoq_answers`)
3. **Burnout / LBQ** (`burnout_assessments`, `burnout_responses`, `burnout_answers`)
4. **Pesquisa de Clima** (`climate_surveys`, `survey_responses`, `survey_answers`) — hoje exporta só agregados; será expandido com dados brutos.

### Formatos de exportação

Botão único "Exportar" com dropdown:
- **Excel (.xlsx)** — múltiplas abas (Resumo, Respostas, Respostas por Questão, Por Departamento, Score por Categoria/Dimensão).
- **CSV para Power BI (.csv)** — formato "long/tidy" (uma linha por resposta-questão), UTF-8 com BOM, separador `;` (padrão BR/PowerBI), datas ISO. Ideal para importar direto em Power BI / Power Query.

### Arquitetura

**1. Util compartilhado** `src/lib/assessmentExport.ts`
- `exportAssessmentToExcel(config)` — gera .xlsx multi-aba com ExcelJS (já instalado).
- `exportAssessmentToPowerBICSV(config)` — gera .csv long-format.
- Recebe: título, empresa, lista de respostas (com demographics), lista de answers (com question text/code/category), metadata da avaliação.

**2. Componente reutilizável** `src/components/assessments/AssessmentExportButton.tsx`
- Dropdown com Excel / CSV Power BI.
- Loader e toast de feedback (mesmo padrão de `ClimateSurveyExportButton`).
- Aceita `assessmentType: 'hseit' | 'copsoq' | 'burnout' | 'climate'` + `assessmentId`.
- Faz fetch das respostas + answers ao clicar (lazy).

**3. Estrutura das abas Excel**

| Aba | Conteúdo |
|---|---|
| Resumo | Empresa, período, total respostas, taxa participação, scores principais |
| Respostas (anonimizadas) | 1 linha por respondente: ID anônimo, departamento, cargo, gênero, faixa etária, tempo empresa, data |
| Respostas por Questão | 1 linha × N colunas (uma coluna por questão) — ideal para análise em Excel |
| Por Questão (long) | ID resposta, código questão, texto, categoria, valor — formato analítico |
| Por Departamento | Médias por departamento × categoria |
| Por Categoria | Score médio por categoria/dimensão |

**4. CSV Power BI (formato long)**
Colunas: `assessment_id; assessment_type; company; department; gender; age_range; tenure; response_id; response_date; question_code; question_text; category; answer_value; answer_label`

### Pontos de integração na UI

Adicionar `<AssessmentExportButton />` em:
- `src/pages/HSEITResults.tsx` — header, ao lado dos botões existentes
- `src/pages/COPSOQResults.tsx` — idem
- `src/pages/BurnoutResults.tsx` — idem
- `src/pages/HSEITDashboard.tsx`, `src/pages/PsychosocialDashboard.tsx`, `src/pages/BurnoutDashboard.tsx` — header
- `src/pages/ClimateSurveyDashboard.tsx` — substituir/complementar `ClimateSurveyExportButton` atual com o novo (mantendo backward-compat)

### Segurança

- Queries respeitam RLS atual (usuário só exporta dados das empresas/gestoras às quais pertence).
- Dados sempre **anonimizados** (sem nome/email do respondente — usar `respondent_id` UUID curto).
- Toast claro: "Dados exportados de forma anonimizada conforme LGPD."

### Documentação Power BI

Criar `mem://features/data-export-powerbi` registrando:
- Layout do CSV (separador, encoding, formato data)
- Como importar no Power BI Desktop (Get Data → Text/CSV)
- Estrutura "long" facilita criação de medidas DAX e visualizações.

### Fora de escopo (futuro)

- Endpoint REST/API direto para Power BI Service refresh agendado.
- Conector Power BI customizado (.mez).
- Export agendado por e-mail.
