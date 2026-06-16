
CREATE TABLE public.beta_ouvidoria_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  tracking_code text NOT NULL UNIQUE,
  access_key_hash text NOT NULL,
  report_type text NOT NULL CHECK (report_type IN ('denuncia','reclamacao','sugestao','elogio')),
  category text NOT NULL CHECK (category IN ('assedio','discriminacao','fraude','conflito_interesses','conduta','uso_indevido_bens','quebra_sigilo','outros')),
  category_other text,
  description text NOT NULL,
  occurrence_type text NOT NULL CHECK (occurrence_type IN ('data_especifica','recorrente','nao_recorda')),
  occurrence_date date,
  location_sector text,
  status text NOT NULL DEFAULT 'aberto' CHECK (status IN ('aberto','em_analise','respondido','encerrado')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.beta_ouvidoria_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES public.beta_ouvidoria_reports(id) ON DELETE CASCADE,
  file_path text NOT NULL,
  file_name text NOT NULL,
  mime_type text,
  size_bytes bigint,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.beta_ouvidoria_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES public.beta_ouvidoria_reports(id) ON DELETE CASCADE,
  author_type text NOT NULL CHECK (author_type IN ('investigator','anonymous')),
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.beta_ouvidoria_reports TO authenticated;
GRANT ALL ON public.beta_ouvidoria_reports TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.beta_ouvidoria_attachments TO authenticated;
GRANT ALL ON public.beta_ouvidoria_attachments TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.beta_ouvidoria_updates TO authenticated;
GRANT ALL ON public.beta_ouvidoria_updates TO service_role;

ALTER TABLE public.beta_ouvidoria_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beta_ouvidoria_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beta_ouvidoria_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "beta_reports_select_company"
ON public.beta_ouvidoria_reports FOR SELECT TO authenticated
USING (public.has_role(auth.uid(),'admin'::app_role) OR public.user_in_company(auth.uid(), company_id));

CREATE POLICY "beta_reports_update_company"
ON public.beta_ouvidoria_reports FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(),'admin'::app_role) OR public.user_in_company(auth.uid(), company_id));

CREATE POLICY "beta_reports_delete_admin"
ON public.beta_ouvidoria_reports FOR DELETE TO authenticated
USING (public.has_role(auth.uid(),'admin'::app_role));

CREATE POLICY "beta_attachments_select_company"
ON public.beta_ouvidoria_attachments FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.beta_ouvidoria_reports r
    WHERE r.id = report_id
      AND (public.has_role(auth.uid(),'admin'::app_role) OR public.user_in_company(auth.uid(), r.company_id))
  )
);

CREATE POLICY "beta_updates_select_company"
ON public.beta_ouvidoria_updates FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.beta_ouvidoria_reports r
    WHERE r.id = report_id
      AND (public.has_role(auth.uid(),'admin'::app_role) OR public.user_in_company(auth.uid(), r.company_id))
  )
);

CREATE POLICY "beta_updates_insert_investigator"
ON public.beta_ouvidoria_updates FOR INSERT TO authenticated
WITH CHECK (
  author_type = 'investigator'
  AND EXISTS (
    SELECT 1 FROM public.beta_ouvidoria_reports r
    WHERE r.id = report_id
      AND (public.has_role(auth.uid(),'admin'::app_role) OR public.user_in_company(auth.uid(), r.company_id))
  )
);

CREATE OR REPLACE FUNCTION public.beta_ouvidoria_only_demo()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.company_id <> '382745b1-d65a-4928-bb1b-95ae513c4e14'::uuid THEN
    RAISE EXCEPTION 'Canal Ouvidoria Beta disponível apenas para empresas autorizadas';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_beta_ouvidoria_only_demo
BEFORE INSERT OR UPDATE ON public.beta_ouvidoria_reports
FOR EACH ROW EXECUTE FUNCTION public.beta_ouvidoria_only_demo();

CREATE TRIGGER trg_beta_reports_updated_at
BEFORE UPDATE ON public.beta_ouvidoria_reports
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
