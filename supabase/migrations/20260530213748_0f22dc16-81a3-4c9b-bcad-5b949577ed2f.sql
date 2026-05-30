CREATE OR REPLACE FUNCTION public.has_pgr_module(_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    has_role(_user_id, 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.sst_managers sm ON sm.id = p.sst_manager_id
      WHERE p.id = _user_id AND sm.pgr_module_enabled = true
    )
    OR EXISTS (
      SELECT 1 FROM public.user_sst_managers usm
      JOIN public.sst_managers sm ON sm.id = usm.sst_manager_id
      WHERE usm.user_id = _user_id AND sm.pgr_module_enabled = true
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.company_sst_assignments csa ON csa.company_id = p.company_id
      JOIN public.sst_managers sm ON sm.id = csa.sst_manager_id
      WHERE p.id = _user_id AND sm.pgr_module_enabled = true
    )
    OR EXISTS (
      SELECT 1 FROM public.user_companies uc
      JOIN public.company_sst_assignments csa ON csa.company_id = uc.company_id
      JOIN public.sst_managers sm ON sm.id = csa.sst_manager_id
      WHERE uc.user_id = _user_id AND sm.pgr_module_enabled = true
    )
    -- Empresa em plano com PGR habilitado (Empresa SMS Starter/Corporate)
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.companies c ON c.id = p.company_id
      JOIN public.subscriptions s ON s.id = c.parent_subscription_id
      JOIN public.subscription_plans sp ON sp.id = s.plan_id
      WHERE p.id = _user_id AND sp.pgr_enabled = true
    )
    OR EXISTS (
      SELECT 1 FROM public.user_companies uc
      JOIN public.companies c ON c.id = uc.company_id
      JOIN public.subscriptions s ON s.id = c.parent_subscription_id
      JOIN public.subscription_plans sp ON sp.id = s.plan_id
      WHERE uc.user_id = _user_id AND sp.pgr_enabled = true
    );
$function$;