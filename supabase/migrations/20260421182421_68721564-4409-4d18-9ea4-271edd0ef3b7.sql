CREATE TABLE IF NOT EXISTS public.email_send_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_email text NOT NULL,
  status text NOT NULL,
  error_message text,
  subscription_id uuid REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  context text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_send_attempts_subscription ON public.email_send_attempts(subscription_id);
CREATE INDEX IF NOT EXISTS idx_email_send_attempts_created_at ON public.email_send_attempts(created_at DESC);

ALTER TABLE public.email_send_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view email send attempts"
ON public.email_send_attempts
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));