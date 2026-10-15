INSERT INTO public.subscription_plans (name, slug, category, tier, visibility, max_companies, max_employees, min_employees, base_price_cents, price_per_employee_cents, price_monthly_cents, ai_enabled, ouvidoria_enabled, pgr_enabled, create_company_login, is_active, features)
VALUES ('Gestora SST Ouvidoria', 'sst-ouvidoria', 'manager', 'sst_ouvidoria', 'manual_only', 2, 200, 1, 36000, 0, 36000, true, true, false, true, true, '[]'::jsonb)
ON CONFLICT (slug) DO NOTHING;

CREATE OR REPLACE FUNCTION public.user_has_ouvidoria_only_plan(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.subscriptions s
    JOIN public.subscription_plans p ON p.id = s.plan_id
    WHERE p.slug = 'sst-ouvidoria'
      AND s.status IN ('active','trial','trialing','pending')
      AND (s.owner_user_id = _user_id OR s.owner_user_id IN (
        SELECT pr2.id FROM public.profiles pr1 JOIN public.profiles pr2 ON pr2.sst_manager_id = pr1.sst_manager_id
        WHERE pr1.id = _user_id AND pr1.sst_manager_id IS NOT NULL))
  )
$$;
GRANT EXECUTE ON FUNCTION public.user_has_ouvidoria_only_plan(uuid) TO authenticated;