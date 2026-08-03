ALTER TABLE public.subscription_plans DROP CONSTRAINT IF EXISTS subscription_plans_visibility_check;
ALTER TABLE public.subscription_plans ADD CONSTRAINT subscription_plans_visibility_check
  CHECK (visibility IN ('public','manual_only','hotmart_only','ouvidoria_only'));

INSERT INTO public.subscription_plans (
  slug, name, category, visibility, is_active, is_custom_quote,
  ai_enabled, ouvidoria_enabled, pgr_enabled,
  max_companies, min_employees, max_employees, max_cnpjs, base_price_cents,
  price_monthly_cents, price_quarterly_cents, price_annual_cents,
  display_order, features
) VALUES
(
  'ouvidoria', 'Ouvidoria', 'company', 'ouvidoria_only', true, false,
  true, true, false,
  1, 1, 50, 1, 9900,
  9900, NULL, NULL,
  200,
  '["Canal de denúncias com IA (SOnIA)","Triagem e classificação automática","Até 50 colaboradores","Anonimato garantido (LGPD)","Protocolo e acompanhamento do relato","Painel de gestão das denúncias"]'::jsonb
),
(
  'ouvidoria-smart', 'Ouvidoria Smart', 'company', 'ouvidoria_only', true, false,
  false, true, false,
  1, 1, 50, 1, 3990,
  3990, NULL, NULL,
  201,
  '["Canal de denúncias por formulário anônimo","Protocolo + chave de acesso para acompanhar","Até 50 colaboradores","Anonimato garantido (LGPD)","Painel de gestão das denúncias","Sem inteligência artificial"]'::jsonb
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  visibility = EXCLUDED.visibility,
  is_active = EXCLUDED.is_active,
  ai_enabled = EXCLUDED.ai_enabled,
  ouvidoria_enabled = EXCLUDED.ouvidoria_enabled,
  pgr_enabled = EXCLUDED.pgr_enabled,
  max_companies = EXCLUDED.max_companies,
  min_employees = EXCLUDED.min_employees,
  base_price_cents = EXCLUDED.base_price_cents,
  max_employees = EXCLUDED.max_employees,
  max_cnpjs = EXCLUDED.max_cnpjs,
  price_monthly_cents = EXCLUDED.price_monthly_cents,
  display_order = EXCLUDED.display_order,
  features = EXCLUDED.features;

CREATE OR REPLACE FUNCTION public.company_has_smart_ouvidoria(_company_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    _company_id = '382745b1-d65a-4928-bb1b-95ae513c4e14'::uuid
    OR EXISTS (
      SELECT 1 FROM public.company_sst_assignments csa
      JOIN public.profiles p ON p.sst_manager_id = csa.sst_manager_id
      JOIN public.subscriptions s ON s.owner_user_id = p.id
      JOIN public.subscription_plans sp ON sp.id = s.plan_id
      WHERE csa.company_id = _company_id AND sp.slug IN ('sst-smart','ouvidoria-smart')
        AND s.status IN ('active'::subscription_status_enum,'trial'::subscription_status_enum,'trialing'::subscription_status_enum)
    )
    OR EXISTS (
      SELECT 1 FROM public.companies c
      JOIN public.subscriptions s ON s.id = c.parent_subscription_id
      JOIN public.subscription_plans sp ON sp.id = s.plan_id
      WHERE c.id = _company_id AND sp.slug IN ('sst-smart','ouvidoria-smart')
        AND s.status IN ('active'::subscription_status_enum,'trial'::subscription_status_enum,'trialing'::subscription_status_enum)
    );
$function$;