
CREATE OR REPLACE FUNCTION public.user_manages_company(_user_id uuid, _company_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.company_sst_assignments csa
    JOIN public.profiles p ON p.sst_manager_id = csa.sst_manager_id
    WHERE csa.company_id = _company_id AND p.id = _user_id
  ) OR EXISTS (
    SELECT 1
    FROM public.company_sst_assignments csa
    JOIN public.user_sst_managers usm ON usm.sst_manager_id = csa.sst_manager_id
    WHERE csa.company_id = _company_id AND usm.user_id = _user_id
  );
$$;

DROP POLICY IF EXISTS beta_reports_select_company ON public.beta_ouvidoria_reports;
CREATE POLICY beta_reports_select_company ON public.beta_ouvidoria_reports
FOR SELECT USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR user_in_company(auth.uid(), company_id)
  OR user_manages_company(auth.uid(), company_id)
);

DROP POLICY IF EXISTS beta_reports_update_company ON public.beta_ouvidoria_reports;
CREATE POLICY beta_reports_update_company ON public.beta_ouvidoria_reports
FOR UPDATE USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR user_in_company(auth.uid(), company_id)
  OR user_manages_company(auth.uid(), company_id)
);

-- Updates table: allow SST managers to read/insert
DROP POLICY IF EXISTS beta_updates_select ON public.beta_ouvidoria_updates;
CREATE POLICY beta_updates_select ON public.beta_ouvidoria_updates
FOR SELECT USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.beta_ouvidoria_reports r
    WHERE r.id = beta_ouvidoria_updates.report_id
      AND (user_in_company(auth.uid(), r.company_id) OR user_manages_company(auth.uid(), r.company_id))
  )
);

DROP POLICY IF EXISTS beta_updates_insert ON public.beta_ouvidoria_updates;
CREATE POLICY beta_updates_insert ON public.beta_ouvidoria_updates
FOR INSERT WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.beta_ouvidoria_reports r
    WHERE r.id = beta_ouvidoria_updates.report_id
      AND (user_in_company(auth.uid(), r.company_id) OR user_manages_company(auth.uid(), r.company_id))
  )
);
