

## Bloqueio pós-trial com exibição contextual de planos

### Comportamento

Quando o trial de 7 dias expirar (`trial_expires_at < now()` e ainda sem assinatura ativa), o sistema bloqueia o acesso ao app e exibe um overlay full-screen com os planos disponíveis:

- **Empresa final** (role `company`, sem `sst_manager_id` no perfil) → mostra apenas os 3 planos da categoria `company`.
- **Gestora SST** (role `sst`) → mostra apenas os planos da categoria `manager`.

O overlay é não-dispensável (sem botão fechar). Único caminho: contratar um plano ou sair (logout).

### 1. Refatoração do `TrialExpiredOverlay`

`src/components/TrialExpiredOverlay.tsx` — atualmente bloqueia genericamente. Será reescrito para:

- Detectar a categoria do usuário (`company` vs `manager`) via `useAuth()` + perfil.
- Buscar `subscription_plans` ativos da categoria correspondente (mesma query do `PricingSection`).
- Renderizar em modal full-screen:
  - Header: "Seu período de teste de 7 dias terminou"
  - Subheader contextual ("Escolha um plano para continuar usando a SOIA" / "Escolha um plano de gestor para continuar atendendo seus clientes")
  - Toggle Mensal/Trimestral/Anual
  - Grid com 3 cards de plano (reusando a mesma estrutura visual do `PricingSection`)
  - Cada card com botão "Contratar agora" → `/contratar?plano={slug}&ciclo={cycle}`
  - Rodapé com link discreto "Sair" (logout) e "Falar com consultor" (WhatsApp)

### 2. Hook unificado `useTrialStatus`

Novo hook `src/hooks/useTrialStatus.ts` que centraliza a lógica de verificação:

```ts
// Retorna: { isTrialExpired, daysLeft, category, isLoading, hasActiveSubscription }
```

- Lê `companies.trial_expires_at` (para empresas) ou `sst_managers.trial_expires_at` (para gestoras).
- Verifica se há assinatura ativa em `subscriptions` (via `owner_user_id`).
- Determina `category` pelo role + perfil.
- Se assinatura ativa existir, **nunca** bloqueia (mesmo após `trial_expires_at`).

### 3. Integração nos dashboards

Aplicar o overlay em:
- `src/pages/Dashboard.tsx` (empresa)
- `src/pages/SSTDashboard.tsx` (gestora SST)

Padrão:
```tsx
const { isTrialExpired, category, isLoading } = useTrialStatus();
// ...
{isTrialExpired && <TrialExpiredOverlay category={category} />}
```

O overlay cobre toda a tela (z-index alto), impedindo interação com o resto da UI. O `TrialBanner` continua aparecendo nos últimos 3 dias antes da expiração.

### 4. Bloqueio nas rotas internas

Para evitar que o usuário acesse rotas profundas digitando URL diretamente, adicionar verificação no `App.tsx` (ou em wrapper de rota privada): se `isTrialExpired && !hasActiveSubscription`, redirecionar todas as rotas autenticadas para `/dashboard` ou `/sst-dashboard`, onde o overlay irá bloquear.

Alternativa mais leve: incluir o overlay no layout raiz das rotas autenticadas via componente `<TrialGuard>` que envolve `<Outlet />`.

### 5. Pós-pagamento

Após contratar (fluxo `/contratar` → checkout → webhook Asaas/Stripe cria registro em `subscriptions` com `status='active'`), o `useTrialStatus` deixa de retornar `isTrialExpired=true` no próximo refetch e o overlay some automaticamente.

### Resumo técnico
- **Criado**: `src/hooks/useTrialStatus.ts`.
- **Refatorado**: `src/components/TrialExpiredOverlay.tsx` (recebe `category`, busca planos, renderiza grid).
- **Editado**: `src/pages/Dashboard.tsx` e `src/pages/SSTDashboard.tsx` (integração do hook + overlay).
- **Editado**: `src/App.tsx` (guard global opcional para redirecionar rotas profundas).
- Nenhuma migration necessária — toda a lógica usa tabelas e campos já existentes (`trial_expires_at`, `subscriptions`, `subscription_plans`).

