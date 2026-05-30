# Integração Hotmart → SOIA

Quando uma compra for aprovada na Hotmart, criamos automaticamente a conta SOIA (empresa ou gestora SST, conforme o plano), enviamos as credenciais por e-mail e suspendemos o acesso se a compra for cancelada/reembolsada.

## 1. Mapa de produtos Hotmart → Plano SOIA

Nova tabela `hotmart_product_plans` (editável depois sem deploy):

| Coluna | Descrição |
|---|---|
| `hotmart_product_id` (PK) | ID do produto na Hotmart |
| `plan_id` | FK para `subscription_plans` |
| `account_type` | `company` ou `manager` (deriva do `plan.category`, mas guardado para clareza) |
| `is_active` | liga/desliga sem deletar |

Você me passa depois os `product_id` da Hotmart e eu populo (ou você cadastra direto no painel da Lovable Cloud).

## 2. Edge Function `hotmart-webhook` (pública, `verify_jwt = false`)

URL que você vai colar no painel da Hotmart:
`https://ovednzilplbewpzpvxnf.supabase.co/functions/v1/hotmart-webhook`

**Segurança:** valida o header `X-Hotmart-Hottok` (token configurado na Hotmart) contra o secret `HOTMART_HOTTOK`.

**Eventos tratados:**

- `PURCHASE_APPROVED` / `PURCHASE_COMPLETE` → **provisiona conta**
- `PURCHASE_REFUNDED`, `PURCHASE_CHARGEBACK`, `PURCHASE_CANCELED`, `SUBSCRIPTION_CANCELLATION` → **suspende acesso**
- `PURCHASE_PROTEST`, `PURCHASE_DELAYED` → log apenas
- Demais eventos → ignora com 200 OK

### Fluxo de aprovação (espelha `asaas-webhook`)

1. Extrai `buyer.email`, `buyer.name`, `product.id`, `purchase.transaction` (idempotência) e `purchase.subscription.subscriber.code` (se assinatura).
2. Busca `hotmart_product_plans` pelo `product.id` → obtém o `subscription_plans` correspondente. Se não mapeado, devolve 200 e loga para você cadastrar depois.
3. Idempotência: se já existir `subscriptions.hotmart_transaction_id = X`, retorna sucesso sem duplicar.
4. Gera senha temporária aleatória (12 chars) e cria usuário com `auth.admin.createUser` + `email_confirm: true`.
5. Conforme `plan.category`:
   - **`company`**: cria `companies` (`max_employees = plan.max_employees`), vincula `user_companies` e `profiles.company_id`, role `company`.
   - **`manager`**: cria `sst_managers` (`max_companies = plan.max_companies`), vincula `profiles.sst_manager_id`, role `sst`.
6. Insere em `subscriptions` com `provider = 'hotmart'`, `hotmart_transaction_id`, `hotmart_subscriber_code`, `plan_id`, status `active`.
7. Marca `must_change_password: true` para forçar troca no primeiro login.
8. Envia e-mail via Resend (mesmo template do `stripe-webhook`) com login + senha temporária + link `/auth`.

### Fluxo de cancelamento (suspender, mantendo dados)

1. Localiza `subscriptions` por `hotmart_transaction_id` ou `hotmart_subscriber_code`.
2. Atualiza `subscriptions.status = 'canceled'` e:
   - `companies.subscription_status = 'inactive'` (se company), ou
   - `sst_managers.subscription_status = 'inactive'` (se manager).
3. O login fica bloqueado pelo guard de status já existente (mesmo padrão Asaas). Dados preservados para eventual reativação.

## 3. Alterações em `subscriptions`

Adicionar colunas (todas nullable, sem quebrar nada):

- `provider text` (default `'asaas'` para registros existentes; novos da Hotmart = `'hotmart'`)
- `hotmart_transaction_id text` (único)
- `hotmart_subscriber_code text` (índice)

## 4. Secrets necessários

- `HOTMART_HOTTOK` — token que a Hotmart envia no header de cada postback (você cadastra no painel da Hotmart e me passa).
- `RESEND_API_KEY` — já existe.

## 5. Painel admin (opcional, posso fazer junto ou depois)

Pequena tela em `/master/hotmart-plans` para CRUD do `hotmart_product_plans` — assim você adiciona novos produtos da Hotmart sem precisar de migração.

## Notas técnicas

- Registro de `hotmart-webhook` em `supabase/config.toml` com `verify_jwt = false`.
- Resposta sempre 200 quando o webhook for válido, mesmo em caso de "ignorar", para a Hotmart não reenviar infinitamente. Erros reais (500) só em falha de infraestrutura.
- Idempotência por `hotmart_transaction_id` impede contas duplicadas se a Hotmart reenviar o postback.
- E-mail de credenciais reutiliza o HTML do `stripe-webhook` para manter visual consistente.

## Pergunta aberta

Quer que eu já inclua a **tela admin do mapa de produtos** (item 5) nesta entrega, ou posso te enviar os `INSERT` SQL e você cadastra manualmente os primeiros produtos enquanto a tela fica para depois?
