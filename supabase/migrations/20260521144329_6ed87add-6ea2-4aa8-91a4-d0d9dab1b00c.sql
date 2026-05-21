
-- ============================================
-- 1. FEATURE FLAG: pgr_module_enabled em sst_managers
-- ============================================
ALTER TABLE public.sst_managers
  ADD COLUMN IF NOT EXISTS pgr_module_enabled boolean NOT NULL DEFAULT false;

-- Ativa apenas para Demo Ilimitado SOIA
UPDATE public.sst_managers
  SET pgr_module_enabled = true
  WHERE id = 'e195181b-fdb5-41fb-9564-73b186bfc7e9';

-- ============================================
-- 2. FUNÇÃO DE GATING
-- ============================================
CREATE OR REPLACE FUNCTION public.has_pgr_module(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
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
    );
$$;

-- ============================================
-- 3. TABELA: pgr_documents
-- ============================================
CREATE TABLE public.pgr_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  sst_manager_id uuid,
  title text NOT NULL DEFAULT 'PGR',
  version integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','expired','archived')),
  validity_start date,
  validity_end date,
  last_review_at date,
  executive_summary text,
  responsible_name text,
  responsible_cpf text,
  responsible_registration text,
  cnae text,
  risk_grade text,
  address text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_pgr_documents_company ON public.pgr_documents(company_id);
ALTER TABLE public.pgr_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all pgr_documents" ON public.pgr_documents
  FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role));

CREATE POLICY "SST manage pgr_documents for assigned companies" ON public.pgr_documents
  FOR ALL TO authenticated
  USING (
    has_pgr_module(auth.uid())
    AND has_role(auth.uid(),'sst'::app_role)
    AND EXISTS (
      SELECT 1 FROM public.company_sst_assignments csa
      WHERE csa.company_id = pgr_documents.company_id
      AND user_in_sst_manager(auth.uid(), csa.sst_manager_id)
    )
  )
  WITH CHECK (
    has_pgr_module(auth.uid())
    AND has_role(auth.uid(),'sst'::app_role)
    AND EXISTS (
      SELECT 1 FROM public.company_sst_assignments csa
      WHERE csa.company_id = pgr_documents.company_id
      AND user_in_sst_manager(auth.uid(), csa.sst_manager_id)
    )
  );

CREATE POLICY "Companies view own pgr_documents" ON public.pgr_documents
  FOR SELECT TO authenticated
  USING (
    has_pgr_module(auth.uid())
    AND has_role(auth.uid(),'company'::app_role)
    AND user_in_company(auth.uid(), company_id)
  );

-- ============================================
-- 4. TABELA: pgr_ghe
-- ============================================
CREATE TABLE public.pgr_ghe (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pgr_document_id uuid NOT NULL REFERENCES public.pgr_documents(id) ON DELETE CASCADE,
  name text NOT NULL,
  sector text,
  role text,
  activities_description text,
  worker_count integer NOT NULL DEFAULT 0,
  work_schedule text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_pgr_ghe_doc ON public.pgr_ghe(pgr_document_id);
ALTER TABLE public.pgr_ghe ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all pgr_ghe" ON public.pgr_ghe
  FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role));

CREATE POLICY "Inherit pgr_document access for pgr_ghe" ON public.pgr_ghe
  FOR ALL TO authenticated
  USING (
    has_pgr_module(auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.pgr_documents d
      WHERE d.id = pgr_ghe.pgr_document_id
      AND (
        (has_role(auth.uid(),'sst'::app_role) AND EXISTS (
          SELECT 1 FROM public.company_sst_assignments csa
          WHERE csa.company_id = d.company_id
          AND user_in_sst_manager(auth.uid(), csa.sst_manager_id)
        ))
        OR (has_role(auth.uid(),'company'::app_role) AND user_in_company(auth.uid(), d.company_id))
      )
    )
  )
  WITH CHECK (
    has_pgr_module(auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.pgr_documents d
      WHERE d.id = pgr_ghe.pgr_document_id
      AND has_role(auth.uid(),'sst'::app_role)
      AND EXISTS (
        SELECT 1 FROM public.company_sst_assignments csa
        WHERE csa.company_id = d.company_id
        AND user_in_sst_manager(auth.uid(), csa.sst_manager_id)
      )
    )
  );

-- ============================================
-- 5. TABELA: pgr_ghe_workers
-- ============================================
CREATE TABLE public.pgr_ghe_workers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ghe_id uuid NOT NULL REFERENCES public.pgr_ghe(id) ON DELETE CASCADE,
  cpf text NOT NULL,
  full_name text NOT NULL,
  registration_number text,
  admission_date date,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_pgr_workers_ghe ON public.pgr_ghe_workers(ghe_id);
ALTER TABLE public.pgr_ghe_workers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all pgr_ghe_workers" ON public.pgr_ghe_workers
  FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role));

CREATE POLICY "Inherit access for pgr_ghe_workers" ON public.pgr_ghe_workers
  FOR ALL TO authenticated
  USING (
    has_pgr_module(auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.pgr_ghe g
      JOIN public.pgr_documents d ON d.id = g.pgr_document_id
      WHERE g.id = pgr_ghe_workers.ghe_id
      AND (
        (has_role(auth.uid(),'sst'::app_role) AND EXISTS (
          SELECT 1 FROM public.company_sst_assignments csa
          WHERE csa.company_id = d.company_id
          AND user_in_sst_manager(auth.uid(), csa.sst_manager_id)
        ))
        OR (has_role(auth.uid(),'company'::app_role) AND user_in_company(auth.uid(), d.company_id))
      )
    )
  )
  WITH CHECK (
    has_pgr_module(auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.pgr_ghe g
      JOIN public.pgr_documents d ON d.id = g.pgr_document_id
      WHERE g.id = pgr_ghe_workers.ghe_id
      AND has_role(auth.uid(),'sst'::app_role)
      AND EXISTS (
        SELECT 1 FROM public.company_sst_assignments csa
        WHERE csa.company_id = d.company_id
        AND user_in_sst_manager(auth.uid(), csa.sst_manager_id)
      )
    )
  );

-- ============================================
-- 6. TABELA: pgr_risks
-- ============================================
CREATE TABLE public.pgr_risks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pgr_document_id uuid NOT NULL REFERENCES public.pgr_documents(id) ON DELETE CASCADE,
  ghe_id uuid REFERENCES public.pgr_ghe(id) ON DELETE SET NULL,
  category text NOT NULL CHECK (category IN ('fisico','quimico','biologico','ergonomico','acidentes','psicossocial')),
  agent_name text NOT NULL,
  esocial_agent_code text,
  source text,
  trajectory text,
  exposure_description text,
  measurement_value numeric,
  measurement_unit text,
  exposure_limit numeric,
  severity smallint NOT NULL DEFAULT 1 CHECK (severity BETWEEN 1 AND 5),
  probability smallint NOT NULL DEFAULT 1 CHECK (probability BETWEEN 1 AND 5),
  risk_level text GENERATED ALWAYS AS (
    CASE
      WHEN severity * probability >= 20 THEN 'intolerable'
      WHEN severity * probability >= 15 THEN 'substantial'
      WHEN severity * probability >= 8 THEN 'moderate'
      WHEN severity * probability >= 4 THEN 'tolerable'
      ELSE 'trivial'
    END
  ) STORED,
  existing_epc text,
  existing_epi text,
  epi_ca text,
  observations text,
  source_module text,
  source_module_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_pgr_risks_doc ON public.pgr_risks(pgr_document_id);
CREATE INDEX idx_pgr_risks_ghe ON public.pgr_risks(ghe_id);
ALTER TABLE public.pgr_risks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all pgr_risks" ON public.pgr_risks
  FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role));

CREATE POLICY "Inherit access for pgr_risks" ON public.pgr_risks
  FOR ALL TO authenticated
  USING (
    has_pgr_module(auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.pgr_documents d
      WHERE d.id = pgr_risks.pgr_document_id
      AND (
        (has_role(auth.uid(),'sst'::app_role) AND EXISTS (
          SELECT 1 FROM public.company_sst_assignments csa
          WHERE csa.company_id = d.company_id
          AND user_in_sst_manager(auth.uid(), csa.sst_manager_id)
        ))
        OR (has_role(auth.uid(),'company'::app_role) AND user_in_company(auth.uid(), d.company_id))
      )
    )
  )
  WITH CHECK (
    has_pgr_module(auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.pgr_documents d
      WHERE d.id = pgr_risks.pgr_document_id
      AND has_role(auth.uid(),'sst'::app_role)
      AND EXISTS (
        SELECT 1 FROM public.company_sst_assignments csa
        WHERE csa.company_id = d.company_id
        AND user_in_sst_manager(auth.uid(), csa.sst_manager_id)
      )
    )
  );

-- ============================================
-- 7. TABELA: pgr_action_items
-- ============================================
CREATE TABLE public.pgr_action_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pgr_document_id uuid NOT NULL REFERENCES public.pgr_documents(id) ON DELETE CASCADE,
  risk_id uuid REFERENCES public.pgr_risks(id) ON DELETE CASCADE,
  description text NOT NULL,
  control_hierarchy text CHECK (control_hierarchy IN ('elimination','substitution','engineering','administrative','epi')),
  responsible text,
  deadline date,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','done','cancelled')),
  cost numeric,
  evidence_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_pgr_actions_doc ON public.pgr_action_items(pgr_document_id);
ALTER TABLE public.pgr_action_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all pgr_action_items" ON public.pgr_action_items
  FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role));

CREATE POLICY "Inherit access for pgr_action_items" ON public.pgr_action_items
  FOR ALL TO authenticated
  USING (
    has_pgr_module(auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.pgr_documents d
      WHERE d.id = pgr_action_items.pgr_document_id
      AND (
        (has_role(auth.uid(),'sst'::app_role) AND EXISTS (
          SELECT 1 FROM public.company_sst_assignments csa
          WHERE csa.company_id = d.company_id
          AND user_in_sst_manager(auth.uid(), csa.sst_manager_id)
        ))
        OR (has_role(auth.uid(),'company'::app_role) AND user_in_company(auth.uid(), d.company_id))
      )
    )
  )
  WITH CHECK (
    has_pgr_module(auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.pgr_documents d
      WHERE d.id = pgr_action_items.pgr_document_id
      AND has_role(auth.uid(),'sst'::app_role)
      AND EXISTS (
        SELECT 1 FROM public.company_sst_assignments csa
        WHERE csa.company_id = d.company_id
        AND user_in_sst_manager(auth.uid(), csa.sst_manager_id)
      )
    )
  );

-- ============================================
-- 8. TABELA: pgr_monitoring
-- ============================================
CREATE TABLE public.pgr_monitoring (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  risk_id uuid NOT NULL REFERENCES public.pgr_risks(id) ON DELETE CASCADE,
  measured_at date NOT NULL,
  value numeric,
  unit text,
  technique text,
  instrument text,
  observations text,
  report_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_pgr_monitoring_risk ON public.pgr_monitoring(risk_id);
ALTER TABLE public.pgr_monitoring ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all pgr_monitoring" ON public.pgr_monitoring
  FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role));

CREATE POLICY "Inherit access for pgr_monitoring" ON public.pgr_monitoring
  FOR ALL TO authenticated
  USING (
    has_pgr_module(auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.pgr_risks r
      JOIN public.pgr_documents d ON d.id = r.pgr_document_id
      WHERE r.id = pgr_monitoring.risk_id
      AND (
        (has_role(auth.uid(),'sst'::app_role) AND EXISTS (
          SELECT 1 FROM public.company_sst_assignments csa
          WHERE csa.company_id = d.company_id
          AND user_in_sst_manager(auth.uid(), csa.sst_manager_id)
        ))
        OR (has_role(auth.uid(),'company'::app_role) AND user_in_company(auth.uid(), d.company_id))
      )
    )
  )
  WITH CHECK (
    has_pgr_module(auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.pgr_risks r
      JOIN public.pgr_documents d ON d.id = r.pgr_document_id
      WHERE r.id = pgr_monitoring.risk_id
      AND has_role(auth.uid(),'sst'::app_role)
      AND EXISTS (
        SELECT 1 FROM public.company_sst_assignments csa
        WHERE csa.company_id = d.company_id
        AND user_in_sst_manager(auth.uid(), csa.sst_manager_id)
      )
    )
  );

-- ============================================
-- 9. TABELA: pgr_esocial_exports
-- ============================================
CREATE TABLE public.pgr_esocial_exports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pgr_document_id uuid NOT NULL REFERENCES public.pgr_documents(id) ON DELETE CASCADE,
  event_type text NOT NULL DEFAULT 'S-2240',
  reference_period text,
  file_path text NOT NULL,
  file_hash text,
  worker_count integer DEFAULT 0,
  generated_by uuid,
  generated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_pgr_esocial_exports_doc ON public.pgr_esocial_exports(pgr_document_id);
ALTER TABLE public.pgr_esocial_exports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view all pgr_esocial_exports" ON public.pgr_esocial_exports
  FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role));

CREATE POLICY "Inherit access for pgr_esocial_exports" ON public.pgr_esocial_exports
  FOR ALL TO authenticated
  USING (
    has_pgr_module(auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.pgr_documents d
      WHERE d.id = pgr_esocial_exports.pgr_document_id
      AND (
        (has_role(auth.uid(),'sst'::app_role) AND EXISTS (
          SELECT 1 FROM public.company_sst_assignments csa
          WHERE csa.company_id = d.company_id
          AND user_in_sst_manager(auth.uid(), csa.sst_manager_id)
        ))
        OR (has_role(auth.uid(),'company'::app_role) AND user_in_company(auth.uid(), d.company_id))
      )
    )
  )
  WITH CHECK (
    has_pgr_module(auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.pgr_documents d
      WHERE d.id = pgr_esocial_exports.pgr_document_id
      AND has_role(auth.uid(),'sst'::app_role)
      AND EXISTS (
        SELECT 1 FROM public.company_sst_assignments csa
        WHERE csa.company_id = d.company_id
        AND user_in_sst_manager(auth.uid(), csa.sst_manager_id)
      )
    )
  );

-- ============================================
-- 10. TABELA: esocial_agents_catalog
-- ============================================
CREATE TABLE public.esocial_agents_catalog (
  code text PRIMARY KEY,
  category text NOT NULL CHECK (category IN ('fisico','quimico','biologico','ergonomico','acidentes')),
  name text NOT NULL,
  description text,
  unit text,
  exposure_limit numeric
);
ALTER TABLE public.esocial_agents_catalog ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read esocial_agents_catalog" ON public.esocial_agents_catalog
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage esocial_agents_catalog" ON public.esocial_agents_catalog
  FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role));

-- Seed reduzido — agentes mais comuns Tabela 23 e-Social
INSERT INTO public.esocial_agents_catalog (code, category, name, unit, exposure_limit) VALUES
  ('01.01.001','fisico','Ruído contínuo ou intermitente','dB(A)',85),
  ('01.01.002','fisico','Ruído de impacto','dB(LINEAR)',120),
  ('01.02.001','fisico','Calor (IBUTG)','°C',null),
  ('01.03.001','fisico','Vibração de corpo inteiro (VCI)','m/s²',1.1),
  ('01.03.002','fisico','Vibração mão-braço (VMB)','m/s²',5),
  ('01.04.001','fisico','Radiações ionizantes','mSv/ano',20),
  ('01.05.001','fisico','Radiações não ionizantes',null,null),
  ('01.06.001','fisico','Frio','°C',null),
  ('01.07.001','fisico','Umidade',null,null),
  ('01.08.001','fisico','Pressões anormais',null,null),
  ('02.01.001','quimico','Poeiras minerais — sílica livre cristalizada','mg/m³',0.025),
  ('02.01.002','quimico','Poeiras minerais — asbesto/amianto','f/cm³',0.1),
  ('02.01.003','quimico','Poeiras minerais — carvão mineral','mg/m³',2),
  ('02.02.001','quimico','Benzeno','ppm',1),
  ('02.02.002','quimico','Chumbo','mg/m³',0.05),
  ('02.02.003','quimico','Mercúrio','mg/m³',0.025),
  ('02.02.004','quimico','Cromo hexavalente','mg/m³',0.005),
  ('02.02.005','quimico','Manganês','mg/m³',0.2),
  ('02.02.006','quimico','Sílica','mg/m³',0.025),
  ('02.02.007','quimico','Hidrocarbonetos aromáticos','ppm',null),
  ('02.02.008','quimico','Solventes orgânicos','ppm',null),
  ('02.02.009','quimico','Inseticidas/agrotóxicos',null,null),
  ('02.03.001','quimico','Névoas, fumos e gases',null,null),
  ('03.01.001','biologico','Vírus',null,null),
  ('03.01.002','biologico','Bactérias',null,null),
  ('03.01.003','biologico','Protozoários',null,null),
  ('03.01.004','biologico','Fungos',null,null),
  ('03.01.005','biologico','Bacilos',null,null),
  ('03.01.006','biologico','Parasitas',null,null),
  ('04.01.001','ergonomico','Postura inadequada',null,null),
  ('04.01.002','ergonomico','Movimentos repetitivos',null,null),
  ('04.01.003','ergonomico','Levantamento e transporte manual de peso',null,null),
  ('04.01.004','ergonomico','Esforço físico intenso',null,null),
  ('04.01.005','ergonomico','Mobiliário inadequado',null,null),
  ('05.01.001','acidentes','Trabalho em altura',null,null),
  ('05.01.002','acidentes','Trabalho em espaço confinado',null,null),
  ('05.01.003','acidentes','Eletricidade',null,null),
  ('05.01.004','acidentes','Máquinas e equipamentos sem proteção',null,null),
  ('05.01.005','acidentes','Animais peçonhentos',null,null),
  ('09.01.001','acidentes','Ausência de agente nocivo ou de atividades previstas',null,null)
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- 11. STORAGE BUCKET
-- ============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('pgr-documents','pgr-documents', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Admins manage pgr-documents storage"
  ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'pgr-documents' AND has_role(auth.uid(),'admin'::app_role))
  WITH CHECK (bucket_id = 'pgr-documents' AND has_role(auth.uid(),'admin'::app_role));

CREATE POLICY "PGR users manage pgr-documents storage"
  ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'pgr-documents' AND has_pgr_module(auth.uid()))
  WITH CHECK (bucket_id = 'pgr-documents' AND has_pgr_module(auth.uid()));

-- ============================================
-- 12. TRIGGERS updated_at
-- ============================================
CREATE TRIGGER trg_pgr_documents_updated BEFORE UPDATE ON public.pgr_documents
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trg_pgr_ghe_updated BEFORE UPDATE ON public.pgr_ghe
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trg_pgr_risks_updated BEFORE UPDATE ON public.pgr_risks
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trg_pgr_actions_updated BEFORE UPDATE ON public.pgr_action_items
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
