-- Realtime
ALTER TABLE public.matches REPLICA IDENTITY FULL;
ALTER TABLE public.match_maps REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.matches;
ALTER PUBLICATION supabase_realtime ADD TABLE public.match_maps;

-- Wallet/role auto-create trigger on profiles
DROP TRIGGER IF EXISTS on_profile_created ON public.profiles;
CREATE TRIGGER on_profile_created
AFTER INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_new_profile_wallet();

-- Backfill missing wallets
INSERT INTO public.wallets (user_id)
SELECT p.id FROM public.profiles p
LEFT JOIN public.wallets w ON w.user_id = p.id
WHERE w.id IS NULL;

-- Backfill missing player roles
INSERT INTO public.user_roles (user_id, role)
SELECT p.id, 'player'::app_role FROM public.profiles p
WHERE NOT EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = p.id);

-- Drop unused leaderboards table
DROP TABLE IF EXISTS public.leaderboards;