
-- 1. Novas colunas em subscription_plans
ALTER TABLE public.subscription_plans
  ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'public',
  ADD COLUMN IF NOT EXISTS ai_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS ouvidoria_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS create_company_login boolean NOT NULL DEFAULT true;

ALTER TABLE public.subscription_plans
  ADD CONSTRAINT subscription_plans_visibility_check
  CHECK (visibility IN ('public','hotmart_only'));

-- 2. Inserir os 5 planos SMS
INSERT INTO public.subscription_plans
  (slug, name, category, tier, min_employees, max_employees, max_companies, base_price_cents,
   price_monthly_cents, visibility, ai_enabled, ouvidoria_enabled, create_company_login,
   features, display_order, is_active)
VALUES
  ('tecnico-sst-sms', 'Técnico SST SMS', 'manager', 'sms', 1, 3000, 30, 24990,
   24990, 'hotmart_only', false, false, false,
   '["Levantamento HSE-IT","Levantamento COPSOQ","Pesquisa de Clima","Emissão de PGR"]'::jsonb, 100, true),
  ('gestora-sst-sms-basic', 'Gestora SST SMS Basic', 'manager', 'sms', 1, 1000, 10, 49900,
   49900, 'hotmart_only', false, false, true,
   '["HSE-IT","COPSOQ","Clima","PGR","Login por empresa"]'::jsonb, 101, true),
  ('gestora-sst-sms-pro', 'Gestora SST SMS Pro', 'manager', 'sms', 1, 3000, 30, 59900,
   59900, 'hotmart_only', false, false, true,
   '["HSE-IT","COPSOQ","Clima","PGR","Login por empresa"]'::jsonb, 102, true),
  ('empresa-sms-starter', 'Empresa SMS Starter', 'company', 'sms', 1, 49, 1, 14990,
   14990, 'hotmart_only', false, false, true,
   '["HSE-IT","COPSOQ","Clima","PGR"]'::jsonb, 103, true),
  ('empresa-sms-corporate', 'Empresa SMS Corporate', 'company', 'sms', 1, 99, 1, 24990,
   24990, 'hotmart_only', false, false, true,
   '["HSE-IT","COPSOQ","Clima","PGR"]'::jsonb, 104, true)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  visibility = EXCLUDED.visibility,
  ai_enabled = EXCLUDED.ai_enabled,
  ouvidoria_enabled = EXCLUDED.ouvidoria_enabled,
  create_company_login = EXCLUDED.create_company_login,
  max_employees = EXCLUDED.max_employees,
  max_companies = EXCLUDED.max_companies,
  price_monthly_cents = EXCLUDED.price_monthly_cents,
  base_price_cents = EXCLUDED.base_price_cents;

-- 3. Tabela de preços de upgrade
CREATE TABLE IF NOT EXISTS public.plan_upgrade_pricing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES public.subscription_plans(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('company','employee')),
  unit_price_cents integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (plan_id, kind)
);

GRANT SELECT ON public.plan_upgrade_pricing TO authenticated;
GRANT ALL ON public.plan_upgrade_pricing TO service_role;

ALTER TABLE public.plan_upgrade_pricing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view upgrade pricing"
  ON public.plan_upgrade_pricing FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Admins manage upgrade pricing"
  ON public.plan_upgrade_pricing FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Popular preços de upgrade
INSERT INTO public.plan_upgrade_pricing (plan_id, kind, unit_price_cents)
SELECT id, 'company', 800 FROM public.subscription_plans WHERE slug = 'tecnico-sst-sms'
UNION ALL SELECT id, 'employee', 8 FROM public.subscription_plans WHERE slug = 'tecnico-sst-sms'
UNION ALL SELECT id, 'company', 1990 FROM public.subscription_plans WHERE slug IN ('gestora-sst-sms-basic','gestora-sst-sms-pro')
UNION ALL SELECT id, 'employee', 19 FROM public.subscription_plans WHERE slug IN ('gestora-sst-sms-basic','gestora-sst-sms-pro')
UNION ALL SELECT id, 'employee', 230 FROM public.subscription_plans WHERE slug IN ('empresa-sms-starter','empresa-sms-corporate')
UNION ALL SELECT id, 'company', 1990 FROM public.subscription_plans WHERE slug IN ('gestor_basic','gestor_pro')
ON CONFLICT (plan_id, kind) DO UPDATE SET unit_price_cents = EXCLUDED.unit_price_cents;

-- 4. Extra employee slots
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS extra_employee_slots integer NOT NULL DEFAULT 0;

ALTER TABLE public.sst_managers
  ADD COLUMN IF NOT EXISTS extra_employee_slots integer NOT NULL DEFAULT 0;

-- 5. has_ai_access function
CREATE OR REPLACE FUNCTION public.has_ai_access(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT sp.ai_enabled
      FROM public.subscriptions s
      JOIN public.subscription_plans sp ON sp.id = s.plan_id
      WHERE s.owner_user_id = _user_id
        AND s.status = 'active'
      ORDER BY s.created_at DESC
      LIMIT 1
    ),
    -- fallback: empresa do usuário
    (
      SELECT sp.ai_enabled
      FROM public.profiles p
      JOIN public.companies c ON c.id = p.company_id
      JOIN public.subscriptions s ON s.id = c.parent_subscription_id
      JOIN public.subscription_plans sp ON sp.id = s.plan_id
      WHERE p.id = _user_id
      LIMIT 1
    ),
    -- fallback: gestora SST do usuário
    (
      SELECT sp.ai_enabled
      FROM public.profiles p
      JOIN public.subscriptions s ON s.owner_user_id IN (
        SELECT id FROM public.profiles WHERE sst_manager_id = p.sst_manager_id
      )
      JOIN public.subscription_plans sp ON sp.id = s.plan_id
      WHERE p.id = _user_id AND s.status = 'active'
      LIMIT 1
    ),
    true
  );
$$;

GRANT EXECUTE ON FUNCTION public.has_ai_access(uuid) TO authenticated, anon, service_role;
