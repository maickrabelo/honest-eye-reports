CREATE POLICY "Users can view linked companies via user_companies"
ON public.companies
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_companies uc
    WHERE uc.company_id = companies.id
      AND uc.user_id = auth.uid()
  )
);