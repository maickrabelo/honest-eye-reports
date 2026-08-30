CREATE OR REPLACE VIEW public.sst_managers_public
WITH (security_invoker = false) AS
SELECT id, name, slug, logo_url, brand_color, email, phone, is_licensed_operator
FROM public.sst_managers;

GRANT SELECT ON public.sst_managers_public TO anon, authenticated;

CREATE OR REPLACE VIEW public.company_branding_public
WITH (security_invoker = false) AS
SELECT c.id AS company_id,
       c.slug AS company_slug,
       m.id AS sst_manager_id,
       m.name AS brand_name,
       m.slug AS brand_slug,
       m.logo_url AS brand_logo,
       m.brand_color AS brand_color,
       COALESCE(m.is_licensed_operator, false) AS is_licensed_operator
FROM public.companies c
JOIN public.company_sst_assignments a ON a.company_id = c.id
JOIN public.sst_managers m ON m.id = a.sst_manager_id;

GRANT SELECT ON public.company_branding_public TO anon, authenticated;