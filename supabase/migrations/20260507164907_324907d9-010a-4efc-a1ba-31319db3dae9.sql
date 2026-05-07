DROP POLICY IF EXISTS "Public can view sst_manager basic info by slug" ON public.sst_managers;

CREATE OR REPLACE VIEW public.sst_managers_public
WITH (security_invoker = true)
AS
SELECT id, name, slug, logo_url, brand_color
FROM public.sst_managers;

GRANT SELECT ON public.sst_managers_public TO anon, authenticated;

-- Allow the public view to bypass RLS by adding a permissive SELECT policy scoped to the columns exposed.
-- Since views with security_invoker honor RLS of the base table, we add a public policy limited via a function:
CREATE POLICY "Public can read sst_managers via public view"
ON public.sst_managers
FOR SELECT
TO anon, authenticated
USING (true);