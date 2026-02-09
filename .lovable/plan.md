

# Estrutura de Contas Trial (7 dias de teste)

## Resumo
Criar um fluxo completo de contas Trial que permite empresas testarem a plataforma por 7 dias sem necessidade de pagamento. Ao final do periodo, a conta e desativada automaticamente e o usuario e direcionado para contratar um plano.

## Como vai funcionar

1. **Novo botao na landing page e na pagina comercial**: "Teste gratis por 7 dias"
2. **Formulario de cadastro simplificado**: Nome da empresa, email, nome do responsavel e numero de colaboradores (sem CNPJ obrigatorio, sem pagamento)
3. **Edge function cria a conta Trial**: Cria empresa, usuario, perfil e subscription com status "trial" e data de expiracao (7 dias)
4. **Email de boas-vindas**: Envia credenciais de acesso por email
5. **Verificacao de trial expirado**: No login e no dashboard, verifica se o trial expirou e mostra aviso/bloqueia acesso
6. **Banner de trial ativo**: Mostra no dashboard quantos dias restam do teste

## Detalhes tecnicos

### 1. Migracao de banco de dados

Adicionar o valor `trial` ao enum de status da subscription e garantir que o campo `current_period_end` seja usado como data de expiracao do trial.

```sql
-- Permitir status 'trial' na tabela subscriptions (ja aceita texto livre)
-- Nenhuma alteracao de schema necessaria, pois o campo status e do tipo text

-- Adicionar coluna trial_ends_at na tabela companies para facilitar consultas
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS trial_ends_at timestamp with time zone;
```

### 2. Nova edge function: `create-trial-account`

Recebe os dados basicos da empresa e:
- Cria a empresa com `subscription_status = 'trial'` e `trial_ends_at = now() + 7 dias`
- Cria o usuario com senha temporaria
- Atualiza perfil com `company_id`
- Atualiza role para `company`
- Cria registro na tabela `subscriptions` com `status = 'trial'`
- Envia email de boas-vindas com credenciais

### 3. Nova pagina: `TrialSignup.tsx` (rota `/teste-gratis`)

Formulario simplificado com:
- Nome da empresa
- Email
- Nome do responsavel
- Telefone (opcional)
- Numero de colaboradores (slider ou input)
- Botao "Iniciar teste gratis"

### 4. Componente `TrialBanner.tsx`

Banner que aparece no Dashboard quando a conta e trial:
- Mostra "Voce esta no periodo de teste. Restam X dias."
- Botao "Contratar agora" que leva para `/contratar`
- Muda de cor conforme os dias restam (verde > amarelo > vermelho)

### 5. Verificacao de trial expirado

No `RealAuthContext.tsx`:
- Apos carregar o perfil, verificar se `trial_ends_at` existe e se ja passou
- Se expirou, setar um flag `isTrialExpired` no contexto
- No Dashboard, se `isTrialExpired`, mostrar tela de "Trial expirado" com botao para contratar

No `Dashboard.tsx`:
- Se trial expirado, renderizar overlay/modal impedindo uso e direcionando para contratacao

### 6. Atualizacoes na landing page

- Adicionar botao "Teste gratis por 7 dias" no HeroSection
- Adicionar botao similar no PricingSection
- Nova rota `/teste-gratis` no App.tsx

### Arquivos criados
- `supabase/functions/create-trial-account/index.ts` -- edge function para criar conta trial
- `src/pages/TrialSignup.tsx` -- pagina de cadastro trial
- `src/components/TrialBanner.tsx` -- banner de aviso do trial no dashboard
- `src/components/TrialExpiredOverlay.tsx` -- overlay quando trial expira

### Arquivos editados
- `src/App.tsx` -- adicionar rota `/teste-gratis`
- `src/contexts/RealAuthContext.tsx` -- adicionar `isTrialExpired` e `trialEndsAt` ao contexto
- `src/pages/Dashboard.tsx` -- renderizar TrialBanner e TrialExpiredOverlay
- `src/components/landing/HeroSection.tsx` -- adicionar botao de teste gratis
- `src/components/commercial/PricingSection.tsx` -- adicionar botao de teste gratis
- `supabase/config.toml` -- configurar `verify_jwt = false` para a nova function

