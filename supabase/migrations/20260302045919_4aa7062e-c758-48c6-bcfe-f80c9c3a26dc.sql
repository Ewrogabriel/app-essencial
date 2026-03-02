
-- Trigger to prevent non-admins from changing commission fields on profiles
CREATE OR REPLACE FUNCTION public.protect_commission_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If commission fields are being changed, only allow admins
  IF (NEW.commission_rate IS DISTINCT FROM OLD.commission_rate
      OR NEW.commission_fixed IS DISTINCT FROM OLD.commission_fixed)
  THEN
    IF NOT public.has_role(auth.uid(), 'admin') THEN
      NEW.commission_rate := OLD.commission_rate;
      NEW.commission_fixed := OLD.commission_fixed;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER protect_commission_fields_trigger
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.protect_commission_fields();
