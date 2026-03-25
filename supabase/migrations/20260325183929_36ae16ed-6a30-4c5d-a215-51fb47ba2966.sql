
-- 1. Add redirect_url to affiliates
ALTER TABLE public.affiliates ADD COLUMN IF NOT EXISTS redirect_url text;

-- 2. Create affiliate_leads table
CREATE TABLE public.affiliate_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text NOT NULL,
  company_name text NOT NULL,
  referral_code text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Enable RLS
ALTER TABLE public.affiliate_leads ENABLE ROW LEVEL SECURITY;

-- 4. Public/anon can insert leads
CREATE POLICY "Anyone can insert affiliate leads"
  ON public.affiliate_leads
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- 5. Admins can view all leads
CREATE POLICY "Admins can view all affiliate leads"
  ON public.affiliate_leads
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 6. Affiliates can view their own leads
CREATE POLICY "Affiliates can view their own leads"
  ON public.affiliate_leads
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.affiliates a
      WHERE a.id = affiliate_leads.affiliate_id
        AND a.user_id = auth.uid()
    )
  );
