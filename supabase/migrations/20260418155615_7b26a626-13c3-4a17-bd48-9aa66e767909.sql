CREATE OR REPLACE FUNCTION public.count_training_materials(_module_id uuid)
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(COUNT(*)::integer, 0)
  FROM public.sst_training_materials
  WHERE module_id = _module_id
$$;