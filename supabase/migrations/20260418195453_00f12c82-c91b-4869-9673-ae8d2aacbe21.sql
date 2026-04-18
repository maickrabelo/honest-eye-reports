
CREATE TABLE IF NOT EXISTS public.company_feature_access (
  company_id uuid PRIMARY KEY REFERENCES public.companies(id) ON DELETE CASCADE,
  ouvidoria_enabled boolean NOT NULL DEFAULT true,
  psicossocial_enabled boolean NOT NULL DEFAULT true,
  burnout_enabled boolean NOT NULL DEFAULT true,
  clima_enabled boolean NOT NULL DEFAULT true,
  treinamentos_enabled boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

ALTER TABLE public.company_feature_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all feature access"
ON public.company_feature_access FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "SST manage assigned company features"
ON public.company_feature_access FOR ALL
USING (
  has_role(auth.uid(), 'sst'::app_role) AND EXISTS (
    SELECT 1 FROM public.company_sst_assignments csa
    JOIN public.profiles p ON p.sst_manager_id = csa.sst_manager_id
    WHERE csa.company_id = company_feature_access.company_id AND p.id = auth.uid()
  )
)
WITH CHECK (
  has_role(auth.uid(), 'sst'::app_role) AND EXISTS (
    SELECT 1 FROM public.company_sst_assignments csa
    JOIN public.profiles p ON p.sst_manager_id = csa.sst_manager_id
    WHERE csa.company_id = company_feature_access.company_id AND p.id = auth.uid()
  )
);

CREATE POLICY "Companies view own feature access"
ON public.company_feature_access FOR SELECT
USING (
  has_role(auth.uid(), 'company'::app_role) AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.company_id = company_feature_access.company_id
  )
);

CREATE OR REPLACE FUNCTION public.get_company_features(_company_id uuid)
RETURNS TABLE (
  ouvidoria_enabled boolean,
  psicossocial_enabled boolean,
  burnout_enabled boolean,
  clima_enabled boolean,
  treinamentos_enabled boolean
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    COALESCE(cfa.ouvidoria_enabled, true),
    COALESCE(cfa.psicossocial_enabled, true),
    COALESCE(cfa.burnout_enabled, true),
    COALESCE(cfa.clima_enabled, true),
    COALESCE(cfa.treinamentos_enabled, true)
  FROM (SELECT _company_id AS id) c
  LEFT JOIN public.company_feature_access cfa ON cfa.company_id = c.id
$$;
