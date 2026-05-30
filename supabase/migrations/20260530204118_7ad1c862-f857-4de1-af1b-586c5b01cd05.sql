
-- 1) Subscriptions: add Hotmart fields
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS provider text NOT NULL DEFAULT 'asaas',
  ADD COLUMN IF NOT EXISTS hotmart_transaction_id text,
  ADD COLUMN IF NOT EXISTS hotmart_subscriber_code text;

CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_hotmart_transaction
  ON public.subscriptions(hotmart_transaction_id)
  WHERE hotmart_transaction_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_subscriptions_hotmart_subscriber
  ON public.subscriptions(hotmart_subscriber_code)
  WHERE hotmart_subscriber_code IS NOT NULL;

-- 2) Hotmart product -> plan mapping
CREATE TABLE IF NOT EXISTS public.hotmart_product_plans (
  hotmart_product_id text PRIMARY KEY,
  plan_id uuid NOT NULL REFERENCES public.subscription_plans(id) ON DELETE RESTRICT,
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.hotmart_product_plans TO authenticated;
GRANT ALL ON public.hotmart_product_plans TO service_role;

ALTER TABLE public.hotmart_product_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage hotmart_product_plans"
  ON public.hotmart_product_plans
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_hotmart_product_plans_updated_at
  BEFORE UPDATE ON public.hotmart_product_plans
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
