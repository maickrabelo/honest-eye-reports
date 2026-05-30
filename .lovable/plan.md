## Objetivo

1. Habilitar o módulo PGR automaticamente para todos os planos SMS (Técnico, Gestora Basic/Pro, Empresa Starter/Corporate) quando o cliente é provisionado via Hotmart.
2. Criar uma nova página de Kanban de ações do PGR, separada do dashboard atual, com drag-and-drop entre colunas de status e confirmação ao concluir/cancelar.

---

## Parte 1 — PGR nos planos SMS

### Banco
- Adicionar coluna `pgr_enabled boolean NOT NULL DEFAULT false` em `subscription_plans` (segue o padrão de `ai_enabled` e `ouvidoria_enabled`).
- Setar `pgr_enabled = true` nos 5 planos SMS já criados: `tecnico-sst-sms`, `gestora-sst-sms-basic`, `gestora-sst-sms-pro`, `empresa-sms-starter`, `empresa-sms-corporate`.
- Demais planos permanecem `false` (PGR continua restrito — não vaza para clientes legados).

### Provisionamento
- `hotmart-webhook`: ao criar/atualizar a gestora SST (planos Técnico + Gestora), se `plan.pgr_enabled = true`, atualizar `sst_managers.pgr_module_enabled = true`.
- `create-sst-company` (planos Empresa SMS, que criam uma gestora-shell própria): mesma lógica — propagar a flag.
- Idempotente: se já estiver `true`, não faz nada.

### Frontend
- `usePGRModuleAccess` continua funcionando sem mudança (lê `sst_managers.pgr_module_enabled`).
- Empresas SMS acessam PGR via a gestora-shell associada — fluxo já coberto pelo hook atual.

---

## Parte 2 — Kanban de ações do PGR (página separada)

### Rota
- Nova rota: `/pgr/:pgrId/kanban` (registrada em `App.tsx`, protegida pelo mesmo guard do `/pgr/:id`).
- Botão "Ver em Kanban" no header do `PGRMonitoringDashboard` que leva à nova rota.
- Botão "Voltar para Dashboard" na página Kanban.

### Página `PGRKanbanPage.tsx`
Reusa `usePGRDashboardData(pgrId)` (já carrega ghes/risks/actions/checklist).

Layout: 4 colunas fixas lado a lado, scroll horizontal no mobile:

```text
┌──────────┬──────────────┬──────────┬───────────┐
│ Pendente │ Em andamento │Concluída │ Cancelada │
│   (12)   │     (5)      │   (8)    │    (1)    │
├──────────┼──────────────┼──────────┼───────────┤
│ [card]   │ [card]       │ [card]   │ [card]    │
│ [card]   │ [card]       │ [card]   │           │
│ [card]   │              │          │           │
└──────────┴──────────────┴──────────┴───────────┘
```

- Cada coluna mostra contador + cards filtrados por status.
- Cards reusam uma versão compacta do `ActionCard` (descrição, GHE, responsável, prazo com cor de atraso, badge de hierarquia, mini-progress do checklist). Sem botão "marcar como concluída" — usa drag.
- Filtros no topo: GHE, responsável, somente atrasadas (idênticos ao dashboard).

### Drag-and-drop
- Lib: `@dnd-kit/core` + `@dnd-kit/sortable` (já no padrão React, leve, acessível).
- Ao soltar em outra coluna:
  - Atualização otimista local.
  - `supabase.from('pgr_action_items').update({ status: <novo> }).eq('id', actionId)`.
  - Em caso de erro: reverte e mostra toast.
- **Confirmação modal** quando destino for `done` ou `cancelled`:
  - "Concluir ação 'X'?" / "Cancelar ação 'X'?"
  - Confirmar → executa update. Cancelar → reverte para coluna de origem.
- Status `pending` ↔ `in_progress`: troca direta sem confirmação.

### Acessibilidade
- Cards têm `aria-label` com status atual.
- Atalho de teclado: setas movem foco entre cards, Enter abre detalhe (modal simples reusando `ActionCard` completo, opcional fase 2).

---

## Arquivos

**Migration**
- `supabase/migrations/<ts>_pgr_enabled_plan_flag.sql` — adiciona coluna, atualiza os 5 planos SMS.

**Edge functions**
- `supabase/functions/hotmart-webhook/index.ts` — set `pgr_module_enabled` quando plano tem `pgr_enabled`.
- `supabase/functions/create-sst-company/index.ts` — idem para gestora-shell de planos Empresa SMS.

**Frontend**
- `src/pages/PGRKanban.tsx` (novo)
- `src/components/pgr/KanbanColumn.tsx` (novo)
- `src/components/pgr/KanbanActionCard.tsx` (novo, versão compacta)
- `src/components/pgr/ConfirmStatusChangeDialog.tsx` (novo)
- `src/components/pgr/PGRMonitoringDashboard.tsx` — adicionar botão "Ver em Kanban"
- `src/App.tsx` — registrar nova rota
- `package.json` — `bun add @dnd-kit/core @dnd-kit/sortable`

**Memória**
- Atualizar `mem://features/planos-sms-hotmart` para incluir `pgr_enabled = true` nos 5 planos.
- Nova nota `mem://features/pgr-kanban-board` descrevendo a nova rota e a lógica de drag-and-drop com confirmação.

---

## Fora do escopo
- Edição inline de checklist no card do Kanban (continua disponível na view de grade do dashboard).
- Drag para reordenar dentro da mesma coluna (sem prioridade definida no schema atual).
- Realtime multi-usuário (Postgres changes) — pode ser fase 2 se necessário.