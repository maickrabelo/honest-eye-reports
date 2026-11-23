ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS promo_code text,
  ADD COLUMN IF NOT EXISTS promo_ends_at timestamptz,
  ADD COLUMN IF NOT EXISTS regular_price_cents integer,
  ADD COLUMN IF NOT EXISTS promo_paid_count integer NOT NULL DEFAULT 0;