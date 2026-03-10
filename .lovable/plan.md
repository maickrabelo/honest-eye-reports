

# Plan: Add Per-Department Charts & Semáforos to HSE-IT Results

## Problem
The HSE-IT results page currently only shows overall charts (radar, pie, bar) and semáforos. Per-department/sector breakdowns with their own charts and traffic lights are missing.

## Changes

### File: `src/pages/HSEITResults.tsx`

Add a new section between the `CategoryRiskIndicators` and `AssessmentComparison` blocks that iterates over each department and renders:

1. **Per-department category averages calculation** — For each department, compute category averages from that department's responses only
2. **Radar chart** — Department-specific radar showing the 7 HSE-IT dimensions
3. **Health impact pie chart (semáforo)** — Donut chart showing favorable/intermediate/risk distribution for that department
4. **Horizontal bar chart** — Category averages with risk-colored bars
5. **CategoryRiskIndicators component** — Reuse the existing component, passing department-specific averages

Each department section will be wrapped in a Card with the department name as header and response count. The section only renders when there are 2+ departments (otherwise it would duplicate the overall view).

No new files needed — only modifying `HSEITResults.tsx`.

