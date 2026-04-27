-- Allow SST managers and their invited collaborators to manage HSE-IT departments
DROP POLICY IF EXISTS "SST can manage departments for assigned companies" ON public.hseit_departments;

CREATE POLICY "SST can manage departments for assigned companies"
ON public.hseit_departments
FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'sst'::app_role)
  AND EXISTS (
    SELECT 1
    FROM public.hseit_assessments ha
    JOIN public.company_sst_assignments csa ON csa.company_id = ha.company_id
    WHERE ha.id = hseit_departments.assessment_id
      AND public.user_in_sst_manager(auth.uid(), csa.sst_manager_id)
  )
)
WITH CHECK (
  public.has_role(auth.uid(), 'sst'::app_role)
  AND EXISTS (
    SELECT 1
    FROM public.hseit_assessments ha
    JOIN public.company_sst_assignments csa ON csa.company_id = ha.company_id
    WHERE ha.id = hseit_departments.assessment_id
      AND public.user_in_sst_manager(auth.uid(), csa.sst_manager_id)
  )
);

-- Allow SST managers and their invited collaborators to manage COPSOQ departments
DROP POLICY IF EXISTS "SST can manage COPSOQ departments for assigned companies" ON public.copsoq_departments;

CREATE POLICY "SST can manage COPSOQ departments for assigned companies"
ON public.copsoq_departments
FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'sst'::app_role)
  AND EXISTS (
    SELECT 1
    FROM public.copsoq_assessments ca
    JOIN public.company_sst_assignments csa ON csa.company_id = ca.company_id
    WHERE ca.id = copsoq_departments.assessment_id
      AND public.user_in_sst_manager(auth.uid(), csa.sst_manager_id)
  )
)
WITH CHECK (
  public.has_role(auth.uid(), 'sst'::app_role)
  AND EXISTS (
    SELECT 1
    FROM public.copsoq_assessments ca
    JOIN public.company_sst_assignments csa ON csa.company_id = ca.company_id
    WHERE ca.id = copsoq_departments.assessment_id
      AND public.user_in_sst_manager(auth.uid(), csa.sst_manager_id)
  )
);