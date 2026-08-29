# Ouvidoria — 8 melhorias no painel (Smart e IA)

As 8 melhorias valem para os dois canais: a **Ouvidoria Smart** (formulário estático) e a **Ouvidoria com IA** (relatos por chat, módulo `Reports`). A lógica e a interface são construídas uma vez e aplicadas nos dois painéis, respeitando as diferenças de cada canal (protocolo + chave de acesso no Smart; código de acompanhamento e transcrição do chat na Ouvidoria com IA).

## 1. Logs de acesso + download do histórico
- Nova tabela de logs de consulta: cada vez que alguém consulta o protocolo na página de acompanhamento, grava data/hora, sucesso ou falha (chave errada), IP aproximado e user agent.
- No quadro de cada denúncia, nova aba "Logs de acesso" listando as consultas do denunciante (data/hora e resultado).
- Botão "Baixar histórico (PDF)" no quadro da denúncia: protocolo, data de abertura, tipo/categoria/setor, descrição completa, resumo, todas as atualizações com data e autor, notas internas (marcadas como internas), anexos listados e situação atual.

## 2. Gestão de usuários da ouvidoria
- Nova aba "Usuários" no painel, visível apenas para o administrador principal da empresa.
- Convite por e-mail com nome, cargo e tipo de acesso:
  - **Gestor**: vê e edita denúncias (responder, mudar status, notas internas, tarefas).
  - **Auditor**: apenas visualiza (sem responder, sem alterar status, sem criar tarefas).
- Fluxo de convite reaproveita o modelo já existente de convites por e-mail (Resend + página de aceite, criação de senha no primeiro acesso).
- Lista de usuários com cargo, tipo, status do convite e ação de revogar acesso.

## 3. Privacidade nas atualizações
- Cada atualização passa a registrar autor (usuário, nome e cargo).
- O nome aparece somente no painel interno. A consulta pública por protocolo continua mostrando apenas "Resposta da ouvidoria" com data e mensagem.

## 4. Notas internas
- No quadro da denúncia, campo "Nota interna" separado da resposta ao denunciante.
- Notas ficam marcadas visualmente como internas no painel e nunca são retornadas na consulta pública.
- Auditores podem ler as notas, mas não criar.

## 5. Filtros rápidos por categoria
- Linha de botões (chips) acima da lista: "Todas", "Assédio", "Discriminação", "Fraude", "Conduta", etc., com contador de cada categoria.
- Clique aplica o filtro imediatamente; os filtros atuais de status/busca continuam funcionando em conjunto.

## 6. Aba "Tarefas"
- Nova aba com boards estilo Trello: colunas A fazer / Em andamento / Concluída, arrastar e soltar.
- Cada tarefa tem: título, descrição, denúncia vinculada (opcional), prazo, responsáveis (um ou mais usuários da ouvidoria) e checklist interna com itens marcáveis.
- Alerta visual de atraso quando o prazo passou e a tarefa não está concluída, mais um contador de atrasadas no topo.
- Botão "Exportar histórico para a denúncia": cria uma atualização pública na denúncia vinculada com o título da tarefa, o que foi feito, os itens da checklist concluídos e a data de conclusão — visível para quem acompanha pelo protocolo.

## 7. Divulgação por e-mail
- Nova aba "Divulgação" com lista de e-mails de colaboradores da empresa.
- Importação por CSV, inclusão manual e exclusão de e-mails.
- Seleção individual ou "selecionar todos" antes do envio.
- Envio via Resend com mensagem padrão editável e botão levando ao canal público da empresa. Texto sugerido:
  "A [empresa] agora tem um canal de escuta 100% anônimo. Tem uma sugestão, reclamação ou algo que precisa ser dito? Fale com segurança — sua identidade é preservada. Vamos juntos construir um ambiente mais saudável."
- Histórico de envios (data, quantidade de destinatários, status).

## 8. Aba "Como funciona?"
- Passo a passo do canal: como o relato é enviado, o protocolo e a chave de acesso, prazos e status, quem tem acesso ao quê, notas internas vs. respostas públicas, tarefas, divulgação, logs e anonimato/LGPD.
- Perguntas frequentes e boas práticas de tratativa.

## Detalhes técnicos
- **Novas tabelas** (todas em `public`, com GRANTs, RLS por empresa e função `has_role`/vínculo de empresa): `beta_ouvidoria_access_logs`, `beta_ouvidoria_users` (nome, cargo, tipo gestor/auditor, user_id, company_id), `beta_ouvidoria_internal_notes`, `beta_ouvidoria_tasks`, `beta_ouvidoria_task_assignees`, `beta_ouvidoria_task_checklist_items`, `beta_ouvidoria_mailing_list`, `beta_ouvidoria_campaigns`.
- **Colunas novas** em `beta_ouvidoria_updates`: `author_user_id`, `author_name`, `author_role_title`, `visibility` (`public` | `internal`).
- **Edge functions**: `track-beta-report` passa a registrar o log de acesso e a filtrar atualizações internas; novas `invite-ouvidoria-user`, `send-ouvidoria-campaign` (Resend, já configurado no projeto). Registro em `supabase/config.toml`.
- **Front-end**: `src/pages/BetaOuvidoriaDashboard.tsx` reorganizado em abas (Denúncias, Tarefas, Usuários, Divulgação, Como funciona) com componentes novos em `src/components/ouvidoria/`; PDF gerado com jsPDF seguindo o padrão dos relatórios existentes; drag-and-drop com `@dnd-kit` (já usado no Kanban do PGR).
- Permissões de gestor/auditor aplicadas tanto na UI quanto nas políticas RLS.

## Sugestão de ordem de entrega
1. Base de dados + permissões (itens 2, 3, 4)
2. Painel: filtros rápidos, notas internas, logs e PDF (itens 1, 5)
3. Tarefas (item 6)
4. Divulgação (item 7)
5. Como funciona (item 8)
