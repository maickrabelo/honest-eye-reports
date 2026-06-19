CREATE OR REPLACE VIEW public.sst_managers_public AS
SELECT id,
    name,
    slug,
    logo_url,
    brand_color,
    email,
    phone
FROM sst_managers;