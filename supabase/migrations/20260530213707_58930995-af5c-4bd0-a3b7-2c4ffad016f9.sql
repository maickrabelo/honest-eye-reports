ALTER TABLE public.subscription_plans
  ADD COLUMN IF NOT EXISTS pgr_enabled boolean NOT NULL DEFAULT false;

UPDATE public.subscription_plans
  SET pgr_enabled = true
  WHERE slug IN (
    'tecnico-sst-sms',
    'gestora-sst-sms-basic',
    'gestora-sst-sms-pro',
    'empresa-sms-starter',
    'empresa-sms-corporate'
  );