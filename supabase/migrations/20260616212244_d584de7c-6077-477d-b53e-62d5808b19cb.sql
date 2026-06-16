
CREATE OR REPLACE FUNCTION public.company_has_smart_ouvidoria(_company_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    _company_id = '382745b1-d65a-4928-bb1b-95ae513c4e14'::uuid
    OR EXISTS (
      SELECT 1 FROM public.company_sst_assignments csa
      JOIN public.profiles p ON p.sst_manager_id = csa.sst_manager_id
      JOIN public.subscriptions s ON s.owner_user_id = p.id
      JOIN public.subscription_plans sp ON sp.id = s.plan_id
      WHERE csa.company_id = _company_id AND sp.slug = 'sst-smart'
        AND s.status IN ('active'::subscription_status_enum,'trial'::subscription_status_enum,'trialing'::subscription_status_enum)
    )
    OR EXISTS (
      SELECT 1 FROM public.companies c
      JOIN public.subscriptions s ON s.id = c.parent_subscription_id
      JOIN public.subscription_plans sp ON sp.id = s.plan_id
      WHERE c.id = _company_id AND sp.slug = 'sst-smart'
        AND s.status IN ('active'::subscription_status_enum,'trial'::subscription_status_enum,'trialing'::subscription_status_enum)
    );
$$;
GRANT EXECUTE ON FUNCTION public.company_has_smart_ouvidoria(uuid) TO authenticated, anon, service_role;

CREATE OR REPLACE FUNCTION public.beta_ouvidoria_only_demo()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.company_has_smart_ouvidoria(NEW.company_id) THEN
    RAISE EXCEPTION 'Canal Ouvidoria Smart disponível apenas para empresas autorizadas';
  END IF;
  RETURN NEW;
END;
$$;
