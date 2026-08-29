
-- ============ helpers ============
CREATE TABLE public.ouvidoria_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  user_id uuid,
  email text NOT NULL,
  full_name text NOT NULL,
  job_title text,
  access_type text NOT NULL DEFAULT 'gestor',
  status text NOT NULL DEFAULT 'pending',
  invited_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX ouvidoria_users_company_email_idx ON public.ouvidoria_users (company_id, lower(email));
CREATE INDEX ouvidoria_users_user_idx ON public.ouvidoria_users (user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ouvidoria_users TO authenticated;
GRANT ALL ON public.ouvidoria_users TO service_role;
ALTER TABLE public.ouvidoria_users ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.ouvidoria_can_view(_company_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(auth.uid(), 'admin'::app_role)
    OR public.user_in_company(auth.uid(), _company_id)
    OR public.user_manages_company(auth.uid(), _company_id)
    OR EXISTS (
      SELECT 1 FROM public.ouvidoria_users ou
      WHERE ou.company_id = _company_id AND ou.user_id = auth.uid() AND ou.status = 'active'
    );
$$;

CREATE OR REPLACE FUNCTION public.ouvidoria_can_edit(_company_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.ouvidoria_can_view(_company_id)
    AND NOT EXISTS (
      SELECT 1 FROM public.ouvidoria_users ou
      WHERE ou.company_id = _company_id AND ou.user_id = auth.uid()
        AND ou.access_type = 'auditor' AND ou.status = 'active'
    );
$$;

CREATE POLICY "ouvidoria_users_select" ON public.ouvidoria_users
  FOR SELECT TO authenticated USING (public.ouvidoria_can_view(company_id));
CREATE POLICY "ouvidoria_users_manage" ON public.ouvidoria_users
  FOR ALL TO authenticated
  USING (public.ouvidoria_can_edit(company_id))
  WITH CHECK (public.ouvidoria_can_edit(company_id));

CREATE TRIGGER ouvidoria_users_updated_at BEFORE UPDATE ON public.ouvidoria_users
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============ access logs ============
CREATE TABLE public.ouvidoria_access_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid,
  channel text NOT NULL DEFAULT 'smart',
  report_id uuid,
  tracking_code text NOT NULL,
  success boolean NOT NULL DEFAULT true,
  failure_reason text,
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ouvidoria_access_logs_report_idx ON public.ouvidoria_access_logs (report_id, created_at DESC);

GRANT SELECT ON public.ouvidoria_access_logs TO authenticated;
GRANT ALL ON public.ouvidoria_access_logs TO service_role;
ALTER TABLE public.ouvidoria_access_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ouvidoria_access_logs_select" ON public.ouvidoria_access_logs
  FOR SELECT TO authenticated USING (company_id IS NOT NULL AND public.ouvidoria_can_view(company_id));

-- ============ internal notes ============
CREATE TABLE public.ouvidoria_internal_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  channel text NOT NULL DEFAULT 'smart',
  report_id uuid NOT NULL,
  author_user_id uuid,
  author_name text,
  author_role_title text,
  note text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ouvidoria_internal_notes_report_idx ON public.ouvidoria_internal_notes (report_id, created_at);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ouvidoria_internal_notes TO authenticated;
GRANT ALL ON public.ouvidoria_internal_notes TO service_role;
ALTER TABLE public.ouvidoria_internal_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ouvidoria_notes_select" ON public.ouvidoria_internal_notes
  FOR SELECT TO authenticated USING (public.ouvidoria_can_view(company_id));
CREATE POLICY "ouvidoria_notes_write" ON public.ouvidoria_internal_notes
  FOR ALL TO authenticated
  USING (public.ouvidoria_can_edit(company_id))
  WITH CHECK (public.ouvidoria_can_edit(company_id));

-- ============ tasks ============
CREATE TABLE public.ouvidoria_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  channel text,
  report_id uuid,
  report_code text,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'todo',
  due_date date,
  position integer NOT NULL DEFAULT 0,
  created_by uuid,
  completed_at timestamptz,
  exported_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ouvidoria_tasks_company_idx ON public.ouvidoria_tasks (company_id, status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ouvidoria_tasks TO authenticated;
GRANT ALL ON public.ouvidoria_tasks TO service_role;
ALTER TABLE public.ouvidoria_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ouvidoria_tasks_select" ON public.ouvidoria_tasks
  FOR SELECT TO authenticated USING (public.ouvidoria_can_view(company_id));
CREATE POLICY "ouvidoria_tasks_write" ON public.ouvidoria_tasks
  FOR ALL TO authenticated
  USING (public.ouvidoria_can_edit(company_id))
  WITH CHECK (public.ouvidoria_can_edit(company_id));

CREATE TRIGGER ouvidoria_tasks_updated_at BEFORE UPDATE ON public.ouvidoria_tasks
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TABLE public.ouvidoria_task_assignees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.ouvidoria_tasks(id) ON DELETE CASCADE,
  ouvidoria_user_id uuid REFERENCES public.ouvidoria_users(id) ON DELETE CASCADE,
  user_id uuid,
  display_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ouvidoria_task_assignees_task_idx ON public.ouvidoria_task_assignees (task_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ouvidoria_task_assignees TO authenticated;
GRANT ALL ON public.ouvidoria_task_assignees TO service_role;
ALTER TABLE public.ouvidoria_task_assignees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ouvidoria_task_assignees_select" ON public.ouvidoria_task_assignees
  FOR SELECT TO authenticated USING (EXISTS (
    SELECT 1 FROM public.ouvidoria_tasks t WHERE t.id = task_id AND public.ouvidoria_can_view(t.company_id)
  ));
CREATE POLICY "ouvidoria_task_assignees_write" ON public.ouvidoria_task_assignees
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.ouvidoria_tasks t WHERE t.id = task_id AND public.ouvidoria_can_edit(t.company_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.ouvidoria_tasks t WHERE t.id = task_id AND public.ouvidoria_can_edit(t.company_id)));

CREATE TABLE public.ouvidoria_task_checklist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.ouvidoria_tasks(id) ON DELETE CASCADE,
  content text NOT NULL,
  is_done boolean NOT NULL DEFAULT false,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ouvidoria_task_checklist_task_idx ON public.ouvidoria_task_checklist_items (task_id, position);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ouvidoria_task_checklist_items TO authenticated;
GRANT ALL ON public.ouvidoria_task_checklist_items TO service_role;
ALTER TABLE public.ouvidoria_task_checklist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ouvidoria_checklist_select" ON public.ouvidoria_task_checklist_items
  FOR SELECT TO authenticated USING (EXISTS (
    SELECT 1 FROM public.ouvidoria_tasks t WHERE t.id = task_id AND public.ouvidoria_can_view(t.company_id)
  ));
CREATE POLICY "ouvidoria_checklist_write" ON public.ouvidoria_task_checklist_items
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.ouvidoria_tasks t WHERE t.id = task_id AND public.ouvidoria_can_edit(t.company_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.ouvidoria_tasks t WHERE t.id = task_id AND public.ouvidoria_can_edit(t.company_id)));

CREATE TRIGGER ouvidoria_checklist_updated_at BEFORE UPDATE ON public.ouvidoria_task_checklist_items
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============ mailing list / campaigns ============
CREATE TABLE public.ouvidoria_mailing_list (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  email text NOT NULL,
  full_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX ouvidoria_mailing_company_email_idx ON public.ouvidoria_mailing_list (company_id, lower(email));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ouvidoria_mailing_list TO authenticated;
GRANT ALL ON public.ouvidoria_mailing_list TO service_role;
ALTER TABLE public.ouvidoria_mailing_list ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ouvidoria_mailing_select" ON public.ouvidoria_mailing_list
  FOR SELECT TO authenticated USING (public.ouvidoria_can_view(company_id));
CREATE POLICY "ouvidoria_mailing_write" ON public.ouvidoria_mailing_list
  FOR ALL TO authenticated
  USING (public.ouvidoria_can_edit(company_id))
  WITH CHECK (public.ouvidoria_can_edit(company_id));

CREATE TABLE public.ouvidoria_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  channel_url text,
  recipients_count integer NOT NULL DEFAULT 0,
  sent_count integer NOT NULL DEFAULT 0,
  failed_count integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'sent',
  error_message text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ouvidoria_campaigns_company_idx ON public.ouvidoria_campaigns (company_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ouvidoria_campaigns TO authenticated;
GRANT ALL ON public.ouvidoria_campaigns TO service_role;
ALTER TABLE public.ouvidoria_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ouvidoria_campaigns_select" ON public.ouvidoria_campaigns
  FOR SELECT TO authenticated USING (public.ouvidoria_can_view(company_id));
CREATE POLICY "ouvidoria_campaigns_write" ON public.ouvidoria_campaigns
  FOR ALL TO authenticated
  USING (public.ouvidoria_can_edit(company_id))
  WITH CHECK (public.ouvidoria_can_edit(company_id));

-- ============ author / visibility on updates ============
ALTER TABLE public.beta_ouvidoria_updates
  ADD COLUMN IF NOT EXISTS author_user_id uuid,
  ADD COLUMN IF NOT EXISTS author_name text,
  ADD COLUMN IF NOT EXISTS author_role_title text,
  ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'public';

ALTER TABLE public.report_updates
  ADD COLUMN IF NOT EXISTS author_name text,
  ADD COLUMN IF NOT EXISTS author_role_title text,
  ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'public';
