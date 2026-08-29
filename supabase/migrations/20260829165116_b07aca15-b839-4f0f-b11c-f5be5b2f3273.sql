DROP POLICY IF EXISTS ouvidoria_notes_write ON public.ouvidoria_internal_notes;

CREATE POLICY ouvidoria_notes_insert ON public.ouvidoria_internal_notes
FOR INSERT TO authenticated
WITH CHECK (public.ouvidoria_can_view(company_id));

CREATE POLICY ouvidoria_notes_update ON public.ouvidoria_internal_notes
FOR UPDATE TO authenticated
USING (public.ouvidoria_can_edit(company_id) OR author_user_id = auth.uid())
WITH CHECK (public.ouvidoria_can_edit(company_id) OR author_user_id = auth.uid());

CREATE POLICY ouvidoria_notes_delete ON public.ouvidoria_internal_notes
FOR DELETE TO authenticated
USING (public.ouvidoria_can_edit(company_id) OR author_user_id = auth.uid());