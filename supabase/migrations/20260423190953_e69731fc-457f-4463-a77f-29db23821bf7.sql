
-- 1. Tabela user_sst_managers (precisa existir antes das funções helper)
CREATE TABLE public.user_sst_managers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sst_manager_id uuid NOT NULL REFERENCES public.sst_managers(id) ON DELETE CASCADE,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, sst_manager_id)
);

CREATE INDEX idx_user_sst_managers_user ON public.user_sst_managers(user_id);
CREATE INDEX idx_user_sst_managers_sst ON public.user_sst_managers(sst_manager_id);

ALTER TABLE public.user_sst_managers ENABLE ROW LEVEL SECURITY;

-- 2. Funções helper
CREATE OR REPLACE FUNCTION public.user_in_sst_manager(_user_id uuid, _sst_manager_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = _user_id AND sst_manager_id = _sst_manager_id
  ) OR EXISTS (
    SELECT 1 FROM public.user_sst_managers
    WHERE user_id = _user_id AND sst_manager_id = _sst_manager_id
  );
$$;

CREATE OR REPLACE FUNCTION public.user_in_company(_user_id uuid, _company_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_companies
    WHERE user_id = _user_id AND company_id = _company_id
  ) OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = _user_id AND company_id = _company_id
  );
$$;

-- 3. Tabela de convites
CREATE TABLE public.account_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  account_type text NOT NULL CHECK (account_type IN ('sst','company')),
  sst_manager_id uuid REFERENCES public.sst_managers(id) ON DELETE CASCADE,
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  invited_by uuid NOT NULL,
  token text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','revoked')),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at timestamptz,
  accepted_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (
    (account_type = 'sst'     AND sst_manager_id IS NOT NULL AND company_id IS NULL) OR
    (account_type = 'company' AND company_id     IS NOT NULL AND sst_manager_id IS NULL)
  )
);

CREATE INDEX idx_account_invitations_email ON public.account_invitations(lower(email));
CREATE INDEX idx_account_invitations_token ON public.account_invitations(token);
CREATE INDEX idx_account_invitations_sst ON public.account_invitations(sst_manager_id);
CREATE INDEX idx_account_invitations_company ON public.account_invitations(company_id);

ALTER TABLE public.account_invitations ENABLE ROW LEVEL SECURITY;

-- 4. RLS user_sst_managers
CREATE POLICY "Admins manage all user_sst_managers"
ON public.user_sst_managers FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view own sst manager links"
ON public.user_sst_managers FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "SST users can view links of same sst manager"
ON public.user_sst_managers FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'sst'::app_role)
  AND public.user_in_sst_manager(auth.uid(), sst_manager_id)
);

CREATE POLICY "SST users can delete collaborators of same sst manager"
ON public.user_sst_managers FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'sst'::app_role)
  AND public.user_in_sst_manager(auth.uid(), sst_manager_id)
  AND is_default = false
);

-- 5. RLS account_invitations
CREATE POLICY "Admins manage all invitations"
ON public.account_invitations FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Members can view sst invitations"
ON public.account_invitations FOR SELECT
TO authenticated
USING (
  account_type = 'sst'
  AND public.user_in_sst_manager(auth.uid(), sst_manager_id)
);

CREATE POLICY "Members can view company invitations"
ON public.account_invitations FOR SELECT
TO authenticated
USING (
  account_type = 'company'
  AND public.user_in_company(auth.uid(), company_id)
);

CREATE POLICY "Members can update sst invitations"
ON public.account_invitations FOR UPDATE
TO authenticated
USING (
  account_type = 'sst'
  AND public.user_in_sst_manager(auth.uid(), sst_manager_id)
)
WITH CHECK (
  account_type = 'sst'
  AND public.user_in_sst_manager(auth.uid(), sst_manager_id)
);

CREATE POLICY "Members can update company invitations"
ON public.account_invitations FOR UPDATE
TO authenticated
USING (
  account_type = 'company'
  AND public.user_in_company(auth.uid(), company_id)
)
WITH CHECK (
  account_type = 'company'
  AND public.user_in_company(auth.uid(), company_id)
);

CREATE POLICY "Members can delete sst invitations"
ON public.account_invitations FOR DELETE
TO authenticated
USING (
  account_type = 'sst'
  AND public.user_in_sst_manager(auth.uid(), sst_manager_id)
);

CREATE POLICY "Members can delete company invitations"
ON public.account_invitations FOR DELETE
TO authenticated
USING (
  account_type = 'company'
  AND public.user_in_company(auth.uid(), company_id)
);

-- 6. Backfill: vincular usuários SST existentes via user_sst_managers (como is_default=true)
INSERT INTO public.user_sst_managers (user_id, sst_manager_id, is_default)
SELECT p.id, p.sst_manager_id, true
FROM public.profiles p
WHERE p.sst_manager_id IS NOT NULL
ON CONFLICT (user_id, sst_manager_id) DO NOTHING;

-- 7. Backfill: garantir que user_companies existe para usuários com company_id
INSERT INTO public.user_companies (user_id, company_id, is_default)
SELECT p.id, p.company_id, true
FROM public.profiles p
WHERE p.company_id IS NOT NULL
ON CONFLICT (user_id, company_id) DO NOTHING;
