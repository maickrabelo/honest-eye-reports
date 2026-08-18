UPDATE public.sales_leads
SET email = COALESCE(NULLIF(email, ''), trim(notes)),
    notes = NULL
WHERE notes IS NOT NULL
  AND trim(notes) ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$';