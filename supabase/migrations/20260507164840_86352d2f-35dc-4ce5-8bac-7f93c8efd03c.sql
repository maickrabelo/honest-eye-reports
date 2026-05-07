CREATE POLICY "Public can view sst_manager basic info by slug"
ON public.sst_managers
FOR SELECT
TO anon, authenticated
USING (true);