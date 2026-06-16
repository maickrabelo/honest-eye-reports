
# Canal de Ouvidoria Beta — Formulário Estático (sem IA)

Novo canal paralelo ao atual de Denúncias/Ouvidoria, identificado como **Beta**, disponível apenas para a empresa **Demo Ilimitado SOIA** (`demo.ilimitado@soia.app.br`, id `382745b1-d65a-4928-bb1b-95ae513c4e14`) para validação. 100% anônimo, sem IA, sem custo de créditos, sem chat — apenas formulário estruturado + protocolo + acompanhamento.

## 1. Banco de Dados (migração)

Tabelas novas em `public` (separadas do `reports` atual para não misturar fluxos):

- **`beta_ouvidoria_reports`**
  - `id uuid pk`
  - `company_id uuid` (fixo na demo, validado por trigger)
  - `tracking_code text unique` (formato `BETA-YYYY-NNNN`)
  - `access_key_hash text` (hash bcrypt/sha256 da chave; chave em claro só é exibida 1x)
  - `report_type text` (denuncia / reclamacao / sugestao / elogio)
  - `category text` (assedio, discriminacao, fraude, conflito_interesses, conduta, uso_indevido_bens, quebra_sigilo, outros)
  - `category_other text` (livre, quando "outros")
  - `description text not null`
  - `occurrence_type text` (data_especifica / recorrente / nao_recorda)
  - `occurrence_date date null`
  - `location_sector text`
  - `status text default 'aberto'` (aberto, em_analise, respondido, encerrado)
  - `created_at timestamptz default now()`
  - **Sem** colunas de IP, user-agent, geolocalização ou user_id.

- **`beta_ouvidoria_attachments`**
  - `id`, `report_id fk`, `file_path text` (bucket privado), `file_name`, `mime_type`, `size_bytes`, `created_at`.

- **`beta_ouvidoria_updates`** (mensagens entre investigador e denunciante anônimo via protocolo)
  - `id`, `report_id fk`, `author_type text` (investigator / anonymous), `message text`, `created_at`.

**Bucket**: `beta-ouvidoria-attachments` (privado).

**RLS / GRANT**:
- `anon`: INSERT em `beta_ouvidoria_reports`, `beta_ouvidoria_attachments`, `beta_ouvidoria_updates` (apenas via edge functions, validando a empresa demo).
- `authenticated`: SELECT/UPDATE somente para usuários da empresa demo (`user_in_company(auth.uid(), company_id)`) ou admins.
- Trigger `beta_ouvidoria_only_demo` rejeita qualquer `company_id` ≠ id da Demo Ilimitado (enforce do beta).
- Trigger `set_beta_tracking_code` gera `BETA-YYYY-NNNN` automaticamente.

## 2. Edge Functions (sem IA, sem chat-report)

- **`submit-beta-report`** (`verify_jwt = false`)
  - Recebe payload validado por Zod (tipos, tamanhos, sem campos identificadores).
  - Confirma `company_id` = Demo Ilimitado.
  - Gera chave aleatória (12 chars alfanum + símbolos), salva hash.
  - Cria report + attachments (URLs já enviadas via upload anônimo no bucket).
  - Retorna `{ tracking_code, access_key }` (chave em claro só nesta resposta).
- **`track-beta-report`** (`verify_jwt = false`)
  - Recebe `tracking_code` + `access_key`, valida hash, retorna report + updates.
- **`reply-beta-report`** (`verify_jwt = false`)
  - Denunciante anônimo responde perguntas adicionais via protocolo + chave.

Nenhuma chamada ao Lovable AI, sem consumo de créditos, sem logs de IP.

## 3. Frontend

Rotas novas (independentes do `/denuncia` atual):

- **`/ouvidoria-beta/:companyId`** — formulário público anônimo (`BetaOuvidoriaForm.tsx`)
  - Seções na ordem do briefing: mensagem de abertura, triagem (tipo + categoria), relato (descrição, data/período, setor), evidências (upload com aviso de metadados), envio.
  - Validação Zod, limites de tamanho, sem campos de identificação.
  - Ao enviar: modal `BetaProtocolModal` exibindo protocolo + chave com botões "copiar" e aviso de guardar — chave nunca mais será mostrada.

- **`/ouvidoria-beta/acompanhar`** — `BetaTrackReport.tsx`
  - Inputs de protocolo + chave, lista atualizações, permite o anônimo responder.

- **Dashboard interno da empresa**: nova aba/página `BetaOuvidoriaDashboard.tsx`
  - Lista relatos da empresa demo, filtros por tipo/categoria/status, detalhe com histórico e campo para investigador responder.
  - Renderizada no `Dashboard` da empresa Demo Ilimitado apenas (gate por `companyId === DEMO_ILIMITADO_ID`).

- **Gate de visibilidade do módulo beta**:
  - Constante `BETA_OUVIDORIA_COMPANY_IDS = ['382745b1-...']`.
  - Hook `useBetaOuvidoriaAccess(companyId)` retorna boolean.
  - Card "Ouvidoria Beta" aparece em `Dashboard.tsx` somente quando o hook libera; rotas redirecionam para `/` caso contrário.
  - Card mostra badge `Beta` e tooltip "Canal experimental sem IA".

## 4. Componentes novos
- `src/components/beta-ouvidoria/BetaIntroCard.tsx` (mensagem de abertura/garantias).
- `BetaReportTypeSelector.tsx`, `BetaCategorySelector.tsx`.
- `BetaOccurrenceDateField.tsx` (radio: data específica / recorrente / não recordo).
- `BetaAttachmentsField.tsx` (com aviso de metadados).
- `BetaProtocolModal.tsx`.
- `BetaReportDetail.tsx` (visão investigador) e `BetaAnonymousThread.tsx` (visão anônima).

## 5. Memória do projeto
- Criar `mem://features/beta-ouvidoria-channel` descrevendo: beta, gate por empresa, sem IA/créditos, fluxo de protocolo + chave hash, tabelas separadas.
- Adicionar linha no `mem://index.md`.

## 6. Fora de escopo
- Integração com módulo atual de Reports / chat-report / análise por IA.
- Notificações por e-mail (anônimo não fornece contato).
- Liberação para outras empresas — apenas Demo Ilimitado durante o beta.
- Exportação Power BI deste canal (pode entrar depois).

## Resumo técnico
Tabelas isoladas (`beta_ouvidoria_*`) + bucket privado + 3 edge functions sem IA + rotas `/ouvidoria-beta/...` + dashboard interno restrito por whitelist de `company_id`. Trigger garante que só a Demo Ilimitado consegue criar registros no beta.
