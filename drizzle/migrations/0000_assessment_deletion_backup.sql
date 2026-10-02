CREATE TABLE public.deleted_assessments_backup (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_type text NOT NULL,
  assessment_id uuid NOT NULL,
  company_id uuid,
  title text,
  responses_count integer NOT NULL DEFAULT 0,
  payload jsonb NOT NULL,
  deleted_by uuid,
  deleted_at timestamptz NOT NULL DEFAULT now(),
  restored_at timestamptz
);
GRANT SELECT ON public.deleted_assessments_backup TO authenticated;
GRANT ALL ON public.deleted_assessments_backup TO service_role;
ALTER TABLE public.deleted_assessments_backup ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view deleted backups" ON public.deleted_assessments_backup
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE INDEX ON public.deleted_assessments_backup (company_id);
CREATE INDEX ON public.deleted_assessments_backup (assessment_id);

CREATE OR REPLACE FUNCTION public.backup_assessment_before_delete()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _type text := TG_ARGV[0];
  _fk text := TG_ARGV[1];
  _payload jsonb;
  _deps jsonb; _resps jsonb; _answers jsonb; _questions jsonb := '[]'::jsonb;
  _count int;
BEGIN
  EXECUTE format('SELECT coalesce(jsonb_agg(to_jsonb(d)), ''[]'') FROM %I d WHERE d.%I = $1', _type || '_departments', _fk) INTO _deps USING OLD.id;
  EXECUTE format('SELECT coalesce(jsonb_agg(to_jsonb(r)), ''[]''), count(*) FROM %I r WHERE r.%I = $1', _type || '_responses', _fk) INTO _resps, _count USING OLD.id;
  EXECUTE format('SELECT coalesce(jsonb_agg(to_jsonb(a)), ''[]'') FROM %I a WHERE a.response_id IN (SELECT id FROM %I WHERE %I = $1)', _type || '_answers', _type || '_responses', _fk) INTO _answers USING OLD.id;
  IF _type = 'survey' THEN
    SELECT coalesce(jsonb_agg(to_jsonb(q)), '[]') INTO _questions FROM survey_questions q WHERE q.survey_id = OLD.id;
  END IF;
  _payload := jsonb_build_object('assessment', to_jsonb(OLD), 'departments', _deps, 'responses', _resps, 'answers', _answers, 'questions', _questions);
  INSERT INTO deleted_assessments_backup (assessment_type, assessment_id, company_id, title, responses_count, payload, deleted_by)
  VALUES (TG_TABLE_NAME, OLD.id, (to_jsonb(OLD)->>'company_id')::uuid, to_jsonb(OLD)->>'title', _count, _payload, auth.uid());
  RETURN OLD;
END $$;

CREATE TRIGGER backup_before_delete BEFORE DELETE ON public.hseit_assessments FOR EACH ROW EXECUTE FUNCTION public.backup_assessment_before_delete('hseit','assessment_id');
CREATE TRIGGER backup_before_delete BEFORE DELETE ON public.copsoq_assessments FOR EACH ROW EXECUTE FUNCTION public.backup_assessment_before_delete('copsoq','assessment_id');
CREATE TRIGGER backup_before_delete BEFORE DELETE ON public.burnout_assessments FOR EACH ROW EXECUTE FUNCTION public.backup_assessment_before_delete('burnout','assessment_id');
CREATE TRIGGER backup_before_delete BEFORE DELETE ON public.clasa_assessments FOR EACH ROW EXECUTE FUNCTION public.backup_assessment_before_delete('clasa','assessment_id');
CREATE TRIGGER backup_before_delete BEFORE DELETE ON public.climate_surveys FOR EACH ROW EXECUTE FUNCTION public.backup_assessment_before_delete('survey','survey_id');

CREATE OR REPLACE FUNCTION public.restore_deleted_assessment(_backup_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE b record; _prefix text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') AND auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'not allowed';
  END IF;
  SELECT * INTO b FROM deleted_assessments_backup WHERE id = _backup_id AND restored_at IS NULL;
  IF NOT FOUND THEN RAISE EXCEPTION 'backup not found or already restored'; END IF;
  _prefix := CASE b.assessment_type WHEN 'climate_surveys' THEN 'survey' ELSE split_part(b.assessment_type, '_', 1) END;
  EXECUTE format('INSERT INTO %I SELECT * FROM jsonb_populate_record(NULL::%I, $1)', b.assessment_type, b.assessment_type) USING b.payload->'assessment';
  IF _prefix = 'survey' THEN
    INSERT INTO survey_questions SELECT * FROM jsonb_populate_recordset(NULL::survey_questions, b.payload->'questions');
  END IF;
  EXECUTE format('INSERT INTO %I SELECT * FROM jsonb_populate_recordset(NULL::%I, $1)', _prefix||'_departments', _prefix||'_departments') USING b.payload->'departments';
  EXECUTE format('INSERT INTO %I SELECT * FROM jsonb_populate_recordset(NULL::%I, $1)', _prefix||'_responses', _prefix||'_responses') USING b.payload->'responses';
  EXECUTE format('INSERT INTO %I SELECT * FROM jsonb_populate_recordset(NULL::%I, $1)', _prefix||'_answers', _prefix||'_answers') USING b.payload->'answers';
  UPDATE deleted_assessments_backup SET restored_at = now() WHERE id = _backup_id;
END $$;
REVOKE EXECUTE ON FUNCTION public.restore_deleted_assessment(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.restore_deleted_assessment(uuid) TO authenticated, service_role;