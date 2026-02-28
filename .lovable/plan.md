

## Plano: Área de Time de Vendas com CRM e Kanban

### Escopo
Criar uma nova seção "Time de Vendas" no Master Dashboard com:
1. Tabela de banco de dados para os leads do time de vendas
2. Nova aba no Master Dashboard
3. Componente CRM com formulário de cadastro (nome da empresa, telefone, responsável, cidade)
4. Visualização Kanban com 4 colunas: Prospect → Reunião Agendada → Reunião Realizada → Fechamento

### Mudanças no Banco de Dados

Criar tabela `sales_leads`:
- `id` (uuid, PK)
- `company_name` (text, not null)
- `phone` (text)
- `contact_name` (text)
- `city` (text)
- `status` (text, default 'prospect') — valores: prospect, meeting_scheduled, meeting_done, closed
- `notes` (text)
- `created_by` (uuid, ref auth.users)
- `created_at`, `updated_at` (timestamptz)

RLS: apenas admins podem CRUD.

### Novos Arquivos

1. **`src/components/admin/SalesTeamTab.tsx`** — Componente principal com:
   - Botão "Novo Lead" abrindo dialog com campos: nome empresa, telefone, responsável, cidade, observações
   - Visualização alternável: Tabela / Kanban
   - **Kanban** com 4 colunas drag-and-drop (usando estado local + update no banco ao mover):
     - Prospect (cinza)
     - Reunião Agendada (azul)
     - Reunião Realizada (amarelo)
     - Fechamento (verde)
   - Cards no kanban mostrando nome empresa, responsável, cidade, telefone
   - Editar/excluir leads
   - Busca por nome da empresa

### Arquivos Modificados

2. **`src/pages/MasterDashboard.tsx`**:
   - Importar `SalesTeamTab`
   - Adicionar nova `TabsTrigger value="sales"` com label "Time de Vendas"
   - Adicionar `TabsContent value="sales"` renderizando `<SalesTeamTab />`

### Detalhes Técnicos

- Drag-and-drop no Kanban implementado com HTML5 drag events nativos (sem lib extra)
- Ao soltar card em outra coluna, faz `UPDATE sales_leads SET status = 'novo_status'` via Supabase
- Dialog de edição reutiliza mesmo formulário do cadastro
- Contadores de leads por coluna no header do kanban

