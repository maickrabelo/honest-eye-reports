
CREATE TABLE public.webhook_configs (
  provider TEXT PRIMARY KEY,
  token TEXT,
  enabled BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.webhook_configs TO authenticated;
GRANT ALL ON public.webhook_configs TO service_role;
ALTER TABLE public.webhook_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage webhook configs"
  ON public.webhook_configs FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE public.webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  event_type TEXT,
  status_code INTEGER,
  source_ip TEXT,
  headers JSONB,
  payload JSONB,
  response JSONB,
  error TEXT,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX webhook_logs_provider_received_idx ON public.webhook_logs (provider, received_at DESC);

GRANT SELECT, INSERT, DELETE ON public.webhook_logs TO authenticated;
GRANT ALL ON public.webhook_logs TO service_role;
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read webhook logs"
  ON public.webhook_logs FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins delete webhook logs"
  ON public.webhook_logs FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

INSERT INTO public.webhook_configs (provider, token, enabled, notes)
VALUES ('hotmart', NULL, true, 'Hottok do webhook da Hotmart. Quando vazio, o sistema usa o segredo HOTMART_HOTTOK como fallback.')
ON CONFLICT (provider) DO NOTHING;
