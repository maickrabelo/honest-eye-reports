-- Allow SST managers to manage Burnout departments for assigned companies
CREATE POLICY "SST can manage Burnout departments for assigned companies"
ON public.burnout_departments
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'sst'::app_role) AND EXISTS (
    SELECT 1
    FROM public.burnout_assessments ba
    JOIN public.profiles p ON p.id = auth.uid()
    JOIN public.company_sst_assignments csa ON csa.sst_manager_id = p.sst_manager_id
    WHERE ba.id = burnout_departments.assessment_id
      AND csa.company_id = ba.company_id
  )
)
WITH CHECK (
  has_role(auth.uid(), 'sst'::app_role) AND EXISTS (
    SELECT 1
    FROM public.burnout_assessments ba
    JOIN public.profiles p ON p.id = auth.uid()
    JOIN public.company_sst_assignments csa ON csa.sst_manager_id = p.sst_manager_id
    WHERE ba.id = burnout_departments.assessment_id
      AND csa.company_id = ba.company_id
  )
);

-- Allow SST managers to manage COPSOQ departments for assigned companies
CREATE POLICY "SST can manage COPSOQ departments for assigned companies"
ON public.copsoq_departments
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'sst'::app_role) AND EXISTS (
    SELECT 1
    FROM public.copsoq_assessments ca
    JOIN public.profiles p ON p.id = auth.uid()
    JOIN public.company_sst_assignments csa ON csa.sst_manager_id = p.sst_manager_id
    WHERE ca.id = copsoq_departments.assessment_id
      AND csa.company_id = ca.company_id
  )
)
WITH CHECK (
  has_role(auth.uid(), 'sst'::app_role) AND EXISTS (
    SELECT 1
    FROM public.copsoq_assessments ca
    JOIN public.profiles p ON p.id = auth.uid()
    JOIN public.company_sst_assignments csa ON csa.sst_manager_id = p.sst_manager_id
    WHERE ca.id = copsoq_departments.assessment_id
      AND csa.company_id = ca.company_id
  )
);