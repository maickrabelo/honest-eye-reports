INSERT INTO public.user_companies (user_id, company_id, is_default)
SELECT p.id, p.company_id, true
FROM public.profiles p
WHERE p.company_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.user_companies uc
    WHERE uc.user_id = p.id AND uc.company_id = p.company_id
  );