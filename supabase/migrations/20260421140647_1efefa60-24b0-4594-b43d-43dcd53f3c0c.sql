-- 1. Drop the unsafe storage policy and replace with company-scoped one
DROP POLICY IF EXISTS "Companies can view their report attachments" ON storage.objects;

CREATE POLICY "Companies can view their report attachments"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'report-attachments'
  AND EXISTS (
    SELECT 1
    FROM public.report_attachments ra
    JOIN public.reports r ON r.id = ra.report_id
    JOIN public.profiles p ON p.id = auth.uid()
    WHERE ra.file_path = storage.objects.name
      AND p.company_id = r.company_id
  )
);

-- 2. Drop the wide-open COPSOQ departments policy
DROP POLICY IF EXISTS "Authenticated users can manage COPSOQ departments" ON public.copsoq_departments;
