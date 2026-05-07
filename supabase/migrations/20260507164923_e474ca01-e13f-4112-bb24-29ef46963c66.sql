-- Remove the overly permissive policy
DROP POLICY IF EXISTS "Public can read sst_managers via public view" ON public.sst_managers;

-- Recreate the public view with security_invoker disabled so it bypasses base table RLS
DROP VIEW IF EXISTS public.sst_managers_public;

CREATE VIEW public.sst_managers_public
WITH (security_invoker = false)
AS
SELECT id, name, slug, logo_url, brand_color
FROM public.sst_managers;

GRANT SELECT ON public.sst_managers_public TO anon, authenticated;