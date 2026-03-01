
-- COPSOQ Assessments
CREATE TABLE public.copsoq_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id),
  title text NOT NULL,
  description text,
  start_date timestamptz,
  end_date timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.copsoq_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all COPSOQ assessments" ON public.copsoq_assessments FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Public can view active COPSOQ assessments" ON public.copsoq_assessments FOR SELECT USING (is_active = true);
CREATE POLICY "SST can view assigned company COPSOQ assessments" ON public.copsoq_assessments FOR SELECT USING (has_role(auth.uid(), 'sst') AND EXISTS (SELECT 1 FROM profiles p JOIN company_sst_assignments csa ON csa.sst_manager_id = p.sst_manager_id WHERE p.id = auth.uid() AND csa.company_id = copsoq_assessments.company_id));
CREATE POLICY "SST can insert COPSOQ assessments for assigned companies" ON public.copsoq_assessments FOR INSERT WITH CHECK (has_role(auth.uid(), 'sst') AND EXISTS (SELECT 1 FROM profiles p JOIN company_sst_assignments csa ON csa.sst_manager_id = p.sst_manager_id WHERE p.id = auth.uid() AND csa.company_id = copsoq_assessments.company_id));
CREATE POLICY "SST can update COPSOQ assessments for assigned companies" ON public.copsoq_assessments FOR UPDATE USING (has_role(auth.uid(), 'sst') AND EXISTS (SELECT 1 FROM profiles p JOIN company_sst_assignments csa ON csa.sst_manager_id = p.sst_manager_id WHERE p.id = auth.uid() AND csa.company_id = copsoq_assessments.company_id));
CREATE POLICY "SST can delete COPSOQ assessments for assigned companies" ON public.copsoq_assessments FOR DELETE USING (has_role(auth.uid(), 'sst') AND EXISTS (SELECT 1 FROM profiles p JOIN company_sst_assignments csa ON csa.sst_manager_id = p.sst_manager_id WHERE p.id = auth.uid() AND csa.company_id = copsoq_assessments.company_id));
CREATE POLICY "Companies can view their COPSOQ assessments" ON public.copsoq_assessments FOR SELECT USING (has_role(auth.uid(), 'company') AND EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.company_id = copsoq_assessments.company_id));
CREATE POLICY "Sales can view their company COPSOQ assessments" ON public.copsoq_assessments FOR SELECT USING (has_role(auth.uid(), 'sales') AND EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.company_id = copsoq_assessments.company_id));

-- COPSOQ Departments
CREATE TABLE public.copsoq_departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid NOT NULL REFERENCES public.copsoq_assessments(id) ON DELETE CASCADE,
  name text NOT NULL,
  employee_count integer DEFAULT 0,
  order_index integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.copsoq_departments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read COPSOQ departments" ON public.copsoq_departments FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage COPSOQ departments" ON public.copsoq_departments FOR ALL USING (true) WITH CHECK (true);

-- COPSOQ Responses
CREATE TABLE public.copsoq_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid NOT NULL REFERENCES public.copsoq_assessments(id),
  department text,
  respondent_token text NOT NULL,
  demographics jsonb DEFAULT '{}'::jsonb,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.copsoq_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert COPSOQ responses" ON public.copsoq_responses FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can read COPSOQ responses" ON public.copsoq_responses FOR SELECT USING (true);
CREATE POLICY "Admins can view all COPSOQ responses" ON public.copsoq_responses FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "SST can view assigned company COPSOQ responses" ON public.copsoq_responses FOR SELECT USING (has_role(auth.uid(), 'sst') AND EXISTS (SELECT 1 FROM copsoq_assessments ca JOIN profiles p ON p.id = auth.uid() JOIN company_sst_assignments csa ON csa.sst_manager_id = p.sst_manager_id WHERE ca.id = copsoq_responses.assessment_id AND csa.company_id = ca.company_id));
CREATE POLICY "Sales can view their company COPSOQ responses" ON public.copsoq_responses FOR SELECT USING (has_role(auth.uid(), 'sales') AND EXISTS (SELECT 1 FROM copsoq_assessments ca JOIN profiles p ON p.company_id = ca.company_id WHERE ca.id = copsoq_responses.assessment_id AND p.id = auth.uid()));

-- COPSOQ Answers
CREATE TABLE public.copsoq_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id uuid NOT NULL REFERENCES public.copsoq_responses(id) ON DELETE CASCADE,
  question_number integer NOT NULL,
  answer_value integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.copsoq_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert COPSOQ answers" ON public.copsoq_answers FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can read COPSOQ answers" ON public.copsoq_answers FOR SELECT USING (true);
CREATE POLICY "Admins can view all COPSOQ answers" ON public.copsoq_answers FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "SST can view assigned company COPSOQ answers" ON public.copsoq_answers FOR SELECT USING (has_role(auth.uid(), 'sst') AND EXISTS (SELECT 1 FROM copsoq_responses cr JOIN copsoq_assessments ca ON ca.id = cr.assessment_id JOIN profiles p ON p.id = auth.uid() JOIN company_sst_assignments csa ON csa.sst_manager_id = p.sst_manager_id WHERE cr.id = copsoq_answers.response_id AND csa.company_id = ca.company_id));
CREATE POLICY "Sales can view their company COPSOQ answers" ON public.copsoq_answers FOR SELECT USING (has_role(auth.uid(), 'sales') AND EXISTS (SELECT 1 FROM copsoq_responses cr JOIN copsoq_assessments ca ON ca.id = cr.assessment_id JOIN profiles p ON p.company_id = ca.company_id WHERE cr.id = copsoq_answers.response_id AND p.id = auth.uid()));
