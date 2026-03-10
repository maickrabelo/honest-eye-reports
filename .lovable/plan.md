

# Plan: Periodic Assessment Cycles + PGR-Compliant PDF Report

## Overview

Two major features: (1) Enable periodic re-assessments with time-based filtering and historical comparison for HSE-IT and COPSOQ, and (2) Restructure the PDF report to follow the PGR (Programa de Gerenciamento de Riscos) format from the uploaded model document, with full legal compliance methodology.

---

## Part 1: Periodic Assessment Cycles (30, 90, 180 days, 1 year)

### Dashboard Changes (HSEITDashboardContent + COPSOQDashboardContent)
- Add a **period filter** (Select: 30 dias, 90 dias, 180 dias, 1 ano, Todo período) to filter assessments by creation/start date
- Add a **"Histórico de Avaliações"** section that groups assessments by company, showing a timeline view
- For companies with multiple assessments, show a **comparison badge** ("Comparar com anterior")

### Results Pages (HSEITResults + COPSOQResults)
- Add a **"Comparar com Período Anterior"** toggle/section
- When enabled, fetch the previous assessment for the same company and display:
  - Side-by-side category averages (current vs previous)
  - Delta indicators (arrows up/down with percentage change)
  - Evolution line chart showing scores across assessment cycles
- Add period selector on results page to filter responses by date range (30/90/180/365 days)

### Technical Approach
- Query `hseit_assessments` / `copsoq_assessments` filtered by `created_at` date range
- For comparison, query the most recent previous assessment for the same `company_id` with `created_at < current_assessment.created_at`
- No database changes needed - existing schema supports this with `created_at` and `company_id` fields

---

## Part 2: PGR-Compliant PDF Report

### New PDF Structure (based on uploaded CRARP model)

The PDF will be restructured to follow PGR format with these sections:

1. **Capa** - Title "PROGRAMA DE GERENCIAMENTO DE RISCOS PSICOSSOCIAIS", company data, responsible SST professional
2. **Sumário** - Table of contents
3. **1. Introdução ao PGR** - Legal framework (NR-1, Portaria MTE 1.419/2024, May 2025 mandate), explaining why psychosocial risk management is now mandatory
4. **2. Objetivos Específicos** - Program objectives
5. **3. Identificação da Empresa** - Company name, CNPJ, address, CNAE, risk grade (pulled from company profile)
6. **4. Metodologia** - Full explanation of HSE-IT / COPSOQ methodology, citing validated international tools, scales (1-5 Likert), scoring criteria, risk classification thresholds with color coding
7. **5. Inventário de Riscos Psicossociais por GHE/Setor** - For each department:
   - Sector description
   - Risk specification table (Agent, Risk, Exposure, Frequency, Severity, Probability, Risk Level, Proposed Measures) - matching the PGR format
   - Category-by-category results with technical analysis
8. **6. Plano de Ação Geral** - Monthly timeline table (Jan-Dec) with action items, responsible persons, execution dates
9. **7. Plano de Ação por Setor** - Department-specific action plans in the same monthly grid format
10. **8. Comparativo com Avaliações Anteriores** - If previous assessment exists, show evolution table
11. **9. Encerramento** - Closing statement with SST professional signature block

### Files to Create/Modify
- **Modify `src/components/hseit/HSEITReportEditor.tsx`** - Update the PDF generation to follow PGR structure, add new editable sections (company identification, methodology text, GHE descriptions)
- **Create `src/components/hseit/HSEITPGRReportPDF.tsx`** - New comprehensive PDF generator with PGR compliance
- **Modify `src/components/hseit/HSEITReportPDF.tsx`** - Redirect to new PGR format
- **Modify `src/pages/HSEITResults.tsx`** - Add period comparison UI
- **Modify `src/pages/COPSOQResults.tsx`** - Add period comparison UI
- **Modify `src/components/psychosocial/HSEITDashboardContent.tsx`** - Add period filter
- **Modify `src/components/psychosocial/COPSOQDashboardContent.tsx`** - Add period filter
- **Create `src/components/psychosocial/AssessmentComparison.tsx`** - Reusable comparison component

### Key PDF Technical Details
- Risk specification tables per sector following exact PGR format: Agent → Risk → Exposure → Frequency → Risk Evaluation → Severity → Probability → Risk Level → Proposed Measures
- Monthly action plan grid (12 months) with checkmarks
- Legal references: NR-1, NR-17, Portaria MTE 1.419/2024
- Methodology section citing COPSOQ, HSE-IT, ITRA, JCQ as validated international tools
- Scoring interpretation legend (1-6 action levels from the model)
- Encerramento with SST professional credentials (name, CPF, MTE registration)

