

## Refatoração da Landing Page + Separação de Planos + Trial Universal

### 1. Landing page — novo layout inspirado na referência

Refatorar a home (`src/pages/Index.tsx`) e seções para um visual mais editorial, com foco em conversão B2B. Inspiração: hero com proposta de valor direta sobre NR-01, blocos com prova social, ícones grandes e CTAs duplos (teste grátis + demo).

**Seções na nova ordem:**
1. **HeroSection** (reescrita) — Headline curta "Gestão de Riscos Psicossociais conforme a NR-01", subtítulo focado em conformidade, dois CTAs lado a lado: "Começar teste grátis" (primário) e "Falar com especialista" (WhatsApp). Remover ilustração lateral pesada; usar mockup do dashboard ou gradiente limpo. Stats abaixo do hero.
2. **PainPointsSection** (mantida com ajustes de copy) — "Por que sua empresa precisa agir agora?" com 3 dores: multas NR-01, afastamentos por saúde mental, custo de turnover.
3. **FeaturesSection** (mantida) — Grid de funcionalidades.
4. **HowItWorksSection** (mantida) — 3-4 passos.
5. **BenefitsSection** (mantida) — Benefícios para o negócio.
6. **SSTHighlightSection** — **REMOVER** (bloco "Tem empresa de SST...").
7. **PricingSection** (refatorada — ver item 2).
8. **FAQSection** (mantida).
9. **CTASection** (mantida).

### 2. PricingSection — duas faixas separadas

Substituir as `Tabs` (Empresa / Gestor) por **duas seções verticais empilhadas**, uma logo abaixo da outra:

```
┌─────────────────────────────────────────────┐
│  FAIXA 1 — "Para sua empresa"               │
│  Subtítulo: cuide da saúde mental do time   │
│  [Toggle Mensal/Trimestral/Anual]           │
│  [Card 1] [Card 2] [Card 3]                 │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  FAIXA 2 — "Para gestores SST"              │
│  Subtítulo: atenda múltiplas empresas       │
│  [Toggle Mensal/Trimestral/Anual]           │
│  [Card 1] [Card 2] [Card 3]                 │
└─────────────────────────────────────────────┘
```

Cada faixa terá fundo levemente diferente (a primeira `bg-background`, a segunda `bg-muted/30`) para separação visual. Cada uma com seu próprio toggle de ciclo.

### 3. Botão "Teste grátis" em destaque em todos os planos

Em **cada card de plano** (empresa e gestor), adicionar acima do botão "Contratar agora" um botão secundário em destaque:

```
[ 🎁 Começar teste grátis de 7 dias ]   ← destaque (primário, full width)
[ Contratar agora ]                      ← secundário
```

- Plano de **gestor SST** → "Teste grátis" leva para `/teste-gratis-sst` (já existe).
- Plano de **empresa** → "Teste grátis" leva para nova rota `/teste-gratis-empresa` (ver item 4).

Para planos `is_custom_quote` (sob demanda), não exibir o botão de teste grátis.

### 4. Trial para empresa final (sem dados fictícios)

**Nova rota: `/teste-gratis-empresa`**
- Página `src/pages/CompanyTrialSignup.tsx` espelhada na `SSTTrialSignup.tsx`, com formulário de cadastro (nome empresa, CNPJ, e-mail, senha, telefone, nº colaboradores).
- Submit chama nova edge function `create-company-trial-account` que:
  - Cria usuário Supabase com role `company`
  - Cria registro em `companies` vinculado ao usuário
  - **NÃO** cria SST manager nem assignment (empresa fica "solta" → ganha acesso direto às ferramentas via `useCompanyHasSST`)
  - **NÃO** popula dados fictícios (relatórios, avaliações, etc.)
  - Define `trial_expires_at` = +7 dias
  - Habilita todos os módulos (`company_feature_access`: psicossocial, burnout, clima, ouvidoria, treinamentos)

**Onboarding tour** — A empresa ao entrar pela primeira vez vê o tour guiado (mesmo padrão de `useOnboarding` + `OnboardingTour`). Criar nova variante de tour focada nas ferramentas da empresa:
- Passo 1: "Bem-vinda! Você tem 7 dias para testar"
- Passo 2: Card "Ouvidoria" — receba denúncias anônimas
- Passo 3: Card "Riscos Psicossociais" — aplique HSE-IT/COPSOQ
- Passo 4: Card "Burnout" — avalie esgotamento
- Passo 5: Card "Pesquisa de Clima"
- Passo 6: Card "Treinamentos"

A flag `tour_variant` no perfil distingue `sst` vs `company` para servir o tour correto.

**TrialBanner / TrialExpiredOverlay** — Já funcionam por `trial_expires_at`; revisar para garantir que aparecem no Dashboard de empresa também.

### 5. Registro da edge function

Adicionar bloco em `supabase/config.toml` para `create-company-trial-account` com `verify_jwt = false`.

### 6. Atualização do Hero CTA

No `HeroSection`, o botão "Gestora SST? Teste grátis" vira **dois botões** lado a lado:
- "Empresa? Teste grátis" → `/teste-gratis-empresa`
- "Gestora SST? Teste grátis" → `/teste-gratis-sst`

E um terceiro link discreto abaixo: "Ver demonstração" (WhatsApp).

### Resumo técnico
- **Removido**: `SSTHighlightSection` da home.
- **Refatorado**: `HeroSection.tsx` (copy + CTAs), `PricingSection.tsx` (duas faixas + botões trial), `Index.tsx` (ordem das seções).
- **Criado**: `src/pages/CompanyTrialSignup.tsx`, edge function `supabase/functions/create-company-trial-account/index.ts`, variante de tour para empresa em `OnboardingTour.tsx` / `useOnboarding.ts`.
- **Rota nova** em `App.tsx`: `/teste-gratis-empresa`.
- **Migration**: adicionar coluna `tour_variant text default 'sst'` em `profiles` (ou reaproveitar lógica existente baseada em role).
- **config.toml**: registrar nova edge function.

