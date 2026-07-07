WITH latest_status AS (
  SELECT DISTINCT ON (report_id)
    report_id,
    new_status
  FROM public.report_updates
  WHERE new_status IS NOT NULL
    AND new_status IN ('pending', 'in_progress', 'resolved', 'archived')
  ORDER BY report_id, created_at DESC
)
UPDATE public.reports r
SET status = latest_status.new_status,
    updated_at = now()
FROM latest_status
WHERE r.id = latest_status.report_id
  AND r.status IS DISTINCT FROM latest_status.new_status;