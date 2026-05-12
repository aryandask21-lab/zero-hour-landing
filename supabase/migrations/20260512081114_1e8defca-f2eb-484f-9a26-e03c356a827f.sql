-- Auto-close tournaments whose registration deadline has passed.
-- SECURITY DEFINER so any visitor's page load can trigger the cleanup safely.
CREATE OR REPLACE FUNCTION public.auto_close_expired_registrations()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  affected integer;
BEGIN
  UPDATE public.tournaments
     SET status = 'registration_closed', updated_at = now()
   WHERE status = 'registration_open'
     AND registration_deadline IS NOT NULL
     AND registration_deadline <= now();
  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected;
END;
$$;

GRANT EXECUTE ON FUNCTION public.auto_close_expired_registrations() TO anon, authenticated;