CREATE OR REPLACE FUNCTION public.user_has_pgr_shortcut_plan(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN public.subscriptions s ON s.owner_user_id = p.id
    JOIN public.subscription_plans sp ON sp.id = s.plan_id
    WHERE p.id = _user_id
      AND sp.pgr_enabled = true
      AND sp.ai_enabled = false
      AND s.status IN ('active'::subscription_status_enum,'trial'::subscription_status_enum,'trialing'::subscription_status_enum)
  ) OR EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN public.profiles p2 ON p2.sst_manager_id = p.sst_manager_id
    JOIN public.subscriptions s ON s.owner_user_id = p2.id
    JOIN public.subscription_plans sp ON sp.id = s.plan_id
    WHERE p.id = _user_id
      AND sp.pgr_enabled = true
      AND sp.ai_enabled = false
      AND s.status IN ('active'::subscription_status_enum,'trial'::subscription_status_enum,'trialing'::subscription_status_enum)
  ) OR EXISTS (
    SELECT 1
    FROM public.user_sst_managers usm
    JOIN public.profiles p2 ON p2.sst_manager_id = usm.sst_manager_id
    JOIN public.subscriptions s ON s.owner_user_id = p2.id
    JOIN public.subscription_plans sp ON sp.id = s.plan_id
    WHERE usm.user_id = _user_id
      AND sp.pgr_enabled = true
      AND sp.ai_enabled = false
      AND s.status IN ('active'::subscription_status_enum,'trial'::subscription_status_enum,'trialing'::subscription_status_enum)
  );
$$;

GRANT EXECUTE ON FUNCTION public.user_has_pgr_shortcut_plan(uuid) TO authenticated;