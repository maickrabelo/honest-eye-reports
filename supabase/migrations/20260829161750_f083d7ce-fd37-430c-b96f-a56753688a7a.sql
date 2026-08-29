ALTER TABLE public.ouvidoria_task_assignees
  ADD COLUMN IF NOT EXISTS assignee_role text NOT NULL DEFAULT 'responsavel';

ALTER TABLE public.ouvidoria_task_assignees
  ADD CONSTRAINT ouvidoria_task_assignees_role_check
  CHECK (assignee_role IN ('responsavel', 'envolvido'));

CREATE UNIQUE INDEX IF NOT EXISTS ouvidoria_task_assignees_unique_person
  ON public.ouvidoria_task_assignees (task_id, ouvidoria_user_id, assignee_role)
  WHERE ouvidoria_user_id IS NOT NULL;