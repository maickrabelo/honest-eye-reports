
CREATE OR REPLACE FUNCTION public.entity_has_ai_access(_company_id uuid, _sst_manager_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT sp.ai_enabled
      FROM public.companies c
      JOIN public.subscriptions s ON s.id = c.parent_subscription_id
      JOIN public.subscription_plans sp ON sp.id = s.plan_id
      WHERE c.id = _company_id
      LIMIT 1
    ),
    (
      SELECT sp.ai_enabled
      FROM public.profiles p
      JOIN public.subscriptions s ON s.owner_user_id = p.id
      JOIN public.subscription_plans sp ON sp.id = s.plan_id
      WHERE p.sst_manager_id = _sst_manager_id
        AND s.status = 'active'
      ORDER BY s.created_at DESC
      LIMIT 1
    ),
    -- Se não há plano vinculado (trial, demo), libera
    true
  );
$$;

GRANT EXECUTE ON FUNCTION public.entity_has_ai_access(uuid, uuid) TO anon, authenticated, service_role;
