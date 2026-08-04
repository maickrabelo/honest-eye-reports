CREATE OR REPLACE FUNCTION public.assign_partner_sst_manager()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_manager uuid;
BEGIN
  IF NEW.referred_by_partner_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT sst_manager_id INTO v_manager
  FROM public.licensed_partners
  WHERE id = NEW.referred_by_partner_id
    AND manages_clients = true;

  IF v_manager IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.company_sst_assignments (company_id, sst_manager_id)
  SELECT NEW.id, v_manager
  WHERE NOT EXISTS (
    SELECT 1 FROM public.company_sst_assignments
    WHERE company_id = NEW.id AND sst_manager_id = v_manager
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_assign_partner_sst_manager_ins ON public.companies;
CREATE TRIGGER trg_assign_partner_sst_manager_ins
AFTER INSERT ON public.companies
FOR EACH ROW EXECUTE FUNCTION public.assign_partner_sst_manager();

DROP TRIGGER IF EXISTS trg_assign_partner_sst_manager_upd ON public.companies;
CREATE TRIGGER trg_assign_partner_sst_manager_upd
AFTER UPDATE OF referred_by_partner_id ON public.companies
FOR EACH ROW
WHEN (NEW.referred_by_partner_id IS NOT NULL)
EXECUTE FUNCTION public.assign_partner_sst_manager();