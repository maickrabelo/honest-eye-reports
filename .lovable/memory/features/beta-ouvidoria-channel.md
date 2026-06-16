---
name: Beta Ouvidoria Channel
description: Canal alternativo de ouvidoria (sem IA, sem créditos) em beta exclusivo para Demo Ilimitado. Formulário estático com protocolo + chave de acesso para acompanhamento anônimo.
type: feature
---
Canal beta de denúncias/relatos 100% anônimo, paralelo ao Reports/chat-report atual.

- Tabelas: `beta_ouvidoria_reports`, `beta_ouvidoria_attachments`, `beta_ouvidoria_updates`. Trigger `beta_ouvidoria_only_demo` rejeita qualquer `company_id` fora da whitelist (Demo Ilimitado: `382745b1-d65a-4928-bb1b-95ae513c4e14`).
- Bucket privado `beta-ouvidoria-attachments`; anon pode fazer INSERT (upload), SELECT só para usuários da empresa autorizada/admin.
- Edge functions (sem IA, sem créditos): `submit-beta-report`, `track-beta-report`, `reply-beta-report`. Chave de acesso = 14 chars (formato `XXXX-XXXX-XXXX`); guardamos apenas SHA-256.
- Protocolo formato `BETA-YYYY-NNNNN`.
- Rotas: `/ouvidoria-beta/:companyId` (form público), `/ouvidoria-beta/acompanhar` (consulta anônima), `/ouvidoria-beta/painel` (dashboard interno).
- Whitelist no front em `src/lib/betaOuvidoria.ts` (`BETA_OUVIDORIA_COMPANY_IDS`); card aparece em `Dashboard.tsx` apenas para empresas autorizadas.
- Não dispara emails, não usa Lovable AI Gateway, não cria reports no módulo padrão.
