
The user wants a Trainings module where SST managers create educational content (videos, articles, PDFs), organize into modules, and assign visibility per managed company. Companies see a "Treinamentos" section in their dashboard.

Existing context:
- There's already `sst_portal_trainings` table for partner portal (admin → SST). I need a NEW system for SST → company.
- Pattern reference: SST portal docs use `target_sst_manager_ids` checkbox selection.
- Storage bucket `sst-portal-documents` exists (private). Will create new bucket for trainings.

Plan structure: simple, focused.

## Plano: Módulo de Treinamentos (Gestora SST → Empresas)

### Visão Geral
Nova ferramenta no dashboard da Gestora SST para criar **Módulos Educativos** contendo materiais (vídeos do YouTube, PDFs, artigos). Cada material pode ser disponibilizado para empresas específicas via checkbox. Empresas atribuídas veem a página "Treinamentos" no dashboard (com botão desativado quando não houver conteúdo).

### Estrutura de Banco de Dados (3 tabelas novas)

**1. `sst_training_modules`** — agrupa materiais por tema
- `id`, `sst_manager_id`, `title`, `description`, `cover_image_url`, `order_index`, `created_at`

**2. `sst_training_materials`** — vídeos / PDFs / artigos
- `id`, `module_id`, `title`, `description`
- `material_type`: 'video' | 'pdf' | 'article'
- `content_url` (YouTube link ou arquivo PDF), `article_content` (texto), `duration_minutes`, `order_index`

**3. `sst_training_company_access`** — define quais empresas veem cada módulo
- `module_id`, `company_id` (relação N:N)
- Se um módulo não tiver registros aqui → invisível para todas

**Storage**: novo bucket privado `sst-trainings` para PDFs e capas.

**RLS**:
- Gestora SST: CRUD apenas em módulos onde `sst_manager_id` = seu próprio
- Empresas: SELECT apenas em módulos liberados via `sst_training_company_access` para `company_id` do perfil
- Materiais herdam permissão do módulo

### Interface

**Painel da Gestora SST** (novo card "Treinamentos" no dashboard):
- Página `/sst/treinamentos` com lista de módulos (cards com capa)
- Botão "Novo Módulo" → abre formulário (título, descrição, capa)
- Ao abrir um módulo: lista de materiais + botão "Adicionar Material"
- Modal de material: tipo (vídeo/PDF/artigo), título, descrição, URL ou upload
- Botão "Gerenciar Acesso": modal com checkboxes de todas empresas atribuídas à gestora
  - Opção "Todas empresas" / seleção individual

**Dashboard da Empresa**:
- Novo card "Treinamentos" no dashboard (visível somente se empresa tem ≥1 módulo liberado; caso contrário aparece desabilitado com tooltip "Aguardando conteúdo da sua gestora SST")
- Página `/empresa/treinamentos`: grid de módulos liberados → ao clicar abre lista de materiais
- Player embutido para YouTube, viewer para PDF, leitor para artigos

### Arquivos a criar
- Migration SQL: 3 tabelas + bucket + políticas RLS
- `src/pages/SSTTrainings.tsx` (gestora)
- `src/pages/CompanyTrainings.tsx` (empresa)
- `src/components/sst-trainings/ModuleCard.tsx`
- `src/components/sst-trainings/MaterialForm.tsx`
- `src/components/sst-trainings/CompanyAccessDialog.tsx`
- `src/components/sst-trainings/MaterialViewer.tsx` (player YouTube + PDF + artigo)
- Rotas em `App.tsx` + cards/links nos dashboards SST e Empresa

### Considerações Técnicas
- YouTube: extrair ID do link e renderizar `<iframe>` embed
- PDF: abrir em nova aba via signed URL (bucket privado)
- Artigo: editor simples (textarea com markdown básico) para conteúdo inline
- Verificação no dashboard da empresa via count rápido para habilitar/desabilitar o card
