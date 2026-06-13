
ALTER TABLE public.hseit_assessments ADD COLUMN IF NOT EXISTS multi_sector_enabled boolean NOT NULL DEFAULT false;
ALTER TABLE public.copsoq_assessments ADD COLUMN IF NOT EXISTS multi_sector_enabled boolean NOT NULL DEFAULT false;
ALTER TABLE public.hseit_responses ADD COLUMN IF NOT EXISTS departments text[];
ALTER TABLE public.copsoq_responses ADD COLUMN IF NOT EXISTS departments text[];

UPDATE public.hseit_responses SET departments = ARRAY[department] WHERE departments IS NULL AND department IS NOT NULL;
UPDATE public.copsoq_responses SET departments = ARRAY[department] WHERE departments IS NULL AND department IS NOT NULL;
