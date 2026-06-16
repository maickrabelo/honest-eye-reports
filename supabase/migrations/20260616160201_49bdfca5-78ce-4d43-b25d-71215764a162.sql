
-- Extensões para cron
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Helper: trigger de updated_at já existe (public.handle_updated_at)

-- =========================================
-- pulse_surveys
-- =========================================
CREATE TABLE public.pulse_surveys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  frequency text NOT NULL CHECK (frequency IN ('weekly','biweekly','monthly','quarterly','semiannual')),
  use_emojis boolean NOT NULL DEFAULT true,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','archived')),
  manager_email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.pulse_surveys TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pulse_surveys TO authenticated;
GRANT ALL ON public.pulse_surveys TO service_role;

ALTER TABLE public.pulse_surveys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read active pulse surveys"
  ON public.pulse_surveys FOR SELECT TO anon, authenticated
  USING (status = 'active');

CREATE POLICY "Admin/sales full read pulse surveys"
  ON public.pulse_surveys FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'sales'::app_role));

CREATE POLICY "Company users read own pulse surveys"
  ON public.pulse_surveys FOR SELECT TO authenticated
  USING (public.user_in_company(auth.uid(), company_id));

CREATE POLICY "SST manager read assigned pulse surveys"
  ON public.pulse_surveys FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.company_sst_assignments csa
    WHERE csa.company_id = pulse_surveys.company_id
      AND public.user_in_sst_manager(auth.uid(), csa.sst_manager_id)
  ));

CREATE POLICY "Admin manage pulse surveys"
  ON public.pulse_surveys FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Company users manage own pulse surveys"
  ON public.pulse_surveys FOR ALL TO authenticated
  USING (public.user_in_company(auth.uid(), company_id))
  WITH CHECK (public.user_in_company(auth.uid(), company_id));

CREATE POLICY "SST manager manage assigned pulse surveys"
  ON public.pulse_surveys FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.company_sst_assignments csa
    WHERE csa.company_id = pulse_surveys.company_id
      AND public.user_in_sst_manager(auth.uid(), csa.sst_manager_id)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.company_sst_assignments csa
    WHERE csa.company_id = pulse_surveys.company_id
      AND public.user_in_sst_manager(auth.uid(), csa.sst_manager_id)
  ));

CREATE TRIGGER trg_pulse_surveys_updated_at
  BEFORE UPDATE ON public.pulse_surveys
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =========================================
-- pulse_survey_questions
-- =========================================
CREATE TABLE public.pulse_survey_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pulse_survey_id uuid NOT NULL REFERENCES public.pulse_surveys(id) ON DELETE CASCADE,
  text text NOT NULL,
  category text,
  order_index integer NOT NULL DEFAULT 0,
  required boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.pulse_survey_questions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pulse_survey_questions TO authenticated;
GRANT ALL ON public.pulse_survey_questions TO service_role;

ALTER TABLE public.pulse_survey_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read questions of active surveys"
  ON public.pulse_survey_questions FOR SELECT TO anon, authenticated
  USING (EXISTS (
    SELECT 1 FROM public.pulse_surveys ps
    WHERE ps.id = pulse_survey_questions.pulse_survey_id AND ps.status = 'active'
  ));

CREATE POLICY "Manage questions follows survey"
  ON public.pulse_survey_questions FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.pulse_surveys ps
    WHERE ps.id = pulse_survey_questions.pulse_survey_id
      AND (
        public.has_role(auth.uid(), 'admin'::app_role)
        OR public.user_in_company(auth.uid(), ps.company_id)
        OR EXISTS (
          SELECT 1 FROM public.company_sst_assignments csa
          WHERE csa.company_id = ps.company_id
            AND public.user_in_sst_manager(auth.uid(), csa.sst_manager_id)
        )
      )
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.pulse_surveys ps
    WHERE ps.id = pulse_survey_questions.pulse_survey_id
      AND (
        public.has_role(auth.uid(), 'admin'::app_role)
        OR public.user_in_company(auth.uid(), ps.company_id)
        OR EXISTS (
          SELECT 1 FROM public.company_sst_assignments csa
          WHERE csa.company_id = ps.company_id
            AND public.user_in_sst_manager(auth.uid(), csa.sst_manager_id)
        )
      )
  ));

-- =========================================
-- pulse_survey_cycles
-- =========================================
CREATE TABLE public.pulse_survey_cycles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pulse_survey_id uuid NOT NULL REFERENCES public.pulse_surveys(id) ON DELETE CASCADE,
  cycle_number integer NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz NOT NULL,
  closed_at timestamptz,
  total_responses integer NOT NULL DEFAULT 0,
  summary_email_sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_pulse_cycles_survey ON public.pulse_survey_cycles(pulse_survey_id, cycle_number DESC);
CREATE INDEX idx_pulse_cycles_open ON public.pulse_survey_cycles(closed_at, ended_at) WHERE closed_at IS NULL;

GRANT SELECT ON public.pulse_survey_cycles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pulse_survey_cycles TO authenticated;
GRANT ALL ON public.pulse_survey_cycles TO service_role;

ALTER TABLE public.pulse_survey_cycles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read cycles of active surveys"
  ON public.pulse_survey_cycles FOR SELECT TO anon, authenticated
  USING (EXISTS (
    SELECT 1 FROM public.pulse_surveys ps
    WHERE ps.id = pulse_survey_cycles.pulse_survey_id AND ps.status = 'active'
  ));

CREATE POLICY "Manage cycles follows survey"
  ON public.pulse_survey_cycles FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.pulse_surveys ps
    WHERE ps.id = pulse_survey_cycles.pulse_survey_id
      AND (
        public.has_role(auth.uid(), 'admin'::app_role)
        OR public.user_in_company(auth.uid(), ps.company_id)
        OR EXISTS (
          SELECT 1 FROM public.company_sst_assignments csa
          WHERE csa.company_id = ps.company_id
            AND public.user_in_sst_manager(auth.uid(), csa.sst_manager_id)
        )
      )
  ))
  WITH CHECK (true);

-- =========================================
-- pulse_survey_departments
-- =========================================
CREATE TABLE public.pulse_survey_departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pulse_survey_id uuid NOT NULL REFERENCES public.pulse_surveys(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.pulse_survey_departments TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pulse_survey_departments TO authenticated;
GRANT ALL ON public.pulse_survey_departments TO service_role;

ALTER TABLE public.pulse_survey_departments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read departments of active surveys"
  ON public.pulse_survey_departments FOR SELECT TO anon, authenticated
  USING (EXISTS (
    SELECT 1 FROM public.pulse_surveys ps
    WHERE ps.id = pulse_survey_departments.pulse_survey_id AND ps.status = 'active'
  ));

CREATE POLICY "Manage departments follows survey"
  ON public.pulse_survey_departments FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.pulse_surveys ps
    WHERE ps.id = pulse_survey_departments.pulse_survey_id
      AND (
        public.has_role(auth.uid(), 'admin'::app_role)
        OR public.user_in_company(auth.uid(), ps.company_id)
        OR EXISTS (
          SELECT 1 FROM public.company_sst_assignments csa
          WHERE csa.company_id = ps.company_id
            AND public.user_in_sst_manager(auth.uid(), csa.sst_manager_id)
        )
      )
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.pulse_surveys ps
    WHERE ps.id = pulse_survey_departments.pulse_survey_id
      AND (
        public.has_role(auth.uid(), 'admin'::app_role)
        OR public.user_in_company(auth.uid(), ps.company_id)
        OR EXISTS (
          SELECT 1 FROM public.company_sst_assignments csa
          WHERE csa.company_id = ps.company_id
            AND public.user_in_sst_manager(auth.uid(), csa.sst_manager_id)
        )
      )
  ));

-- =========================================
-- pulse_survey_responses
-- =========================================
CREATE TABLE public.pulse_survey_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id uuid NOT NULL REFERENCES public.pulse_survey_cycles(id) ON DELETE CASCADE,
  pulse_survey_id uuid NOT NULL REFERENCES public.pulse_surveys(id) ON DELETE CASCADE,
  department_name text,
  submitted_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_pulse_responses_cycle ON public.pulse_survey_responses(cycle_id);

GRANT SELECT, INSERT ON public.pulse_survey_responses TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pulse_survey_responses TO authenticated;
GRANT ALL ON public.pulse_survey_responses TO service_role;

ALTER TABLE public.pulse_survey_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public insert response to open cycle"
  ON public.pulse_survey_responses FOR INSERT TO anon, authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.pulse_survey_cycles c
    JOIN public.pulse_surveys ps ON ps.id = c.pulse_survey_id
    WHERE c.id = pulse_survey_responses.cycle_id
      AND c.closed_at IS NULL
      AND c.ended_at > now()
      AND ps.status = 'active'
      AND ps.id = pulse_survey_responses.pulse_survey_id
  ));

CREATE POLICY "Read responses follows survey"
  ON public.pulse_survey_responses FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.pulse_surveys ps
    WHERE ps.id = pulse_survey_responses.pulse_survey_id
      AND (
        public.has_role(auth.uid(), 'admin'::app_role)
        OR public.has_role(auth.uid(), 'sales'::app_role)
        OR public.user_in_company(auth.uid(), ps.company_id)
        OR EXISTS (
          SELECT 1 FROM public.company_sst_assignments csa
          WHERE csa.company_id = ps.company_id
            AND public.user_in_sst_manager(auth.uid(), csa.sst_manager_id)
        )
      )
  ));

-- =========================================
-- pulse_survey_answers
-- =========================================
CREATE TABLE public.pulse_survey_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id uuid NOT NULL REFERENCES public.pulse_survey_responses(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.pulse_survey_questions(id) ON DELETE CASCADE,
  score smallint NOT NULL CHECK (score BETWEEN 1 AND 5),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_pulse_answers_response ON public.pulse_survey_answers(response_id);
CREATE INDEX idx_pulse_answers_question ON public.pulse_survey_answers(question_id);

GRANT SELECT, INSERT ON public.pulse_survey_answers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pulse_survey_answers TO authenticated;
GRANT ALL ON public.pulse_survey_answers TO service_role;

ALTER TABLE public.pulse_survey_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public insert answer to open cycle"
  ON public.pulse_survey_answers FOR INSERT TO anon, authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.pulse_survey_responses r
    JOIN public.pulse_survey_cycles c ON c.id = r.cycle_id
    WHERE r.id = pulse_survey_answers.response_id
      AND c.closed_at IS NULL
      AND c.ended_at > now()
  ));

CREATE POLICY "Read answers follows survey"
  ON public.pulse_survey_answers FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.pulse_survey_responses r
    JOIN public.pulse_surveys ps ON ps.id = r.pulse_survey_id
    WHERE r.id = pulse_survey_answers.response_id
      AND (
        public.has_role(auth.uid(), 'admin'::app_role)
        OR public.has_role(auth.uid(), 'sales'::app_role)
        OR public.user_in_company(auth.uid(), ps.company_id)
        OR EXISTS (
          SELECT 1 FROM public.company_sst_assignments csa
          WHERE csa.company_id = ps.company_id
            AND public.user_in_sst_manager(auth.uid(), csa.sst_manager_id)
        )
      )
  ));

-- =========================================
-- Helper: criar próximo ciclo
-- =========================================
CREATE OR REPLACE FUNCTION public.pulse_cycle_duration(_frequency text)
RETURNS interval
LANGUAGE sql IMMUTABLE
AS $$
  SELECT CASE _frequency
    WHEN 'weekly' THEN interval '7 days'
    WHEN 'biweekly' THEN interval '14 days'
    WHEN 'monthly' THEN interval '1 month'
    WHEN 'quarterly' THEN interval '3 months'
    WHEN 'semiannual' THEN interval '6 months'
    ELSE interval '7 days'
  END
$$;

CREATE OR REPLACE FUNCTION public.pulse_create_next_cycle(_survey_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _freq text;
  _last_number integer;
  _new_id uuid;
  _starts_at timestamptz;
  _duration interval;
BEGIN
  SELECT frequency INTO _freq FROM public.pulse_surveys WHERE id = _survey_id;
  IF _freq IS NULL THEN RETURN NULL; END IF;

  _duration := public.pulse_cycle_duration(_freq);

  SELECT COALESCE(MAX(cycle_number), 0) INTO _last_number
  FROM public.pulse_survey_cycles WHERE pulse_survey_id = _survey_id;

  _starts_at := now();
  INSERT INTO public.pulse_survey_cycles (pulse_survey_id, cycle_number, started_at, ended_at)
  VALUES (_survey_id, _last_number + 1, _starts_at, _starts_at + _duration)
  RETURNING id INTO _new_id;

  RETURN _new_id;
END;
$$;

-- Trigger: ao criar uma pulse_survey ativa, gera o primeiro ciclo
CREATE OR REPLACE FUNCTION public.pulse_surveys_after_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'active' THEN
    PERFORM public.pulse_create_next_cycle(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_pulse_surveys_first_cycle
  AFTER INSERT ON public.pulse_surveys
  FOR EACH ROW EXECUTE FUNCTION public.pulse_surveys_after_insert();
