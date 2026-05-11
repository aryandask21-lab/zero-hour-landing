-- Attach missing triggers for new user signup flow
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS on_profile_created ON public.profiles;
CREATE TRIGGER on_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_profile_wallet();

DROP TRIGGER IF EXISTS on_team_created ON public.teams;
CREATE TRIGGER on_team_created
  AFTER INSERT ON public.teams
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_team();

-- Backfill any existing auth users missing profile/wallet
INSERT INTO public.profiles (id, username)
SELECT u.id, COALESCE(u.raw_user_meta_data->>'username', 'Operator_' || substr(u.id::text, 1, 8))
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;

INSERT INTO public.wallets (user_id)
SELECT p.id FROM public.profiles p
LEFT JOIN public.wallets w ON w.user_id = p.id
WHERE w.user_id IS NULL;

INSERT INTO public.user_roles (user_id, role)
SELECT p.id, 'player'::app_role FROM public.profiles p
LEFT JOIN public.user_roles ur ON ur.user_id = p.id
WHERE ur.user_id IS NULL;