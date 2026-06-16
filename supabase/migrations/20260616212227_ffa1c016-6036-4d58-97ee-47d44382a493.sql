
ALTER TYPE subscription_status_enum ADD VALUE IF NOT EXISTS 'trial';
ALTER TYPE subscription_status_enum ADD VALUE IF NOT EXISTS 'trialing';

ALTER TABLE public.subscription_plans DROP CONSTRAINT IF EXISTS subscription_plans_visibility_check;
ALTER TABLE public.subscription_plans
  ADD CONSTRAINT subscription_plans_visibility_check
  CHECK (visibility IN ('public','hotmart_only','manual_only','hidden'));

INSERT INTO public.subscription_plans (
  slug, name, category, tier, visibility,
  base_price_cents, price_per_employee_cents,
  price_annual_cents, price_monthly_cents,
  min_employees, max_employees, max_companies, max_cnpjs,
  ai_enabled, ouvidoria_enabled, pgr_enabled, create_company_login,
  is_active, display_order, features
) VALUES (
  'sst-smart','SST Smart','manager','sst_smart','manual_only',
  24990, 0, 24990, NULL,
  0, 3000, 30, NULL,
  false, false, true, true,
  true, 100,
  '["Levantamento HSE-IT","Levantamento COPSOQ","Pesquisa de Clima","Emissão de PGR","Ouvidoria Smart (formulário)","Pulse Survey"]'::jsonb
)
ON CONFLICT (slug) DO UPDATE SET
  name=EXCLUDED.name, category=EXCLUDED.category, tier=EXCLUDED.tier,
  visibility=EXCLUDED.visibility, price_annual_cents=EXCLUDED.price_annual_cents,
  ai_enabled=false, ouvidoria_enabled=false, pgr_enabled=true,
  is_active=true, features=EXCLUDED.features;
