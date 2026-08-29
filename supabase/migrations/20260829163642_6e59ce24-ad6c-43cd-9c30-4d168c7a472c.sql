DROP INDEX IF EXISTS public.ouvidoria_mailing_company_email_idx;
CREATE UNIQUE INDEX IF NOT EXISTS ouvidoria_mailing_company_email_key ON public.ouvidoria_mailing_list (company_id, email);