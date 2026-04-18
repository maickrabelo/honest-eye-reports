
-- Helper to check if a module belongs to the current SST manager (avoids cross-table RLS recursion)
CREATE OR REPLACE FUNCTION public.is_sst_module_owner(_module_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.sst_training_modules m
    JOIN public.profiles p ON p.sst_manager_id = m.sst_manager_id
    WHERE m.id = _module_id AND p.id = _user_id
  )
$$;

-- Replace recursive policies on sst_training_materials
DROP POLICY IF EXISTS "SST manage own training materials" ON public.sst_training_materials;
CREATE POLICY "SST manage own training materials"
ON public.sst_training_materials
FOR ALL
USING (has_role(auth.uid(), 'sst'::app_role) AND public.is_sst_module_owner(module_id, auth.uid()))
WITH CHECK (has_role(auth.uid(), 'sst'::app_role) AND public.is_sst_module_owner(module_id, auth.uid()));

-- Replace recursive policies on sst_training_company_access
DROP POLICY IF EXISTS "SST manage own training access" ON public.sst_training_company_access;
CREATE POLICY "SST manage own training access"
ON public.sst_training_company_access
FOR ALL
USING (has_role(auth.uid(), 'sst'::app_role) AND public.is_sst_module_owner(module_id, auth.uid()))
WITH CHECK (has_role(auth.uid(), 'sst'::app_role) AND public.is_sst_module_owner(module_id, auth.uid()));
