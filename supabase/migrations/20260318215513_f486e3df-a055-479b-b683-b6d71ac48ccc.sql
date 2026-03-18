ALTER TABLE public.hseit_assessments ADD COLUMN IF NOT EXISTS collection_mode text DEFAULT 'form';
ALTER TABLE public.copsoq_assessments ADD COLUMN IF NOT EXISTS collection_mode text DEFAULT 'form';
ALTER TABLE public.burnout_assessments ADD COLUMN IF NOT EXISTS collection_mode text DEFAULT 'form';