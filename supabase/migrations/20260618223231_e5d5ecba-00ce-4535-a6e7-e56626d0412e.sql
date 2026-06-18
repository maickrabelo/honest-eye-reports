-- 1. Add trial_days column to subscription_plans
ALTER TABLE public.subscription_plans
  ADD COLUMN IF NOT EXISTS trial_days integer;

ALTER TABLE public.subscription_plans
  ADD COLUMN IF NOT EXISTS trial_redirect_url text;

-- 2. Create the new "Teste SMS" plan (manager category, SMS tier, 7-day trial mirroring Gestor Pro SMS features)
INSERT INTO public.subscription_plans (
  name, slug, category, tier, min_employees, max_employees, max_companies,
  base_price_cents, price_monthly_cents,
  features, is_active, visibility,
  ai_enabled, ouvidoria_enabled, pgr_enabled, create_company_login,
  display_order, trial_days, trial_redirect_url
) VALUES (
  'Teste SMS',
  'teste-sms',
  'manager',
  'sms',
  1, 3000, 30,
  0, 0,
  '["Teste de 7 dias","HSE-IT","COPSOQ","Clima","Burnout","PGR","Login por empresa"]'::jsonb,
  true,
  'hotmart_only',
  false,
  false,
  true,
  true,
  150,
  7,
  'https://prgnovoplano.manus.space/'
)
ON CONFLICT (slug) DO UPDATE SET
  trial_days = EXCLUDED.trial_days,
  trial_redirect_url = EXCLUDED.trial_redirect_url,
  features = EXCLUDED.features,
  is_active = true;

-- 3. Remap hotmart product 1336498 to the new Teste SMS plan
UPDATE public.hotmart_product_plans
SET plan_id = (SELECT id FROM public.subscription_plans WHERE slug = 'teste-sms'),
    notes = 'Teste SMS (7 dias) - Hotmart'
WHERE hotmart_product_id = '1336498';