CREATE TABLE public.licensed_operators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  sst_manager_id uuid REFERENCES public.sst_managers(id) ON DELETE SET NULL,
  razao_social text NOT NULL,
  nome_fantasia text,
  cnpj text,
  email text NOT NULL,
  phone text,
  endereco_completo text,
  logo_url text,
  commission_rate numeric NOT NULL DEFAULT 20,
  status text NOT NULL DEFAULT 'active',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.licensed_operators TO authenticated;
GRANT ALL ON public.licensed_operators TO service_role;
ALTER TABLE public.licensed_operators ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.get_user_licensed_operator_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.licensed_operators WHERE user_id = _user_id LIMIT 1
$$;

CREATE POLICY "Admins manage licensed operators"
ON public.licensed_operators FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Operators view own record"
ON public.licensed_operators FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Operators update own record"
ON public.licensed_operators FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE TRIGGER trg_licensed_operators_updated
BEFORE UPDATE ON public.licensed_operators
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TABLE public.licensed_operator_companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id uuid NOT NULL REFERENCES public.licensed_operators(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  plan_slug text NOT NULL,
  employee_count integer NOT NULL DEFAULT 1,
  billing_cycle text NOT NULL DEFAULT 'monthly',
  billing_mode text NOT NULL DEFAULT 'direct',
  monthly_amount_cents integer NOT NULL DEFAULT 0,
  charge_amount_cents integer NOT NULL DEFAULT 0,
  payment_status text NOT NULL DEFAULT 'pending',
  asaas_customer_id text,
  asaas_payment_id text,
  asaas_subscription_id text,
  invoice_url text,
  next_due_date date,
  last_paid_at timestamptz,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (operator_id, company_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.licensed_operator_companies TO authenticated;
GRANT ALL ON public.licensed_operator_companies TO service_role;
ALTER TABLE public.licensed_operator_companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage operator companies"
ON public.licensed_operator_companies FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Operators view own companies"
ON public.licensed_operator_companies FOR SELECT TO authenticated
USING (operator_id = public.get_user_licensed_operator_id(auth.uid()));

CREATE TRIGGER trg_licensed_operator_companies_updated
BEFORE UPDATE ON public.licensed_operator_companies
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TABLE public.licensed_operator_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id uuid NOT NULL REFERENCES public.licensed_operators(id) ON DELETE CASCADE,
  reference_month text NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  gross_cents integer NOT NULL DEFAULT 0,
  discount_cents integer NOT NULL DEFAULT 0,
  commission_credit_cents integer NOT NULL DEFAULT 0,
  total_cents integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  asaas_payment_id text,
  invoice_url text,
  closed_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (operator_id, reference_month)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.licensed_operator_invoices TO authenticated;
GRANT ALL ON public.licensed_operator_invoices TO service_role;
ALTER TABLE public.licensed_operator_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage operator invoices"
ON public.licensed_operator_invoices FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Operators view own invoices"
ON public.licensed_operator_invoices FOR SELECT TO authenticated
USING (operator_id = public.get_user_licensed_operator_id(auth.uid()));

CREATE TABLE public.licensed_operator_invoice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES public.licensed_operator_invoices(id) ON DELETE CASCADE,
  company_id uuid,
  company_name text,
  kind text NOT NULL,
  description text NOT NULL,
  plan_slug text,
  employee_count integer,
  amount_cents integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.licensed_operator_invoice_items TO authenticated;
GRANT ALL ON public.licensed_operator_invoice_items TO service_role;
ALTER TABLE public.licensed_operator_invoice_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage operator invoice items"
ON public.licensed_operator_invoice_items FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Operators view own invoice items"
ON public.licensed_operator_invoice_items FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.licensed_operator_invoices i
  WHERE i.id = invoice_id
    AND i.operator_id = public.get_user_licensed_operator_id(auth.uid())
));

CREATE INDEX idx_lop_companies_operator ON public.licensed_operator_companies(operator_id);
CREATE INDEX idx_lop_invoices_operator ON public.licensed_operator_invoices(operator_id);
CREATE INDEX idx_lop_invoice_items_invoice ON public.licensed_operator_invoice_items(invoice_id);