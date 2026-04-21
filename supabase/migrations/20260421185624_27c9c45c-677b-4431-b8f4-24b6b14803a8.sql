
-- Track which trial plan a company signed up under (e.g. 'corporate')
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS trial_plan_slug text;

-- Allow company users to UPDATE their own company (so they can edit logo/phone/address)
CREATE POLICY "Company users can update their own company"
ON public.companies
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'company'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.company_id = companies.id
  )
)
WITH CHECK (
  public.has_role(auth.uid(), 'company'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.company_id = companies.id
  )
);

-- Allow users to view their own user_companies links
CREATE POLICY "Users can view their own user_companies"
ON public.user_companies
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Storage policies: company-logos bucket — allow company users to upload/update their own logo
-- Folder convention: {company_id}/...
CREATE POLICY "Company users can upload their company logo"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'company-logos'
  AND public.has_role(auth.uid(), 'company'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.company_id::text = (storage.foldername(name))[1]
  )
);

CREATE POLICY "Company users can update their company logo"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'company-logos'
  AND public.has_role(auth.uid(), 'company'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.company_id::text = (storage.foldername(name))[1]
  )
);

CREATE POLICY "Company users can delete their company logo"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'company-logos'
  AND public.has_role(auth.uid(), 'company'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.company_id::text = (storage.foldername(name))[1]
  )
);
