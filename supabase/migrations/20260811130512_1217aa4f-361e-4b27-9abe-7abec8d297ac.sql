CREATE OR REPLACE FUNCTION public.clasa_response_is_open(_response_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.clasa_responses r
    JOIN public.clasa_assessments a ON a.id = r.assessment_id
    WHERE r.id = _response_id AND a.is_active = true
  )
$$;

DROP POLICY IF EXISTS clasa_answers_public_insert ON public.clasa_answers;

CREATE POLICY clasa_answers_public_insert
ON public.clasa_answers
FOR INSERT
TO anon, authenticated
WITH CHECK (public.clasa_response_is_open(response_id));

DELETE FROM public.clasa_responses WHERE id = '11111111-1111-1111-1111-111111111111';