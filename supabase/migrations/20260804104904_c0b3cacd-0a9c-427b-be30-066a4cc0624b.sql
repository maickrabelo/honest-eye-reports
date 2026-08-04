ALTER TABLE public.licensed_partners
  ADD COLUMN IF NOT EXISTS sst_manager_id uuid REFERENCES public.sst_managers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS manages_clients boolean NOT NULL DEFAULT true;