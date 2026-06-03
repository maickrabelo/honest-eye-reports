-- Tabela de acessos
CREATE TABLE IF NOT EXISTS public.sector_viewer_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  sst_manager_id uuid NOT NULL,
  company_id uuid NOT NULL,
  assessment_type text NOT NULL CHECK (assessment_type IN ('hseit','copsoq')),
  department_name text NOT NULL,
  granted_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, company_id, assessment_type, department_name)
);

CREATE INDEX IF NOT EXISTS idx_sva_user ON public.sector_viewer_access(user_id);
CREATE INDEX IF NOT EXISTS idx_sva_sst ON public.sector_viewer_access(sst_manager_id);
CREATE INDEX IF NOT EXISTS idx_sva_company ON public.sector_viewer_access(company_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sector_viewer_access TO authenticated;
GRANT ALL ON public.sector_viewer_access TO service_role;

ALTER TABLE public.sector_viewer_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sector viewers see their own access"
  ON public.sector_viewer_access FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "SST managers see access they granted"
  ON public.sector_viewer_access FOR SELECT
  USING (
    has_role(auth.uid(), 'sst'::app_role)
    AND public.user_in_sst_manager(auth.uid(), sst_manager_id)
  );

CREATE POLICY "Admins manage all sector access"
  ON public.sector_viewer_access FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "SST managers insert sector access"
  ON public.sector_viewer_access FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'sst'::app_role)
    AND public.user_in_sst_manager(auth.uid(), sst_manager_id)
  );

CREATE POLICY "SST managers delete sector access"
  ON public.sector_viewer_access FOR DELETE
  USING (
    has_role(auth.uid(), 'sst'::app_role)
    AND public.user_in_sst_manager(auth.uid(), sst_manager_id)
  );

-- Tabela de convites
CREATE TABLE IF NOT EXISTS public.sector_viewer_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL UNIQUE,
  email text NOT NULL,
  sst_manager_id uuid NOT NULL,
  company_id uuid NOT NULL,
  assessment_type text NOT NULL CHECK (assessment_type IN ('hseit','copsoq')),
  department_names text[] NOT NULL,
  invited_by uuid,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','revoked')),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at timestamptz,
  accepted_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_svi_token ON public.sector_viewer_invitations(token);
CREATE INDEX IF NOT EXISTS idx_svi_email ON public.sector_viewer_invitations(email);
CREATE INDEX IF NOT EXISTS idx_svi_sst ON public.sector_viewer_invitations(sst_manager_id);

GRANT SELECT ON public.sector_viewer_invitations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sector_viewer_invitations TO authenticated;
GRANT ALL ON public.sector_viewer_invitations TO service_role;

ALTER TABLE public.sector_viewer_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view invitation by token"
  ON public.sector_viewer_invitations FOR SELECT
  USING (true);

CREATE POLICY "Admins manage all invitations"
  ON public.sector_viewer_invitations FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "SST managers manage their invitations"
  ON public.sector_viewer_invitations FOR ALL
  USING (
    has_role(auth.uid(), 'sst'::app_role)
    AND public.user_in_sst_manager(auth.uid(), sst_manager_id)
  );

-- Funções auxiliares
CREATE OR REPLACE FUNCTION public.get_user_sector_access(_user_id uuid)
RETURNS TABLE (
  company_id uuid,
  company_name text,
  assessment_type text,
  department_name text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT sva.company_id, c.name, sva.assessment_type, sva.department_name
  FROM public.sector_viewer_access sva
  JOIN public.companies c ON c.id = sva.company_id
  WHERE sva.user_id = _user_id
  ORDER BY c.name, sva.assessment_type, sva.department_name
$$;

CREATE OR REPLACE FUNCTION public.has_sector_access(
  _user_id uuid,
  _company_id uuid,
  _assessment_type text,
  _department_name text
)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.sector_viewer_access
    WHERE user_id = _user_id
      AND company_id = _company_id
      AND assessment_type = _assessment_type
      AND department_name = _department_name
  )
$$;

-- Permitir que sector_viewer leia avaliações HSE-IT/COPSOQ vinculadas
CREATE POLICY "Sector viewers can view HSE-IT assessments of granted sectors"
  ON public.hseit_assessments FOR SELECT
  USING (
    has_role(auth.uid(), 'sector_viewer'::app_role)
    AND EXISTS (
      SELECT 1 FROM public.sector_viewer_access sva
      WHERE sva.user_id = auth.uid()
        AND sva.company_id = hseit_assessments.company_id
        AND sva.assessment_type = 'hseit'
    )
  );

CREATE POLICY "Sector viewers can view HSE-IT departments of granted sectors"
  ON public.hseit_departments FOR SELECT
  USING (
    has_role(auth.uid(), 'sector_viewer'::app_role)
    AND EXISTS (
      SELECT 1
      FROM public.hseit_assessments ha
      JOIN public.sector_viewer_access sva ON sva.company_id = ha.company_id
      WHERE ha.id = hseit_departments.assessment_id
        AND sva.user_id = auth.uid()
        AND sva.assessment_type = 'hseit'
    )
  );

CREATE POLICY "Sector viewers can view COPSOQ assessments of granted sectors"
  ON public.copsoq_assessments FOR SELECT
  USING (
    has_role(auth.uid(), 'sector_viewer'::app_role)
    AND EXISTS (
      SELECT 1 FROM public.sector_viewer_access sva
      WHERE sva.user_id = auth.uid()
        AND sva.company_id = copsoq_assessments.company_id
        AND sva.assessment_type = 'copsoq'
    )
  );