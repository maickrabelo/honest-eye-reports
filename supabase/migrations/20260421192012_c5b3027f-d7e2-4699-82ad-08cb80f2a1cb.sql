-- 1) Reports: drop public-by-tracking-code policy on the base table
DROP POLICY IF EXISTS "Public can lookup report by tracking code" ON public.reports;

-- 2) Licensed partners: drop public approved-partner read
DROP POLICY IF EXISTS "Public can search approved partners" ON public.licensed_partners;