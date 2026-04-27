-- 1. Adicionar coluna extra_company_slots em sst_managers
ALTER TABLE public.sst_managers
ADD COLUMN IF NOT EXISTS extra_company_slots integer NOT NULL DEFAULT 0;

-- 2. Criar tabela sst_extra_slot_purchases
CREATE TABLE IF NOT EXISTS public.sst_extra_slot_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sst_manager_id uuid NOT NULL REFERENCES public.sst_managers(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  slots_added integer NOT NULL DEFAULT 1,
  unit_price_cents integer NOT NULL DEFAULT 1990,
  status text NOT NULL DEFAULT 'active',
  purchased_by uuid,
  asaas_subscription_id text,
  billing_started_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_extra_slot_purchases_manager
  ON public.sst_extra_slot_purchases(sst_manager_id);

ALTER TABLE public.sst_extra_slot_purchases ENABLE ROW LEVEL SECURITY;

-- Gestora vê seus próprios registros
CREATE POLICY "SST sees own slot purchases"
ON public.sst_extra_slot_purchases
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.sst_manager_id = sst_extra_slot_purchases.sst_manager_id
  )
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Admins gerenciam tudo
CREATE POLICY "Admins manage slot purchases"
ON public.sst_extra_slot_purchases
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 3. Atualizar função de validação de limite somando slots extras
CREATE OR REPLACE FUNCTION public.validate_sst_company_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  current_count integer;
  max_allowed integer;
BEGIN
  SELECT COUNT(*)::integer INTO current_count
  FROM public.company_sst_assignments
  WHERE sst_manager_id = NEW.sst_manager_id;

  SELECT COALESCE(max_companies, 50) + COALESCE(extra_company_slots, 0)
    INTO max_allowed
  FROM public.sst_managers
  WHERE id = NEW.sst_manager_id;

  IF current_count >= max_allowed THEN
    RAISE EXCEPTION 'Limite de % empresas atingido para este gestor SST', max_allowed;
  END IF;

  RETURN NEW;
END;
$function$;