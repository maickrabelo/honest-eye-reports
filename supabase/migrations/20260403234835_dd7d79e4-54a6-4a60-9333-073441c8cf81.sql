-- Allow affiliates to view subscriptions of their referred companies
CREATE POLICY "Affiliates can view referred company subscriptions"
ON public.subscriptions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.companies c
    JOIN public.affiliates a ON a.id = c.referred_by_affiliate_id
    WHERE c.id = subscriptions.company_id
    AND a.user_id = auth.uid()
  )
);