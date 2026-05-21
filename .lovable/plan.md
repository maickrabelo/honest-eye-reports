
# Dashboard de Acompanhamento do PGR

Hoje o módulo PGR tem 4 abas (Visão Geral, GHEs, Inventário, Plano de Ação) focadas em **edição**. Vamos adicionar uma nova aba **"Dashboard"** (primeira aba, padrão) focada em **monitoramento visual** do programa vigente.

## O que será construído

### 1. Nova aba "Dashboard" em `PGRDashboard.tsx`
Será a aba inicial ao abrir o PGR. As demais abas (edição) permanecem.

### 2. KPIs no topo (cards)
- Total de GHEs e trabalhadores expostos
- Total de riscos identificados (e quantos críticos/altos)
- Ações: total, concluídas, em andamento, pendentes, atrasadas
- % de conclusão geral do plano de ação
- Vigência do PGR (dias restantes + barra de progresso temporal)

### 3. Gráficos (usando `recharts`, já no projeto)
- **Donut** — riscos por categoria (físico, químico, biológico, ergonômico, acidentes, psicossocial)
- **Barras horizontais** — riscos por nível (matriz Prob × Sev → Trivial/Tolerável/Moderado/Substancial/Intolerável), com cores semânticas
- **Barras** — distribuição de trabalhadores por GHE
- **Donut** — status do plano de ação (pendente / em andamento / concluída / cancelada)
- **Barras empilhadas** — ações por hierarquia de controle (eliminação → substituição → engenharia → administrativa → EPI)
- **Linha do tempo** — ações por mês de prazo (próximos 12 meses) com marcação de atrasadas

### 4. Plano de Ação Vigente — cards com checklist
Substitui visualmente a tabela na nova aba (a tabela editável continua na aba "Plano de Ação").

Cada ação vira um **card** contendo:
- Título (descrição), badge de status, badge de hierarquia de controle
- Risco vinculado + GHE
- Responsável, prazo (com destaque vermelho se atrasada, amarelo se próxima)
- Custo estimado
- **Barra de progresso** (0–100%) calculada pelos checklist items concluídos
- **Checklist interno** — lista de subtarefas marcáveis com checkbox; usuário pode adicionar/remover/marcar
- Botão "Marcar como concluída" (atualiza status diretamente)
- Histórico simples: data de criação e última atualização

Filtros no topo dos cards: por status, por GHE, por responsável, "somente atrasadas".

### 5. Persistência do checklist
Nova tabela `pgr_action_checklist_items` (id, action_item_id, title, done, order_index, timestamps) com RLS espelhando as políticas já existentes de `pgr_action_items` (acesso via `pgr_documents` → empresa/SST do usuário).

## Arquivos

**Criar**
- `src/components/pgr/PGRMonitoringDashboard.tsx` — container da aba (KPIs + gráficos + lista de cards)
- `src/components/pgr/PGRKPICards.tsx` — cards de KPI
- `src/components/pgr/PGRCharts.tsx` — todos os gráficos recharts
- `src/components/pgr/ActionCard.tsx` — card individual com checklist e progresso
- `src/components/pgr/ActionChecklist.tsx` — sub-componente do checklist (add/toggle/remove)
- `src/hooks/usePGRDashboardData.ts` — busca consolidada (GHEs, riscos, ações, checklist) com agregações memoizadas

**Editar**
- `src/pages/PGRDashboard.tsx` — adicionar 5ª aba "Dashboard" como `defaultValue`

**Migration**
- Criar `pgr_action_checklist_items` + RLS + índice por `action_item_id`

## Detalhes técnicos

- Sem mudança de dependências (recharts e lucide já presentes).
- Cores dos níveis de risco reutilizam a paleta da matriz 5×5 já definida em `PGRReportPDF.ts` (verde → vermelho escuro) via tokens HSL.
- Cálculo de "atrasada": `deadline < hoje && status !== 'done' && status !== 'cancelled'`.
- Progresso do card: se houver checklist, `done/total`; se não houver, 0% (pendente), 50% (em andamento), 100% (concluída).
- Tudo client-side com Supabase queries; sem edge function.
- Visível apenas dentro do módulo PGR, que já é restrito ao usuário "Demo ilimitado" (sem alterações de permissão).

## Fora do escopo (não será feito agora)
- Notificações/e-mails de prazos vencendo
- Exportação do dashboard em PDF (o PDF NR-1 segue separado)
- Edição inline de campos da ação no card (segue na aba "Plano de Ação")
