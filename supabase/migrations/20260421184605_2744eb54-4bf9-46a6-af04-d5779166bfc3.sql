CREATE POLICY "Company users can view their own company"
ON public.companies
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'company')
  AND EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.company_id = companies.id
  )
);