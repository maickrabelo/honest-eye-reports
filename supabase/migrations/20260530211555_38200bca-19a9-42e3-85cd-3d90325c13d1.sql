
ALTER TABLE public.sst_extra_slot_purchases
  ALTER COLUMN sst_manager_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'company' CHECK (kind IN ('company','employee'));

CREATE INDEX IF NOT EXISTS idx_extra_slot_purchases_company ON public.sst_extra_slot_purchases(company_id);
