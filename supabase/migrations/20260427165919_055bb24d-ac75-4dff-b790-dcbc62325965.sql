-- 1. PRIMEIRO: incrementar slots extras (libera o limite no trigger)
UPDATE public.sst_managers
SET extra_company_slots = COALESCE(extra_company_slots, 0) + 1
WHERE id = 'af4685b9-9f20-489a-a745-867cd9756ff1';

-- 2. Agora vincular a empresa órfã (passa no trigger pois agora há slot)
INSERT INTO public.company_sst_assignments (company_id, sst_manager_id)
VALUES ('9ae60781-6569-4185-abe0-5a13c6d7fff9', 'af4685b9-9f20-489a-a745-867cd9756ff1')
ON CONFLICT DO NOTHING;

-- 3. Registrar a compra do slot como pendente de cobrança
INSERT INTO public.sst_extra_slot_purchases (
  sst_manager_id,
  slots_added,
  unit_price_cents,
  status,
  purchased_by
)
SELECT
  'af4685b9-9f20-489a-a745-867cd9756ff1',
  1,
  1990,
  'pending_billing',
  p.id
FROM public.profiles p
WHERE p.sst_manager_id = 'af4685b9-9f20-489a-a745-867cd9756ff1'
ORDER BY p.created_at ASC
LIMIT 1;

-- 4. Garantir feature access default para a empresa recém-vinculada
INSERT INTO public.company_feature_access (company_id)
VALUES ('9ae60781-6569-4185-abe0-5a13c6d7fff9')
ON CONFLICT (company_id) DO NOTHING;