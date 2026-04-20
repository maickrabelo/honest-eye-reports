
-- Helper function: verifica se a empresa NÃO tem SST atribuído
CREATE OR REPLACE FUNCTION public.company_has_no_sst(_company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.company_sst_assignments WHERE company_id = _company_id
  )
$$;

-- ============ HSE-IT ASSESSMENTS ============
CREATE POLICY "Companies without SST can insert HSE-IT assessments"
ON public.hseit_assessments FOR INSERT TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'company'::app_role)
  AND public.company_has_no_sst(company_id)
  AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND company_id = hseit_assessments.company_id)
);

CREATE POLICY "Companies without SST can update HSE-IT assessments"
ON public.hseit_assessments FOR UPDATE TO authenticated
USING (
  has_role(auth.uid(), 'company'::app_role)
  AND public.company_has_no_sst(company_id)
  AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND company_id = hseit_assessments.company_id)
);

CREATE POLICY "Companies without SST can delete HSE-IT assessments"
ON public.hseit_assessments FOR DELETE TO authenticated
USING (
  has_role(auth.uid(), 'company'::app_role)
  AND public.company_has_no_sst(company_id)
  AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND company_id = hseit_assessments.company_id)
);

-- HSE-IT departments policy already exists for company role; add gating for SST-less companies via update
-- The existing "Companies can manage their assessment departments" allows ALL for company role - we'll add a stricter gated version
-- Drop and recreate to add the no-SST gate
DROP POLICY IF EXISTS "Companies can manage their assessment departments" ON public.hseit_departments;

CREATE POLICY "Companies without SST can manage HSE-IT departments"
ON public.hseit_departments FOR ALL TO authenticated
USING (
  has_role(auth.uid(), 'company'::app_role)
  AND EXISTS (
    SELECT 1 FROM hseit_assessments ha
    JOIN profiles p ON p.company_id = ha.company_id
    WHERE ha.id = hseit_departments.assessment_id
      AND p.id = auth.uid()
      AND public.company_has_no_sst(ha.company_id)
  )
)
WITH CHECK (
  has_role(auth.uid(), 'company'::app_role)
  AND EXISTS (
    SELECT 1 FROM hseit_assessments ha
    JOIN profiles p ON p.company_id = ha.company_id
    WHERE ha.id = hseit_departments.assessment_id
      AND p.id = auth.uid()
      AND public.company_has_no_sst(ha.company_id)
  )
);

-- ============ COPSOQ ASSESSMENTS ============
CREATE POLICY "Companies without SST can insert COPSOQ assessments"
ON public.copsoq_assessments FOR INSERT TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'company'::app_role)
  AND public.company_has_no_sst(company_id)
  AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND company_id = copsoq_assessments.company_id)
);

CREATE POLICY "Companies without SST can update COPSOQ assessments"
ON public.copsoq_assessments FOR UPDATE TO authenticated
USING (
  has_role(auth.uid(), 'company'::app_role)
  AND public.company_has_no_sst(company_id)
  AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND company_id = copsoq_assessments.company_id)
);

CREATE POLICY "Companies without SST can delete COPSOQ assessments"
ON public.copsoq_assessments FOR DELETE TO authenticated
USING (
  has_role(auth.uid(), 'company'::app_role)
  AND public.company_has_no_sst(company_id)
  AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND company_id = copsoq_assessments.company_id)
);

-- COPSOQ departments: existing "Authenticated users can manage" is too permissive but we won't touch it.
-- Add a company-specific gated policy for clarity (still works alongside).
CREATE POLICY "Companies without SST can manage COPSOQ departments"
ON public.copsoq_departments FOR ALL TO authenticated
USING (
  has_role(auth.uid(), 'company'::app_role)
  AND EXISTS (
    SELECT 1 FROM copsoq_assessments ca
    JOIN profiles p ON p.company_id = ca.company_id
    WHERE ca.id = copsoq_departments.assessment_id
      AND p.id = auth.uid()
      AND public.company_has_no_sst(ca.company_id)
  )
)
WITH CHECK (
  has_role(auth.uid(), 'company'::app_role)
  AND EXISTS (
    SELECT 1 FROM copsoq_assessments ca
    JOIN profiles p ON p.company_id = ca.company_id
    WHERE ca.id = copsoq_departments.assessment_id
      AND p.id = auth.uid()
      AND public.company_has_no_sst(ca.company_id)
  )
);

-- ============ BURNOUT ASSESSMENTS ============
CREATE POLICY "Companies without SST can insert Burnout assessments"
ON public.burnout_assessments FOR INSERT TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'company'::app_role)
  AND public.company_has_no_sst(company_id)
  AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND company_id = burnout_assessments.company_id)
);

CREATE POLICY "Companies without SST can update Burnout assessments"
ON public.burnout_assessments FOR UPDATE TO authenticated
USING (
  has_role(auth.uid(), 'company'::app_role)
  AND public.company_has_no_sst(company_id)
  AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND company_id = burnout_assessments.company_id)
);

CREATE POLICY "Companies without SST can delete Burnout assessments"
ON public.burnout_assessments FOR DELETE TO authenticated
USING (
  has_role(auth.uid(), 'company'::app_role)
  AND public.company_has_no_sst(company_id)
  AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND company_id = burnout_assessments.company_id)
);

-- Burnout assessments SELECT for company role
CREATE POLICY "Companies can view their burnout assessments"
ON public.burnout_assessments FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'company'::app_role)
  AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND company_id = burnout_assessments.company_id)
);

-- Burnout departments
CREATE POLICY "Companies without SST can manage Burnout departments"
ON public.burnout_departments FOR ALL TO authenticated
USING (
  has_role(auth.uid(), 'company'::app_role)
  AND EXISTS (
    SELECT 1 FROM burnout_assessments ba
    JOIN profiles p ON p.company_id = ba.company_id
    WHERE ba.id = burnout_departments.assessment_id
      AND p.id = auth.uid()
      AND public.company_has_no_sst(ba.company_id)
  )
)
WITH CHECK (
  has_role(auth.uid(), 'company'::app_role)
  AND EXISTS (
    SELECT 1 FROM burnout_assessments ba
    JOIN profiles p ON p.company_id = ba.company_id
    WHERE ba.id = burnout_departments.assessment_id
      AND p.id = auth.uid()
      AND public.company_has_no_sst(ba.company_id)
  )
);

-- ============ CLIMATE SURVEYS — add SST gating to existing company policies ============
DROP POLICY IF EXISTS "Companies can insert their surveys" ON public.climate_surveys;
DROP POLICY IF EXISTS "Companies can update their surveys" ON public.climate_surveys;
DROP POLICY IF EXISTS "Companies can delete their surveys" ON public.climate_surveys;

CREATE POLICY "Companies without SST can insert their surveys"
ON public.climate_surveys FOR INSERT TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'company'::app_role)
  AND public.company_has_no_sst(company_id)
  AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND company_id = climate_surveys.company_id)
);

CREATE POLICY "Companies without SST can update their surveys"
ON public.climate_surveys FOR UPDATE TO authenticated
USING (
  has_role(auth.uid(), 'company'::app_role)
  AND public.company_has_no_sst(company_id)
  AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND company_id = climate_surveys.company_id)
);

CREATE POLICY "Companies without SST can delete their surveys"
ON public.climate_surveys FOR DELETE TO authenticated
USING (
  has_role(auth.uid(), 'company'::app_role)
  AND public.company_has_no_sst(company_id)
  AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND company_id = climate_surveys.company_id)
);
