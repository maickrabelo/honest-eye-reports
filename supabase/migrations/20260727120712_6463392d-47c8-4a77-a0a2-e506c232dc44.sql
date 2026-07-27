CREATE TABLE public.clasa_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  start_date timestamptz,
  end_date timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  collection_mode text NOT NULL DEFAULT 'form',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.clasa_departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid NOT NULL REFERENCES public.clasa_assessments(id) ON DELETE CASCADE,
  name text NOT NULL,
  employee_count integer NOT NULL DEFAULT 0,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.clasa_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid NOT NULL REFERENCES public.clasa_assessments(id) ON DELETE CASCADE,
  department text,
  respondent_token text NOT NULL,
  demographics jsonb DEFAULT '{}'::jsonb,
  open_feedback text,
  total_score integer,
  risk_level text,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.clasa_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id uuid NOT NULL REFERENCES public.clasa_responses(id) ON DELETE CASCADE,
  question_number integer NOT NULL,
  answer_value integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_clasa_departments_assessment ON public.clasa_departments(assessment_id);
CREATE INDEX idx_clasa_responses_assessment ON public.clasa_responses(assessment_id);
CREATE INDEX idx_clasa_answers_response ON public.clasa_answers(response_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.clasa_assessments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clasa_departments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clasa_responses TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clasa_answers TO authenticated;
GRANT SELECT ON public.clasa_assessments TO anon;
GRANT SELECT ON public.clasa_departments TO anon;
GRANT SELECT, INSERT ON public.clasa_responses TO anon;
GRANT SELECT, INSERT ON public.clasa_answers TO anon;
GRANT ALL ON public.clasa_assessments TO service_role;
GRANT ALL ON public.clasa_departments TO service_role;
GRANT ALL ON public.clasa_responses TO service_role;
GRANT ALL ON public.clasa_answers TO service_role;

ALTER TABLE public.clasa_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clasa_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clasa_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clasa_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "clasa_assessments_manage" ON public.clasa_assessments
FOR ALL TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.user_in_company(auth.uid(), company_id)
  OR public.user_manages_company(auth.uid(), company_id)
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.user_in_company(auth.uid(), company_id)
  OR public.user_manages_company(auth.uid(), company_id)
);

CREATE POLICY "clasa_assessments_public_read" ON public.clasa_assessments
FOR SELECT TO anon, authenticated
USING (is_active = true);

CREATE POLICY "clasa_departments_manage" ON public.clasa_departments
FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.clasa_assessments a
  WHERE a.id = assessment_id AND (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.user_in_company(auth.uid(), a.company_id)
    OR public.user_manages_company(auth.uid(), a.company_id)
  )
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.clasa_assessments a
  WHERE a.id = assessment_id AND (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.user_in_company(auth.uid(), a.company_id)
    OR public.user_manages_company(auth.uid(), a.company_id)
  )
));

CREATE POLICY "clasa_departments_public_read" ON public.clasa_departments
FOR SELECT TO anon, authenticated
USING (EXISTS (
  SELECT 1 FROM public.clasa_assessments a
  WHERE a.id = assessment_id AND a.is_active = true
));

CREATE POLICY "clasa_responses_public_insert" ON public.clasa_responses
FOR INSERT TO anon, authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM public.clasa_assessments a
  WHERE a.id = assessment_id AND a.is_active = true
));

CREATE POLICY "clasa_responses_read" ON public.clasa_responses
FOR SELECT TO anon, authenticated
USING (EXISTS (
  SELECT 1 FROM public.clasa_assessments a
  WHERE a.id = assessment_id AND (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.user_in_company(auth.uid(), a.company_id)
    OR public.user_manages_company(auth.uid(), a.company_id)
  )
));

CREATE POLICY "clasa_answers_public_insert" ON public.clasa_answers
FOR INSERT TO anon, authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM public.clasa_responses r
  JOIN public.clasa_assessments a ON a.id = r.assessment_id
  WHERE r.id = response_id AND a.is_active = true
));

CREATE POLICY "clasa_answers_read" ON public.clasa_answers
FOR SELECT TO anon, authenticated
USING (EXISTS (
  SELECT 1 FROM public.clasa_responses r
  JOIN public.clasa_assessments a ON a.id = r.assessment_id
  WHERE r.id = response_id AND (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.user_in_company(auth.uid(), a.company_id)
    OR public.user_manages_company(auth.uid(), a.company_id)
  )
));

CREATE TRIGGER clasa_assessments_updated_at
BEFORE UPDATE ON public.clasa_assessments
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();