-- Drop the overly permissive public read policy
DROP POLICY IF EXISTS "Public can view company SST assignments" ON public.company_sst_assignments;

-- Company users can view assignments for their own company
CREATE POLICY "Companies can view their own SST assignment"
ON public.company_sst_assignments
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'company'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.company_id = company_sst_assignments.company_id
  )
);

-- Sales role can view all assignments (read-only across system, consistent with other sales policies)
CREATE POLICY "Sales can view all SST assignments"
ON public.company_sst_assignments
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'sales'::app_role));