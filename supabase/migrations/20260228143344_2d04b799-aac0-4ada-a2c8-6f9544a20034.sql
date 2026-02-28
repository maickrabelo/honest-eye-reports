
-- Allow sales to view HSE-IT answers
CREATE POLICY "Sales can view their company hseit answers"
ON public.hseit_answers
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'sales'::app_role)
  AND EXISTS (
    SELECT 1 FROM hseit_responses hr
    JOIN hseit_assessments ha ON ha.id = hr.assessment_id
    JOIN profiles p ON p.company_id = ha.company_id
    WHERE hr.id = hseit_answers.response_id
    AND p.id = auth.uid()
  )
);

-- Allow sales to view burnout answers
CREATE POLICY "Sales can view their company burnout answers"
ON public.burnout_answers
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'sales'::app_role)
  AND EXISTS (
    SELECT 1 FROM burnout_responses br
    JOIN burnout_assessments ba ON ba.id = br.assessment_id
    JOIN profiles p ON p.company_id = ba.company_id
    WHERE br.id = burnout_answers.response_id
    AND p.id = auth.uid()
  )
);
