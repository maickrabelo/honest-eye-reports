CREATE POLICY "Authorized users can update report status"
ON public.reports
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR (
    public.has_role(auth.uid(), 'company'::public.app_role)
    AND public.user_in_company(auth.uid(), company_id)
  )
  OR (
    public.has_role(auth.uid(), 'sst'::public.app_role)
    AND public.user_manages_company(auth.uid(), company_id)
  )
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR (
    public.has_role(auth.uid(), 'company'::public.app_role)
    AND public.user_in_company(auth.uid(), company_id)
  )
  OR (
    public.has_role(auth.uid(), 'sst'::public.app_role)
    AND public.user_manages_company(auth.uid(), company_id)
  )
);