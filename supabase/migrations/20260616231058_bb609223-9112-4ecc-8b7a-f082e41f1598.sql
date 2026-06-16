-- Add matrix_size column to pgr_risks
ALTER TABLE public.pgr_risks ADD COLUMN matrix_size SMALLINT NOT NULL DEFAULT 5 CHECK (matrix_size IN (3,4,5));

-- Drop generated risk_level column and replace with trigger-managed column
ALTER TABLE public.pgr_risks DROP COLUMN risk_level;
ALTER TABLE public.pgr_risks ADD COLUMN risk_level TEXT NOT NULL DEFAULT 'trivial';

CREATE OR REPLACE FUNCTION public.pgr_risks_compute_level()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v INTEGER;
BEGIN
  -- Clamp severity/probability to matrix bounds
  IF NEW.severity > NEW.matrix_size THEN NEW.severity := NEW.matrix_size; END IF;
  IF NEW.probability > NEW.matrix_size THEN NEW.probability := NEW.matrix_size; END IF;
  IF NEW.severity < 1 THEN NEW.severity := 1; END IF;
  IF NEW.probability < 1 THEN NEW.probability := 1; END IF;

  v := NEW.severity * NEW.probability;

  IF NEW.matrix_size = 3 THEN
    NEW.risk_level := CASE
      WHEN v >= 9 THEN 'intolerable'
      WHEN v >= 6 THEN 'substantial'
      WHEN v >= 3 THEN 'moderate'
      WHEN v >= 2 THEN 'tolerable'
      ELSE 'trivial'
    END;
  ELSIF NEW.matrix_size = 4 THEN
    NEW.risk_level := CASE
      WHEN v >= 15 THEN 'intolerable'
      WHEN v >= 9 THEN 'substantial'
      WHEN v >= 5 THEN 'moderate'
      WHEN v >= 3 THEN 'tolerable'
      ELSE 'trivial'
    END;
  ELSE
    NEW.risk_level := CASE
      WHEN v >= 20 THEN 'intolerable'
      WHEN v >= 15 THEN 'substantial'
      WHEN v >= 8 THEN 'moderate'
      WHEN v >= 4 THEN 'tolerable'
      ELSE 'trivial'
    END;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_pgr_risks_compute_level
BEFORE INSERT OR UPDATE ON public.pgr_risks
FOR EACH ROW EXECUTE FUNCTION public.pgr_risks_compute_level();

-- Backfill existing rows (force trigger recompute)
UPDATE public.pgr_risks SET matrix_size = 5;