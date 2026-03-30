
-- Allow SST users to delete assignments for their managed companies
CREATE POLICY "SST can delete own assignments"
ON public.company_sst_assignments
FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'sst'::app_role)
  AND EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
      AND p.sst_manager_id = company_sst_assignments.sst_manager_id
  )
);

-- Allow SST users to delete companies they manage
CREATE POLICY "SST can delete assigned companies"
ON public.companies
FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'sst'::app_role)
  AND EXISTS (
    SELECT 1 FROM company_sst_assignments csa
    JOIN profiles p ON p.sst_manager_id = csa.sst_manager_id
    WHERE csa.company_id = companies.id
      AND p.id = auth.uid()
  )
);
