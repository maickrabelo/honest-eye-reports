
-- 1. Modules table
CREATE TABLE public.sst_training_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sst_manager_id UUID NOT NULL REFERENCES public.sst_managers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sst_training_modules_sst_manager ON public.sst_training_modules(sst_manager_id);

-- 2. Materials table
CREATE TABLE public.sst_training_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES public.sst_training_modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  material_type TEXT NOT NULL CHECK (material_type IN ('video', 'pdf', 'article')),
  content_url TEXT,
  article_content TEXT,
  duration_minutes INTEGER,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sst_training_materials_module ON public.sst_training_materials(module_id);

-- 3. Company access table
CREATE TABLE public.sst_training_company_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES public.sst_training_modules(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(module_id, company_id)
);

CREATE INDEX idx_sst_training_access_module ON public.sst_training_company_access(module_id);
CREATE INDEX idx_sst_training_access_company ON public.sst_training_company_access(company_id);

-- Triggers for updated_at
CREATE TRIGGER trg_sst_training_modules_updated
  BEFORE UPDATE ON public.sst_training_modules
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_sst_training_materials_updated
  BEFORE UPDATE ON public.sst_training_materials
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Enable RLS
ALTER TABLE public.sst_training_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sst_training_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sst_training_company_access ENABLE ROW LEVEL SECURITY;

-- ===== POLICIES: sst_training_modules =====
CREATE POLICY "Admins manage all training modules"
  ON public.sst_training_modules FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "SST manage own training modules"
  ON public.sst_training_modules FOR ALL
  USING (
    public.has_role(auth.uid(), 'sst')
    AND sst_manager_id = public.get_user_sst_manager_id(auth.uid())
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'sst')
    AND sst_manager_id = public.get_user_sst_manager_id(auth.uid())
  );

CREATE POLICY "Companies view granted training modules"
  ON public.sst_training_modules FOR SELECT
  USING (
    public.has_role(auth.uid(), 'company')
    AND EXISTS (
      SELECT 1 FROM public.sst_training_company_access acc
      JOIN public.profiles p ON p.company_id = acc.company_id
      WHERE acc.module_id = sst_training_modules.id
        AND p.id = auth.uid()
    )
  );

-- ===== POLICIES: sst_training_materials =====
CREATE POLICY "Admins manage all training materials"
  ON public.sst_training_materials FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "SST manage own training materials"
  ON public.sst_training_materials FOR ALL
  USING (
    public.has_role(auth.uid(), 'sst')
    AND EXISTS (
      SELECT 1 FROM public.sst_training_modules m
      WHERE m.id = sst_training_materials.module_id
        AND m.sst_manager_id = public.get_user_sst_manager_id(auth.uid())
    )
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'sst')
    AND EXISTS (
      SELECT 1 FROM public.sst_training_modules m
      WHERE m.id = sst_training_materials.module_id
        AND m.sst_manager_id = public.get_user_sst_manager_id(auth.uid())
    )
  );

CREATE POLICY "Companies view granted training materials"
  ON public.sst_training_materials FOR SELECT
  USING (
    public.has_role(auth.uid(), 'company')
    AND EXISTS (
      SELECT 1 FROM public.sst_training_company_access acc
      JOIN public.profiles p ON p.company_id = acc.company_id
      WHERE acc.module_id = sst_training_materials.module_id
        AND p.id = auth.uid()
    )
  );

-- ===== POLICIES: sst_training_company_access =====
CREATE POLICY "Admins manage all training access"
  ON public.sst_training_company_access FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "SST manage own training access"
  ON public.sst_training_company_access FOR ALL
  USING (
    public.has_role(auth.uid(), 'sst')
    AND EXISTS (
      SELECT 1 FROM public.sst_training_modules m
      WHERE m.id = sst_training_company_access.module_id
        AND m.sst_manager_id = public.get_user_sst_manager_id(auth.uid())
    )
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'sst')
    AND EXISTS (
      SELECT 1 FROM public.sst_training_modules m
      WHERE m.id = sst_training_company_access.module_id
        AND m.sst_manager_id = public.get_user_sst_manager_id(auth.uid())
    )
  );

CREATE POLICY "Companies view own training access"
  ON public.sst_training_company_access FOR SELECT
  USING (
    public.has_role(auth.uid(), 'company')
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.company_id = sst_training_company_access.company_id
    )
  );

-- ===== STORAGE BUCKET =====
INSERT INTO storage.buckets (id, name, public)
VALUES ('sst-trainings', 'sst-trainings', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: SST managers manage files in their own folder (folder = sst_manager_id)
CREATE POLICY "SST upload training files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'sst-trainings'
    AND public.has_role(auth.uid(), 'sst')
    AND (storage.foldername(name))[1] = public.get_user_sst_manager_id(auth.uid())::text
  );

CREATE POLICY "SST update own training files"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'sst-trainings'
    AND public.has_role(auth.uid(), 'sst')
    AND (storage.foldername(name))[1] = public.get_user_sst_manager_id(auth.uid())::text
  );

CREATE POLICY "SST delete own training files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'sst-trainings'
    AND public.has_role(auth.uid(), 'sst')
    AND (storage.foldername(name))[1] = public.get_user_sst_manager_id(auth.uid())::text
  );

CREATE POLICY "SST view own training files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'sst-trainings'
    AND public.has_role(auth.uid(), 'sst')
    AND (storage.foldername(name))[1] = public.get_user_sst_manager_id(auth.uid())::text
  );

CREATE POLICY "Companies view granted training files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'sst-trainings'
    AND public.has_role(auth.uid(), 'company')
    AND EXISTS (
      SELECT 1
      FROM public.sst_training_materials mat
      JOIN public.sst_training_modules mod ON mod.id = mat.module_id
      JOIN public.sst_training_company_access acc ON acc.module_id = mod.id
      JOIN public.profiles p ON p.company_id = acc.company_id
      WHERE p.id = auth.uid()
        AND mat.content_url LIKE '%' || storage.objects.name || '%'
    )
  );

CREATE POLICY "Admins manage all training files"
  ON storage.objects FOR ALL
  USING (bucket_id = 'sst-trainings' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'sst-trainings' AND public.has_role(auth.uid(), 'admin'));
