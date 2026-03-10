
-- SST users can view their own sst_manager record
DROP POLICY IF EXISTS "SST can view own sst_manager" ON public.sst_managers;
CREATE POLICY "SST can view own sst_manager" ON public.sst_managers
  FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'sst'::app_role) AND
    id = (SELECT sst_manager_id FROM public.profiles WHERE id = auth.uid())
  );

-- SST users can update their own sst_manager record (for brand_color, logo, etc.)
DROP POLICY IF EXISTS "SST can update own sst_manager" ON public.sst_managers;
CREATE POLICY "SST can update own sst_manager" ON public.sst_managers
  FOR UPDATE TO authenticated
  USING (
    has_role(auth.uid(), 'sst'::app_role) AND
    id = (SELECT sst_manager_id FROM public.profiles WHERE id = auth.uid())
  );
