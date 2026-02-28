
-- Add closing/result columns to sales_leads
ALTER TABLE public.sales_leads 
  ADD COLUMN IF NOT EXISTS closing_meeting_date timestamptz,
  ADD COLUMN IF NOT EXISTS cnpj text,
  ADD COLUMN IF NOT EXISTS contact_role text,
  ADD COLUMN IF NOT EXISTS assisted_companies_count integer,
  ADD COLUMN IF NOT EXISTS total_assisted_employees integer,
  ADD COLUMN IF NOT EXISTS large_companies text,
  ADD COLUMN IF NOT EXISTS large_companies_employees text,
  ADD COLUMN IF NOT EXISTS result text,
  ADD COLUMN IF NOT EXISTS denial_reason text;

-- Add sales role to enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'sales';
