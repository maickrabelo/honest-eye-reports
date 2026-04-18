-- 1) Estender subscription_plans com novas colunas
ALTER TABLE public.subscription_plans
  ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'company',
  ADD COLUMN IF NOT EXISTS tier text,
  ADD COLUMN IF NOT EXISTS max_companies integer,
  ADD COLUMN IF NOT EXISTS max_cnpjs integer,
  ADD COLUMN IF NOT EXISTS price_monthly_cents integer,
  ADD COLUMN IF NOT EXISTS price_quarterly_cents integer,
  ADD COLUMN IF NOT EXISTS price_annual_cents integer,
  ADD COLUMN IF NOT EXISTS is_custom_quote boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS roi_initial_cents integer,
  ADD COLUMN IF NOT EXISTS roi_monthly_cents integer,
  ADD COLUMN IF NOT EXISTS display_order integer NOT NULL DEFAULT 0;

-- 2) Limpar planos existentes (vamos repopular)
DELETE FROM public.subscription_plans;

-- 3) Inserir os 5 novos planos
INSERT INTO public.subscription_plans
  (slug, name, category, tier, min_employees, max_employees, max_companies, max_cnpjs,
   base_price_cents, price_monthly_cents, price_quarterly_cents, price_annual_cents,
   is_custom_quote, is_active, display_order, features, roi_initial_cents, roi_monthly_cents)
VALUES
  ('starter', 'Starter', 'company', 'starter', 1, 49, 1, 1,
    14990, 24990, 19990, 14990,
    false, true, 1,
    '["Até 1 empresa","Até 49 colaboradores","Canal de denúncias anônimo","Avaliações de risco psicossocial","Pesquisa de clima","Treinamentos","Suporte por email"]'::jsonb,
    NULL, NULL),
  ('corporate', 'Corporate', 'company', 'corporate', 1, 100, 1, 5,
    24990, 34990, 29990, 24990,
    false, true, 2,
    '["1 empresa com até 5 CNPJs","Até 100 colaboradores no total","Trafegue entre os CNPJs com 1 acesso","Tudo do plano Starter","Suporte prioritário"]'::jsonb,
    NULL, NULL),
  ('business_pro', 'Business Pro', 'company', 'business_pro', 101, NULL, NULL, NULL,
    0, NULL, NULL, NULL,
    true, true, 3,
    '["Mais de 5 CNPJs","Mais de 100 colaboradores","Customização total","Onboarding dedicado","Atendimento sob demanda"]'::jsonb,
    NULL, NULL),
  ('gestor_basic', 'Gestor Basic', 'manager', 'gestor_basic', 1, 1000, 10, NULL,
    49990, 79990, 69990, 49990,
    false, true, 10,
    '["Até 10 empresas","Até 1.000 colaboradores no total","Levantamento de Riscos Psicossociais + PGR","Ouvidoria contínua","Dashboard centralizado","Suporte prioritário"]'::jsonb,
    4500000, 350000),
  ('gestor_pro', 'Gestor Pro', 'manager', 'gestor_pro', 1, 3000, 30, NULL,
    59990, 89990, 79990, 59990,
    false, true, 11,
    '["Até 30 empresas","Até 3.000 colaboradores no total","Tudo do Gestor Basic","White label","Onboarding personalizado"]'::jsonb,
    13500000, 1050000),
  ('gestor_master', 'Gestor Master', 'manager', 'gestor_master', 1, NULL, NULL, NULL,
    0, NULL, NULL, NULL,
    true, true, 12,
    '["Acima de 30 empresas","Colaboradores ilimitados","Gerente de conta dedicado","SLA garantido","Customização total"]'::jsonb,
    NULL, NULL);

-- 4) Criar enum de status da assinatura (se ainda não existir)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_status_enum') THEN
    CREATE TYPE public.subscription_status_enum AS ENUM ('pending','active','past_due','canceled','expired');
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'billing_cycle_enum') THEN
    CREATE TYPE public.billing_cycle_enum AS ENUM ('monthly','quarterly','annual');
  END IF;
END$$;

-- 5) Recriar tabela subscriptions (ajuste para Asaas)
DROP TABLE IF EXISTS public.subscriptions CASCADE;

CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  owner_email text NOT NULL,
  plan_id uuid NOT NULL REFERENCES public.subscription_plans(id),
  billing_cycle public.billing_cycle_enum NOT NULL DEFAULT 'monthly',
  status public.subscription_status_enum NOT NULL DEFAULT 'pending',
  asaas_customer_id text,
  asaas_subscription_id text,
  asaas_payment_id text,
  invoice_url text,
  amount_cents integer NOT NULL,
  current_period_start timestamptz,
  current_period_end timestamptz,
  next_charge_date timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_subscriptions_owner ON public.subscriptions(owner_user_id);
CREATE INDEX idx_subscriptions_email ON public.subscriptions(owner_email);
CREATE INDEX idx_subscriptions_asaas_customer ON public.subscriptions(asaas_customer_id);
CREATE INDEX idx_subscriptions_asaas_payment ON public.subscriptions(asaas_payment_id);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own subscription"
  ON public.subscriptions FOR SELECT
  USING (owner_user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins manage all subscriptions"
  ON public.subscriptions FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 6) Coluna parent_subscription_id em companies (agrupa CNPJs sob 1 assinatura Corporate)
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS parent_subscription_id uuid REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS legacy_plan boolean NOT NULL DEFAULT false;

-- Marcar empresas existentes como legacy
UPDATE public.companies SET legacy_plan = true WHERE created_at < now();