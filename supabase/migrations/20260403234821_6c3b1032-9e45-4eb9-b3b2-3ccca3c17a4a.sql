-- Allow affiliates to view companies they referred
CREATE POLICY "Affiliates can view their referred companies"
ON public.companies
FOR SELECT
TO authenticated
USING (
  referred_by_affiliate_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.affiliates a
    WHERE a.id = companies.referred_by_affiliate_id
    AND a.user_id = auth.uid()
  )
);

-- Also clean up the duplicate pending role for Julio Botelho
DELETE FROM public.user_roles
WHERE user_id = 'b4bd3197-b299-4dcd-b102-20de173c1f29'
AND role = 'pending';