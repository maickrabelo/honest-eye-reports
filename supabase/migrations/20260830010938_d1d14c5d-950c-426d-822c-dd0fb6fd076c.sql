CREATE TABLE public.licensed_operator_management_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id uuid NOT NULL REFERENCES public.licensed_operators(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  requested_by uuid,
  decided_by uuid,
  decided_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX lomr_operator_company_idx
  ON public.licensed_operator_management_requests (operator_id, company_id);
CREATE INDEX lomr_company_idx ON public.licensed_operator_management_requests (company_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.licensed_operator_management_requests TO authenticated;
GRANT ALL ON public.licensed_operator_management_requests TO service_role;

ALTER TABLE public.licensed_operator_management_requests ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.operator_manages_company(_user_id uuid, _company_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.licensed_operator_management_requests r
    JOIN public.licensed_operators lo ON lo.id = r.operator_id
    WHERE r.company_id = _company_id
      AND r.status = 'active'
      AND lo.user_id = _user_id
  );
$$;

CREATE POLICY "lomr_operator_select" ON public.licensed_operator_management_requests
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR operator_id = public.get_user_licensed_operator_id(auth.uid())
    OR public.user_in_company(auth.uid(), company_id)
  );

CREATE POLICY "lomr_operator_insert" ON public.licensed_operator_management_requests
  FOR INSERT TO authenticated
  WITH CHECK (
    operator_id = public.get_user_licensed_operator_id(auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.licensed_operator_companies loc
      WHERE loc.operator_id = licensed_operator_management_requests.operator_id
        AND loc.company_id = licensed_operator_management_requests.company_id
    )
  );

CREATE POLICY "lomr_operator_update" ON public.licensed_operator_management_requests
  FOR UPDATE TO authenticated
  USING (operator_id = public.get_user_licensed_operator_id(auth.uid()))
  WITH CHECK (operator_id = public.get_user_licensed_operator_id(auth.uid()));

CREATE POLICY "lomr_company_decide" ON public.licensed_operator_management_requests
  FOR UPDATE TO authenticated
  USING (public.is_company_primary_admin(auth.uid(), company_id) OR public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.is_company_primary_admin(auth.uid(), company_id) OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER lomr_updated_at BEFORE UPDATE ON public.licensed_operator_management_requests
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE FUNCTION public.ouvidoria_can_view(_company_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(auth.uid(), 'admin'::app_role)
    OR public.user_in_company(auth.uid(), _company_id)
    OR public.user_manages_company(auth.uid(), _company_id)
    OR public.operator_manages_company(auth.uid(), _company_id)
    OR EXISTS (
      SELECT 1 FROM public.ouvidoria_users ou
      WHERE ou.company_id = _company_id AND ou.user_id = auth.uid() AND ou.status = 'active'
    );
$$;

CREATE POLICY "companies_operator_authorized_select" ON public.companies
  FOR SELECT TO authenticated
  USING (public.operator_manages_company(auth.uid(), id));

CREATE POLICY "reports_operator_authorized_select" ON public.reports
  FOR SELECT TO authenticated
  USING (public.operator_manages_company(auth.uid(), company_id));

CREATE POLICY "reports_operator_authorized_update" ON public.reports
  FOR UPDATE TO authenticated
  USING (public.operator_manages_company(auth.uid(), company_id))
  WITH CHECK (public.operator_manages_company(auth.uid(), company_id));

CREATE POLICY "report_updates_operator_select" ON public.report_updates
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.reports r
    WHERE r.id = report_updates.report_id
      AND public.operator_manages_company(auth.uid(), r.company_id)
  ));

CREATE POLICY "report_updates_operator_insert" ON public.report_updates
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.reports r
    WHERE r.id = report_updates.report_id
      AND public.operator_manages_company(auth.uid(), r.company_id)
  ));

CREATE POLICY "report_attachments_operator_select" ON public.report_attachments
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.reports r
    WHERE r.id = report_attachments.report_id
      AND public.operator_manages_company(auth.uid(), r.company_id)
  ));