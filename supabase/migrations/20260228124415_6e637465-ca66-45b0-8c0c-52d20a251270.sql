
-- RLS for sales users on sales_leads
CREATE POLICY "Sales can manage all sales leads"
ON public.sales_leads
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'sales'))
WITH CHECK (has_role(auth.uid(), 'sales'));
