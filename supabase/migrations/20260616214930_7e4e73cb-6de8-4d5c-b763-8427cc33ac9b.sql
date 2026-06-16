
-- 1) has_ai_access: considerar status trial/trialing e desligar para Smart
CREATE OR REPLACE FUNCTION public.has_ai_access(_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT COALESCE(
    (
      SELECT sp.ai_enabled
      FROM public.subscriptions s
      JOIN public.subscription_plans sp ON sp.id = s.plan_id
      WHERE s.owner_user_id = _user_id
        AND s.status IN ('active'::subscription_status_enum,'trial'::subscription_status_enum,'trialing'::subscription_status_enum)
      ORDER BY s.created_at DESC
      LIMIT 1
    ),
    (
      SELECT sp.ai_enabled
      FROM public.profiles p
      JOIN public.companies c ON c.id = p.company_id
      JOIN public.subscriptions s ON s.id = c.parent_subscription_id
      JOIN public.subscription_plans sp ON sp.id = s.plan_id
      WHERE p.id = _user_id
      LIMIT 1
    ),
    (
      SELECT sp.ai_enabled
      FROM public.profiles p
      JOIN public.subscriptions s ON s.owner_user_id IN (
        SELECT id FROM public.profiles WHERE sst_manager_id = p.sst_manager_id
      )
      JOIN public.subscription_plans sp ON sp.id = s.plan_id
      WHERE p.id = _user_id
        AND s.status IN ('active'::subscription_status_enum,'trial'::subscription_status_enum,'trialing'::subscription_status_enum)
      ORDER BY s.created_at DESC
      LIMIT 1
    ),
    true
  );
$function$;

-- 2) entity_has_ai_access: idem
CREATE OR REPLACE FUNCTION public.entity_has_ai_access(_company_id uuid, _sst_manager_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
        AND s.status IN ('active'::subscription_status_enum,'trial'::subscription_status_enum,'trialing'::subscription_status_enum)
      ORDER BY s.created_at DESC
      LIMIT 1
    ),
    true
  );
$function$;

-- 3) has_pgr_module: incluir planos com pgr_enabled
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
    -- SST manager com plano (ex.: sst-smart) com PGR habilitado
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.subscriptions s ON s.owner_user_id = p.id
      JOIN public.subscription_plans sp ON sp.id = s.plan_id
      WHERE p.id = _user_id
        AND sp.pgr_enabled = true
        AND s.status IN ('active'::subscription_status_enum,'trial'::subscription_status_enum,'trialing'::subscription_status_enum)
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.profiles p2 ON p2.sst_manager_id = p.sst_manager_id
      JOIN public.subscriptions s ON s.owner_user_id = p2.id
      JOIN public.subscription_plans sp ON sp.id = s.plan_id
      WHERE p.id = _user_id
        AND sp.pgr_enabled = true
        AND s.status IN ('active'::subscription_status_enum,'trial'::subscription_status_enum,'trialing'::subscription_status_enum)
    )
    OR EXISTS (
      SELECT 1 FROM public.user_sst_managers usm
      JOIN public.profiles p2 ON p2.sst_manager_id = usm.sst_manager_id
      JOIN public.subscriptions s ON s.owner_user_id = p2.id
      JOIN public.subscription_plans sp ON sp.id = s.plan_id
      WHERE usm.user_id = _user_id
        AND sp.pgr_enabled = true
        AND s.status IN ('active'::subscription_status_enum,'trial'::subscription_status_enum,'trialing'::subscription_status_enum)
    )
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

-- 4) get_company_features: desligar Ouvidoria tradicional para empresas com plano Smart
CREATE OR REPLACE FUNCTION public.get_company_features(_company_id uuid)
 RETURNS TABLE(ouvidoria_enabled boolean, psicossocial_enabled boolean, burnout_enabled boolean, clima_enabled boolean, treinamentos_enabled boolean)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    CASE
      WHEN public.company_has_smart_ouvidoria(_company_id)
        AND _company_id <> '382745b1-d65a-4928-bb1b-95ae513c4e14'::uuid
      THEN false
      ELSE COALESCE(cfa.ouvidoria_enabled, true)
    END,
    COALESCE(cfa.psicossocial_enabled, true),
    COALESCE(cfa.burnout_enabled, true),
    COALESCE(cfa.clima_enabled, true),
    COALESCE(cfa.treinamentos_enabled, true)
  FROM (SELECT _company_id AS id) c
  LEFT JOIN public.company_feature_access cfa ON cfa.company_id = c.id
$function$;

-- 5) Helper para o front: o usuário tem plano "smart-only" (sem IA, sem ouvidoria tradicional)?
CREATE OR REPLACE FUNCTION public.user_has_smart_plan(_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN public.subscriptions s ON s.owner_user_id = p.id
    JOIN public.subscription_plans sp ON sp.id = s.plan_id
    WHERE p.id = _user_id
      AND sp.slug = 'sst-smart'
      AND s.status IN ('active'::subscription_status_enum,'trial'::subscription_status_enum,'trialing'::subscription_status_enum)
  ) OR EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN public.profiles p2 ON p2.sst_manager_id = p.sst_manager_id
    JOIN public.subscriptions s ON s.owner_user_id = p2.id
    JOIN public.subscription_plans sp ON sp.id = s.plan_id
    WHERE p.id = _user_id
      AND sp.slug = 'sst-smart'
      AND s.status IN ('active'::subscription_status_enum,'trial'::subscription_status_enum,'trialing'::subscription_status_enum)
  ) OR EXISTS (
    SELECT 1
    FROM public.user_sst_managers usm
    JOIN public.profiles p2 ON p2.sst_manager_id = usm.sst_manager_id
    JOIN public.subscriptions s ON s.owner_user_id = p2.id
    JOIN public.subscription_plans sp ON sp.id = s.plan_id
    WHERE usm.user_id = _user_id
      AND sp.slug = 'sst-smart'
      AND s.status IN ('active'::subscription_status_enum,'trial'::subscription_status_enum,'trialing'::subscription_status_enum)
  );
$function$;
