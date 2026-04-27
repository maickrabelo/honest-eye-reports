## Slots extras de empresa para Gestoras SST

Hoje, quando uma gestora SST atinge o limite de empresas do plano (`subscription_plans.max_companies` ou `sst_managers.max_companies`), o cadastro é bloqueado com um toast de erro. Vamos transformar esse bloqueio em uma oferta: comprar 1 slot extra por **R$ 19,90/mês**, cobrado junto à próxima fatura no Asaas, e liberar o cadastro imediatamente após confirmação.

### 1. Banco de dados (migration)

**Nova coluna em `sst_managers`:**
- `extra_company_slots integer NOT NULL DEFAULT 0` — quantos slots adicionais a gestora já contratou.

**Nova tabela `sst_extra_slot_purchases`** (histórico/auditoria + base para faturamento):
- `id uuid PK`
- `sst_manager_id uuid → sst_managers(id) ON DELETE CASCADE`
- `subscription_id uuid → subscriptions(id)` (assinatura na qual o slot foi anexado)
- `slots_added integer NOT NULL DEFAULT 1`
- `unit_price_cents integer NOT NULL DEFAULT 1990` (R$ 19,90)
- `status text NOT NULL DEFAULT 'active'` (`active` | `canceled`)
- `purchased_by uuid` (user_id de quem comprou)
- `billing_started_at timestamptz` (próxima fatura)
- `created_at timestamptz default now()`
- RLS: gestora vê/insere apenas seus próprios registros; admin vê todos.

**Atualizar `validate_sst_company_limit()`**: somar `extra_company_slots` ao `max_companies` antes de comparar.

```sql
SELECT COALESCE(max_companies, 50) + COALESCE(extra_company_slots, 0)
INTO max_allowed FROM sst_managers WHERE id = NEW.sst_manager_id;
```

### 2. Edge function `purchase-extra-company-slot`

Responsável por:
1. Validar JWT e que o usuário é admin da gestora.
2. Buscar a `subscription` ativa do dono da gestora.
3. Criar uma assinatura adicional recorrente no Asaas (R$ 19,90/mês) com `nextDueDate` = data da próxima fatura da assinatura principal, descrição "Slot extra de empresa - SOIA".
   - Reaproveita `ASAAS_API_KEY` e o `asaas_customer_id` já existente.
   - Em caso de assinatura sem Asaas (trial/legacy), apenas registra o slot e marca `metadata.pending_billing = true` para cobrança manual posterior.
4. Incrementar `sst_managers.extra_company_slots += 1`.
5. Inserir registro em `sst_extra_slot_purchases`.
6. Retornar `{ success: true, new_limit, next_charge_date }`.

### 3. Frontend

**`AddCompanyDialog.tsx` (SST)** — substituir o toast destrutivo do bloco `if (plan.max_companies && currCompanies >= plan.max_companies)` por:
- Fechar o formulário e abrir um novo `<UpgradeSlotDialog />` (AlertDialog).

**Novo `src/components/sst/UpgradeSlotDialog.tsx`:**
- Título: "Limite de empresas atingido"
- Mensagem:
  > Você já cadastrou {currCompanies} de {limit} empresas do seu plano.  
  > Deseja contratar **mais 1 slot de empresa**?  
  > Será cobrado o valor de **R$ 19,90/mês** na sua próxima fatura.
- Botões: "Cancelar" / "Contratar slot adicional"
- Ao confirmar: invoca `purchase-extra-company-slot`, mostra toast de sucesso ("Slot liberado! Continue o cadastro da empresa."), atualiza limites locais (refetch do hook `useSubscriptionLimits`/contador) e reabre o `AddCompanyDialog` com os campos preenchidos preservados.

**`SSTCompanyCounter.tsx`** — mostrar `currentCount / (max + extras)` e um pequeno badge "+N slots extras" quando `extra_company_slots > 0`.

**`useSubscriptionLimits.ts`** — somar `sst_managers.extra_company_slots` em `maxCompanies` para a categoria `manager`.

### 4. Painel Master (opcional rápido)

Listar `sst_extra_slot_purchases` em uma aba dentro de `MasterDashboard` (apenas leitura) para acompanhamento de receita extra.

### Fluxo do usuário

```
Gestora clica "Adicionar Empresa"
        ↓
Preenche formulário → submit
        ↓
Limite atingido?
   ├─ Não → cadastro normal
   └─ Sim → Dialog "Contratar slot extra (R$19,90/mês)"
              ├─ Cancelar → fecha
              └─ Confirmar → edge function
                                 ↓
                         Asaas cria sub recorrente
                         + extra_company_slots++
                                 ↓
                         Reabre AddCompanyDialog
                                 ↓
                         Usuário clica "Cadastrar" → sucesso
```

### Fora de escopo

- Cancelamento self-service de slots (futuramente botão "Reduzir slots" listando os ativos).
- Descontos por compra de múltiplos slots de uma vez (mantemos 1 por clique).
- Cobrança proporcional (pro-rata) — usaremos sempre a próxima fatura cheia.
