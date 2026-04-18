ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS employee_count integer NOT NULL DEFAULT 0;