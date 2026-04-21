-- 1. sst_managers: remove blanket public SELECT exposing PII, expose only branding via a public view
DROP POLICY IF EXISTS "Public can view SST managers basic info" ON public.sst_managers;

CREATE OR REPLACE VIEW public.sst_managers_public AS
SELECT id, name, slug, logo_url, brand_color
FROM public.sst_managers;

GRANT SELECT ON public.sst_managers_public TO anon, authenticated;

-- Keep authenticated SST owners / admins able to read full row (existing policies already cover this).
-- Add a minimal public read policy on the base table only for the branding columns is not possible
-- column-wise in RLS, so anonymous consumers must use sst_managers_public from now on.

-- 2. burnout_departments: drop the wide-open ALL/true policy; scoped policies already exist
DROP POLICY IF EXISTS "Authenticated users can manage burnout departments" ON public.burnout_departments;