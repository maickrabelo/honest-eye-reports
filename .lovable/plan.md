

## Diagnóstico: Email de credenciais não enviado após pagamento

### O que aconteceu

O webhook do Asaas foi recebido e processado com sucesso (a assinatura `buzzmktsocial@gmail.com` está `active`), mas o email com as credenciais **não saiu**. Identifiquei 3 problemas no código atual de `asaas-webhook/index.ts`:

### Problema 1 — Remetente inválido (causa raiz mais provável)
O email usa `from: 'SOIA <onboarding@resend.dev>'`. Esse remetente só funciona quando enviado **para o próprio dono da conta Resend**. Para qualquer outro destinatário (como `buzzmktsocial@gmail.com`), o gateway Resend **rejeita o envio** com erro 403. É por isso que o webhook completa sem erros, mas o email nunca chega.

### Problema 2 — Falha silenciosa
O `await fetch(...)` em `sendCredentialsEmail` não verifica `response.ok` nem captura o corpo do erro. Quando o Resend recusa o envio, o webhook ignora a falha e responde 200 OK, escondendo o problema.

### Problema 3 — Sem infraestrutura de email branded da Lovable
O projeto ainda não usa o sistema de **App Emails** da Lovable (fila durável, retry automático, domínio verificado, supressão de bounces). Hoje todo email passa por um `fetch` direto ao Resend sem rastreabilidade.

---

### Solução proposta (em 2 fases)

**Fase 1 — Correção imediata (sem depender de DNS)**
1. Editar `supabase/functions/asaas-webhook/index.ts`:
   - Tornar `sendCredentialsEmail` à prova de falhas: checar `response.ok`, ler `await response.text()` em caso de erro e logar com `console.error`.
   - Persistir uma linha em uma tabela `email_send_attempts` (criada via migration) com `email`, `status`, `error_message`, `subscription_id` e `created_at` para auditoria futura.
   - Como medida temporária, manter `from: 'SOIA <onboarding@resend.dev>'` mas adicionar fallback: se o envio falhar, gravar a senha provisória em `subscriptions.metadata.provisional_password` para que você possa recuperá-la manualmente do banco.
2. Reenviar manualmente o email da última compra (`buzzmktsocial@gmail.com`) executando o webhook novamente para aquela `subscription_id` ou via uma chamada SQL+função admin que dispare o email com a senha gerada (CNPJ do cliente, conforme a regra atual).

**Fase 2 — Migração para App Emails da Lovable (recomendado)**
1. Configurar o domínio de envio `notify.soia.app.br` (delegação de NS para a Lovable).
2. Provisionar a infraestrutura de email (fila pgmq, cron, supressão).
3. Criar um template React Email `subscription-credentials` em `_shared/transactional-email-templates/` com a identidade visual SOIA (cores `audit-primary`/`audit-secondary`, logo).
4. Substituir a chamada direta ao Resend dentro do `asaas-webhook` por uma invocação a `send-transactional-email` com `templateName: 'subscription-credentials'` e `idempotencyKey` baseado em `subscription.id`.
5. Benefícios: retry automático em caso de rate-limit, log durável em `email_send_log`, supressão de bounces, e remetente `noreply@soia.app.br` (entrega muito superior).

---

### Detalhes técnicos
- **Editado**: `supabase/functions/asaas-webhook/index.ts` (logging + fallback).
- **Criada**: migration para tabela `email_send_attempts` (auditoria).
- **Fase 2**: configuração de domínio de email + scaffold de app emails + template `subscription-credentials.tsx` + atualização do webhook.

### Pergunta antes de começar
A Fase 1 corrige o sintoma imediato e dá visibilidade. A Fase 2 resolve definitivamente, mas exige você adicionar 2 registros NS no provedor do domínio `soia.app.br` (propagação até 72h). Quer que eu execute as duas fases agora, ou só a Fase 1 por enquanto?

