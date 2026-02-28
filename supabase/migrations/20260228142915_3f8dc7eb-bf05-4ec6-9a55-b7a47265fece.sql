
-- Allow sales users to view their linked company
CREATE POLICY "Sales can view their company"
ON public.companies
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'sales'::app_role)
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.company_id = companies.id
  )
);

-- Allow sales users to view reports for their demo company
CREATE POLICY "Sales can view their company reports"
ON public.reports
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'sales'::app_role)
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.company_id = reports.company_id
  )
);

-- Allow sales to view report updates
CREATE POLICY "Sales can view their company report updates"
ON public.report_updates
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM reports r
    JOIN profiles p ON p.company_id = r.company_id
    WHERE r.id = report_updates.report_id
    AND p.id = auth.uid()
    AND has_role(auth.uid(), 'sales'::app_role)
  )
);

-- Allow sales to view report attachments
CREATE POLICY "Sales can view their company report attachments"
ON public.report_attachments
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'sales'::app_role)
  AND EXISTS (
    SELECT 1 FROM reports r
    JOIN profiles p ON p.company_id = r.company_id
    WHERE r.id = report_attachments.report_id
    AND p.id = auth.uid()
  )
);

-- Allow sales to view HSE-IT assessments
CREATE POLICY "Sales can view their company hseit assessments"
ON public.hseit_assessments
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'sales'::app_role)
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.company_id = hseit_assessments.company_id
  )
);

-- Allow sales to view HSE-IT responses
CREATE POLICY "Sales can view their company hseit responses"
ON public.hseit_responses
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'sales'::app_role)
  AND EXISTS (
    SELECT 1 FROM hseit_assessments ha
    JOIN profiles p ON p.company_id = ha.company_id
    WHERE ha.id = hseit_responses.assessment_id
    AND p.id = auth.uid()
  )
);

-- Allow sales to view HSE-IT departments
CREATE POLICY "Sales can view their company hseit departments"
ON public.hseit_departments
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'sales'::app_role)
  AND EXISTS (
    SELECT 1 FROM hseit_assessments ha
    JOIN profiles p ON p.company_id = ha.company_id
    WHERE ha.id = hseit_departments.assessment_id
    AND p.id = auth.uid()
  )
);

-- Allow sales to view burnout assessments
CREATE POLICY "Sales can view their company burnout assessments"
ON public.burnout_assessments
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'sales'::app_role)
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.company_id = burnout_assessments.company_id
  )
);

-- Allow sales to view burnout responses
CREATE POLICY "Sales can view their company burnout responses"
ON public.burnout_responses
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'sales'::app_role)
  AND EXISTS (
    SELECT 1 FROM burnout_assessments ba
    JOIN profiles p ON p.company_id = ba.company_id
    WHERE ba.id = burnout_responses.assessment_id
    AND p.id = auth.uid()
  )
);

-- Allow sales to view climate surveys
CREATE POLICY "Sales can view their company climate surveys"
ON public.climate_surveys
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'sales'::app_role)
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.company_id = climate_surveys.company_id
  )
);

-- Allow sales to view survey responses
CREATE POLICY "Sales can view their company survey responses"
ON public.survey_responses
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'sales'::app_role)
  AND EXISTS (
    SELECT 1 FROM climate_surveys cs
    JOIN profiles p ON p.company_id = cs.company_id
    WHERE cs.id = survey_responses.survey_id
    AND p.id = auth.uid()
  )
);

-- Allow sales to view survey answers
CREATE POLICY "Sales can view their company survey answers"
ON public.survey_answers
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'sales'::app_role)
  AND EXISTS (
    SELECT 1 FROM survey_responses sr
    JOIN climate_surveys cs ON cs.id = sr.survey_id
    JOIN profiles p ON p.company_id = cs.company_id
    WHERE sr.id = survey_answers.response_id
    AND p.id = auth.uid()
  )
);

-- Allow sales to view survey questions
CREATE POLICY "Sales can view their company survey questions"
ON public.survey_questions
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'sales'::app_role)
  AND EXISTS (
    SELECT 1 FROM climate_surveys cs
    JOIN profiles p ON p.company_id = cs.company_id
    WHERE cs.id = survey_questions.survey_id
    AND p.id = auth.uid()
  )
);

-- Allow sales to view survey departments
CREATE POLICY "Sales can view their company survey departments"
ON public.survey_departments
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'sales'::app_role)
  AND EXISTS (
    SELECT 1 FROM climate_surveys cs
    JOIN profiles p ON p.company_id = cs.company_id
    WHERE cs.id = survey_departments.survey_id
    AND p.id = auth.uid()
  )
);

-- Allow sales to view burnout departments
CREATE POLICY "Sales can view their company burnout departments"
ON public.burnout_departments
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'sales'::app_role)
  AND EXISTS (
    SELECT 1 FROM burnout_assessments ba
    JOIN profiles p ON p.company_id = ba.company_id
    WHERE ba.id = burnout_departments.assessment_id
    AND p.id = auth.uid()
  )
);
