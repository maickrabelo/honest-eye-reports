

# Gerenciamento do Portal do Parceiro no Master Dashboard

## Resumo
Criar uma area administrativa no Master Dashboard para gerenciar todo o conteudo do Portal do Parceiro: recados, documentos, treinamentos e informacoes de contrato. Cada conteudo podera ser direcionado a gestoras SST especificas ou a todas.

## O que muda para o administrador

1. **Nova aba "Portal" no Master Dashboard** com sub-secoes para gerenciar cada tipo de conteudo
2. **Mural de Recados**: Criar, editar e excluir recados, com opcao de fixar e escolher destinatarios (todas as gestoras ou especificas)
3. **Documentos**: Upload de documentos com categorizacao e direcionamento por gestora
4. **Treinamentos**: Cadastro de treinamentos com link, thumbnail, duracao e direcionamento por gestora
5. **Contrato**: Campos para preencher data de assinatura e expiracao individualmente por gestora SST (integrado na edicao da gestora)

## O que muda para as gestoras SST

- No portal, cada gestora vera apenas os conteudos direcionados a ela ou marcados como "todas"
- A filtragem acontece automaticamente no banco de dados

## Mudancas necessarias

### 1. Banco de dados (migracao SQL)
- Adicionar coluna `target_sst_manager_ids uuid[]` (nullable) nas tabelas:
  - `sst_portal_messages`
  - `sst_portal_documents`
  - `sst_portal_trainings`
- Quando NULL = visivel para todas as gestoras; quando preenchido = visivel apenas para as gestoras listadas
- Atualizar as politicas RLS de SELECT das 3 tabelas para filtrar automaticamente pelo `sst_manager_id` do usuario logado
- Adicionar politicas de INSERT, UPDATE, DELETE para admins (ja existem com ALL)

### 2. Componente AdminPortalManager (novo)
Novo componente `src/components/admin/AdminPortalManager.tsx` que sera renderizado como uma aba no MasterDashboard. Tera sub-abas internas:

**Sub-aba Recados:**
- Tabela com todos os recados cadastrados
- Botao "Novo Recado" abre dialog com: titulo, conteudo, fixado (sim/nao), destinatarios (multiselect de gestoras ou "Todas")
- Acoes: editar e excluir

**Sub-aba Documentos:**
- Tabela com todos os documentos
- Botao "Novo Documento" abre dialog com: titulo, descricao, categoria, upload de arquivo, destinatarios
- Upload vai para o bucket `sst-portal-documents`
- Acoes: editar metadados e excluir

**Sub-aba Treinamentos:**
- Grid/tabela com todos os treinamentos
- Botao "Novo Treinamento" abre dialog com: titulo, descricao, URL do conteudo, URL da thumbnail, duracao em minutos, categoria, destinatarios
- Acoes: editar e excluir

**Sub-aba Contratos:**
- Tabela listando todas as gestoras SST
- Para cada gestora, campos editaveis de: data de assinatura e data de expiracao
- Status visual (ativo/expirando/expirado) calculado automaticamente
- Botao salvar por linha

### 3. Integracao no MasterDashboard
- Adicionar aba "Portal" no TabsList existente (ao lado de Empresas, Gestoras SST, etc.)
- Importar e renderizar o componente AdminPortalManager

### 4. Atualizacao dos componentes do Portal SST
- `PortalDocuments.tsx`: Nenhuma mudanca necessaria - a filtragem sera feita pela RLS atualizada
- `PortalTrainings.tsx`: Idem
- `PortalMessageBoard.tsx`: Idem
- `PortalContractInfo.tsx`: Ja funciona corretamente

### 5. Dialog de edicao da gestora SST
- Adicionar campos de data de contrato (assinatura e expiracao) no dialog de edicao ja existente no MasterDashboard
- Atualizar o handler `handleEditSST` para incluir esses campos

## Detalhes tecnicos

### Migracao SQL
```text
-- Adicionar coluna de direcionamento nas 3 tabelas
ALTER TABLE sst_portal_messages ADD COLUMN target_sst_manager_ids uuid[] DEFAULT NULL;
ALTER TABLE sst_portal_documents ADD COLUMN target_sst_manager_ids uuid[] DEFAULT NULL;
ALTER TABLE sst_portal_trainings ADD COLUMN target_sst_manager_ids uuid[] DEFAULT NULL;

-- Atualizar RLS para filtrar por gestora
-- DROP das policies SELECT existentes para SST
-- CREATE novas policies com filtro:
-- target_sst_manager_ids IS NULL OR get_user_sst_manager_id(auth.uid()) = ANY(target_sst_manager_ids)
```

### Seletor de destinatarios
- Checkbox "Enviar para todas as gestoras" (default marcado)
- Se desmarcado, exibe multiselect com lista de gestoras SST carregadas do banco
- O valor salvo sera NULL (todas) ou array de UUIDs (especificas)

### Estrutura de arquivos
```text
src/components/admin/AdminPortalManager.tsx   (novo - componente principal)
src/pages/MasterDashboard.tsx                 (editado - nova aba)
```

### Fluxo de upload de documentos
1. Admin seleciona arquivo no dialog
2. Upload para bucket `sst-portal-documents` via Supabase Storage
3. Salva metadados + file_url na tabela `sst_portal_documents`
4. Gestoras SST fazem download pelo componente PortalDocuments existente

