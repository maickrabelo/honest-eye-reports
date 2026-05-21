
# Módulo PGR Completo + Export e-Social — Beta restrito à conta "Demo Ilimitado"

Construir o módulo de PGR (NR-1) com export XML para e-Social, mas **liberá-lo apenas para a conta `demo.ilimitado@soia.app.br`** (e empresas atribuídas a ela) enquanto validamos. Nenhum outro SST, empresa ou admin verá o módulo até que façamos o flip do feature flag global.

---

## 1. Estratégia de gating (o ponto chave)

Adicionar coluna **`pgr_module_enabled`** (boolean, default `false`) na tabela `sst_managers`. Apenas SSTs com esse flag `true` enxergam o módulo PGR.

- Migration popula `pgr_module_enabled = true` somente para o `sst_manager` vinculado a `demo.ilimitado@soia.app.br`.
- Função SQL `has_pgr_module(_user_id uuid)` → retorna `true` se o usuário pertence a um SST com o flag ligado, OU é a empresa atribuída a esse SST.
- Frontend: hook `usePGRModuleAccess()` controla exibição do menu/rota.
- RLS de todas as tabelas PGR exige `has_pgr_module(auth.uid())`.
- Para liberar geral no futuro: rodar `UPDATE sst_managers SET pgr_module_enabled = true` (sem precisar deploy).

Admin (Master Dashboard) ganha toggle "Liberar módulo PGR" por SST, mas só usaremos manualmente quando quisermos expandir o beta.

---

## 2. Modelagem de dados (NR-1 completo)

Migrations criando (todas com RLS + `has_pgr_module` + isolamento por `sst_manager_id` + `company_id`):

- **`pgr_documents`** — um PGR por empresa/ciclo: status (rascunho/vigente/expirado), vigência início/fim, versão, responsável técnico (CPF + registro), data revisão, executive_summary.
- **`pgr_ghe`** — Grupos Homogêneos de Exposição: nome, setor, cargo, descrição atividades, qtd trabalhadores, jornada.
- **`pgr_ghe_workers`** — vínculo opcional `{cpf, nome, matricula, ghe_id}` (necessário para S-2240).
- **`pgr_risks`** — inventário: `ghe_id`, categoria (fisico/quimico/biologico/ergonomico/acidentes/psicossocial), agente, código tabela 23 e-Social, fonte geradora, trajetória, exposição (tempo/freq), severidade (1-5), probabilidade (1-5), nível calculado, EPC existentes, EPI + CA, observações.
- **`pgr_action_items`** — plano de ação: `risk_id`, descrição, hierarquia controle (eliminação/substituição/engenharia/admin/EPI), responsável, prazo, status, custo, evidência.
- **`pgr_monitoring`** — medições: `risk_id`, data, valor medido, unidade, técnica, instrumento, laudo (arquivo).
- **`pgr_esocial_exports`** — auditoria: `pgr_id`, período, hash SHA-256, arquivo no Storage, gerado_por, gerado_em.
- **`esocial_agents_catalog`** — Tabela 23 (agentes nocivos) seed com ~200 linhas.

Storage bucket privado **`pgr-documents`** para PDFs, laudos e XMLs (RLS por SST/empresa).

---

## 3. Telas e fluxo

Rota nova: `/pgr/:companyId` (gated por `usePGRModuleAccess`).

```text
SSTDashboard
  └── Card "PGR + e-Social" [BETA] (só aparece para Demo Ilimitado)
       └── /pgr/:companyId
            ├── Visão Geral (status, vigência, % concluído, alertas)
            ├── GHEs (CRUD, importar de departamentos existentes)
            ├── Inventário de Riscos (matriz 5x5 interativa por GHE)
            ├── Plano de Ação (lista + filtros por prazo/status)
            ├── Monitoramento (timeline + upload de laudos)
            ├── Riscos Psicossociais (importa automaticamente HSE-IT/COPSOQ/Burnout)
            └── Exportar
                 ├── Relatório PGR (PDF NR-1 completo)
                 └── e-Social S-2240 (XML único / ZIP de lote)
```

Wizard de criação: empresa → CNAE/grau de risco → importar setores como GHEs → biblioteca base de riscos por CNAE.

Badge **"BETA — em validação"** em todas as telas do módulo.

---

## 4. Geração do XML S-2240

- Schema oficial v1.3 (XSD versionado em `supabase/functions/_shared/esocial-schemas/`).
- Builder com `xmlbuilder2` (Deno) em edge function `generate-esocial-s2240`.
- Estrutura: `eSocial > evtExpRisco > {ideEvento, ideEmpregador, ideVinculo, infoExpRisco{dtIniCondicao, infoAmb, infoAtiv, agNoc[], respReg}}`.
- Campos: CNPJ, CPF trabalhador, matrícula, código agente (Tabela 23), intensidade/concentração, técnica, EPC eficaz S/N, EPI eficaz + CA, responsável técnico.
- Saída: download `.xml` único ou `.zip` com lote (1 arquivo por trabalhador/GHE).
- Validação local contra XSD antes do download. Mensagem clara: **"Arquivo pronto para upload pelo contador no portal e-Social. Não realizamos transmissão automática."**
- Sem certificado digital nesta fase.

---

## 5. Relatório PDF NR-1

Evoluir `HSEITPGRReportPDF.tsx` → `PGRReportPDF.tsx` genérico cobrindo:
1. Capa + identificação empresa (CNPJ, CNAE, grau risco, endereço)
2. Responsável técnico SST (CPF, registro CREA/MTE/CRP)
3. Inventário completo por GHE (todas as 5+1 categorias)
4. Matriz de risco visual 5x5
5. Plano de ação 12 meses
6. Cronograma
7. Registros de monitoramento
8. Anexos (laudos)
9. Assinatura

Mantém `@react-pdf/renderer` (já usado).

---

## 6. Edge functions novas (registrar em `config.toml`)

- `generate-esocial-s2240` (verify_jwt = true) — monta XML/ZIP.
- `import-psychosocial-to-pgr` (verify_jwt = true) — puxa resultados HSE-IT/COPSOQ/Burnout e cria `pgr_risks` da categoria psicossocial.

---

## 7. Entregas em fases

**Fase 1 — Beta restrito (esta entrega, ~2 semanas):**
1. Migration: tabelas + RLS + `has_pgr_module` + flag em `sst_managers` ligado só para Demo Ilimitado
2. Seed catálogo Tabela 23 e-Social
3. Bucket `pgr-documents`
4. Hook + gating frontend (`usePGRModuleAccess`)
5. Telas: Visão Geral, GHEs, Inventário com matriz 5x5, Plano de Ação simples
6. Importação automática de riscos psicossociais
7. Geração PDF NR-1
8. Export XML S-2240 single + ZIP lote
9. Toggle admin no MasterDashboard (manual)

**Fase 2 (após validação Demo Ilimitado):**
- Biblioteca pré-cadastrada de riscos por CNAE
- Monitoramento com upload de laudos
- Cronograma visual (Gantt)
- Versionamento/revisão anual

**Fase 3 (futuro):**
- Transmissão direta ao e-Social com certificado A1 + ICP-Brasil
- S-2210 (CAT) e S-2220 (ASO)

---

## 8. Arquivos previstos

**Migrations:**
- Tabelas PGR + RLS + função `has_pgr_module` + coluna `sst_managers.pgr_module_enabled` + seed do catálogo + bucket + ativação do flag para Demo Ilimitado

**Edge functions novas:**
- `supabase/functions/generate-esocial-s2240/index.ts`
- `supabase/functions/import-psychosocial-to-pgr/index.ts`
- `supabase/functions/_shared/esocial-schemas/S-2240.xsd`
- Atualizar `supabase/config.toml`

**Frontend:**
- `src/hooks/usePGRModuleAccess.ts`
- `src/pages/PGRDashboard.tsx` (rota `/pgr/:companyId`)
- `src/components/pgr/PGROverview.tsx`
- `src/components/pgr/GHEManager.tsx`
- `src/components/pgr/RiskInventory.tsx`
- `src/components/pgr/RiskMatrix5x5.tsx`
- `src/components/pgr/ActionPlanEditor.tsx`
- `src/components/pgr/ESocialExportDialog.tsx`
- `src/components/pgr/PGRReportPDF.tsx` (evolução do HSEITPGRReportPDF)
- Card BETA no `SSTDashboard.tsx` (condicional ao hook)
- Toggle "Módulo PGR" no `MasterDashboard.tsx` por SST
- `src/App.tsx` (registrar rota gated)

---

## 9. Riscos e premissas

- **Tabela 23/24 do e-Social** muda — incluir nota para revisão periódica do seed.
- **Validação XSD**: testar amostras de XML antes da entrega ao usuário Demo.
- **Escopo apertado**: se 2 semanas não couberem todas as fases, priorizar Inventário + Matriz + PDF + XML S-2240; deixar monitoramento e cronograma visual para Fase 2.
- **Beta isolado**: nenhuma alteração de UI/UX visível para outros SSTs, empresas ou admin — gating em RLS + frontend garante isolamento total.
- **Como expandir depois**: basta `UPDATE sst_managers SET pgr_module_enabled = true WHERE id IN (...)` ou usar o toggle admin. Sem novo deploy.
