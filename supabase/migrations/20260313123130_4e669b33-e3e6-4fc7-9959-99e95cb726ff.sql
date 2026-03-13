
-- Create user_companies junction table
CREATE TABLE public.user_companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, company_id)
);

-- Enable RLS
ALTER TABLE public.user_companies ENABLE ROW LEVEL SECURITY;

-- Users can view their own associations
CREATE POLICY "Users can view own companies"
  ON public.user_companies FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can update their own associations (for setting default)
CREATE POLICY "Users can update own companies"
  ON public.user_companies FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Admins can manage all
CREATE POLICY "Admins can manage all user_companies"
  ON public.user_companies FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- SST managers can manage for their assigned companies
CREATE POLICY "SST can manage user_companies for assigned companies"
  ON public.user_companies FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'sst') AND EXISTS (
      SELECT 1 FROM public.company_sst_assignments csa
      JOIN public.profiles p ON p.sst_manager_id = csa.sst_manager_id
      WHERE p.id = auth.uid() AND csa.company_id = user_companies.company_id
    )
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'sst') AND EXISTS (
      SELECT 1 FROM public.company_sst_assignments csa
      JOIN public.profiles p ON p.sst_manager_id = csa.sst_manager_id
      WHERE p.id = auth.uid() AND csa.company_id = user_companies.company_id
    )
  );

-- Service role can manage all (for edge functions)
CREATE POLICY "Service role can manage user_companies"
  ON public.user_companies FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Migrate existing data from profiles.company_id
INSERT INTO public.user_companies (user_id, company_id, is_default)
SELECT id, company_id, true
FROM public.profiles
WHERE company_id IS NOT NULL
ON CONFLICT (user_id, company_id) DO NOTHING;
