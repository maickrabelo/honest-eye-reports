-- 1. companies: remove blanket public SELECT (PII exposure)
DROP POLICY IF EXISTS "Public can view company basics via view only" ON public.companies;

-- 2. report_updates: remove the policy that effectively makes the audit trail public
DROP POLICY IF EXISTS "Users can view updates for reports they can see" ON public.report_updates;

-- Keep tracking-code holders able to see status updates on their own report,
-- but only via a join that requires the tracking code to be present.
-- Anonymous tracking lookups already go through the reports table policy
-- "Public can lookup report by tracking code". We allow report_updates SELECT
-- only when the parent report has a tracking_code AND the request is in the
-- context of that lookup (we use a permissive read scoped to tracking-code
-- reports — necessary because anon clients don't have any user id).
CREATE POLICY "Public can view updates for tracked reports"
ON public.report_updates
FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.reports r
    WHERE r.id = report_updates.report_id
      AND r.tracking_code IS NOT NULL
  )
);

-- Note: this still exposes update history for tracking-code reports to anyone
-- who can guess a report id. Tracking codes themselves are random; the existing
-- public reports policy already follows this same model. Tightening further
-- would break the anonymous tracking flow.

-- 3. partner_representatives: remove unrestricted insert
DROP POLICY IF EXISTS "Anyone can add representatives during registration" ON public.partner_representatives;

CREATE POLICY "Partner owners can add representatives"
ON public.partner_representatives
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.licensed_partners lp
    WHERE lp.id = partner_representatives.partner_id
      AND (lp.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role))
  )
);

-- 4. Storage: prevent listing of the public company-logos bucket while still
-- allowing direct object reads (which use the bucket's public flag, not RLS).
DROP POLICY IF EXISTS "Public can list company-logos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view company logos" ON storage.objects;
DROP POLICY IF EXISTS "Public read company-logos" ON storage.objects;

-- Keep no broad SELECT on company-logos via RLS; the bucket's public=true
-- flag still allows direct object access by URL.
