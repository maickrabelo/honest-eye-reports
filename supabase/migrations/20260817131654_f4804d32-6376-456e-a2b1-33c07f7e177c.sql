CREATE TABLE public.company_audit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL,
  user_id uuid,
  user_email text,
  user_name text,
  action text NOT NULL,
  entity_type text,
  entity_id text,
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_company_audit_logs_company_created ON public.company_audit_logs (company_id, created_at DESC);

GRANT SELECT, INSERT ON public.company_audit_logs TO authenticated;
GRANT ALL ON public.company_audit_logs TO service_role;

ALTER TABLE public.company_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_company_primary_admin(_user_id uuid, _company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = _user_id AND company_id = _company_id
      AND NOT EXISTS (
        SELECT 1 FROM public.user_companies uc
        WHERE uc.company_id = _company_id AND uc.is_default = true AND uc.user_id <> _user_id
      )
  ) OR EXISTS (
    SELECT 1 FROM public.user_companies
    WHERE user_id = _user_id AND company_id = _company_id AND is_default = true
  )
$$;

CREATE POLICY "Company members can write audit logs"
ON public.company_audit_logs FOR INSERT TO authenticated
WITH CHECK (public.user_in_company(auth.uid(), company_id) AND (user_id IS NULL OR user_id = auth.uid()));

CREATE POLICY "Primary company admin and platform admin can read audit logs"
ON public.company_audit_logs FOR SELECT TO authenticated
USING (
  public.is_company_primary_admin(auth.uid(), company_id)
  OR public.has_role(auth.uid(), 'admin'::app_role)
);