
CREATE POLICY "beta_ouvidoria_storage_read"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'beta-ouvidoria-attachments'
  AND (
    public.has_role(auth.uid(),'admin'::app_role)
    OR public.user_in_company(auth.uid(), '382745b1-d65a-4928-bb1b-95ae513c4e14'::uuid)
  )
);

CREATE POLICY "beta_ouvidoria_storage_anon_insert"
ON storage.objects FOR INSERT TO anon
WITH CHECK (bucket_id = 'beta-ouvidoria-attachments');
