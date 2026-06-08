CREATE POLICY "Company users can update companies via user_companies"
ON public.companies
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'company'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.user_companies uc
    WHERE uc.company_id = companies.id AND uc.user_id = auth.uid()
  )
)
WITH CHECK (
  has_role(auth.uid(), 'company'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.user_companies uc
    WHERE uc.company_id = companies.id AND uc.user_id = auth.uid()
  )
);