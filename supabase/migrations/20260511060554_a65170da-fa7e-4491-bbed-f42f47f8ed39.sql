CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  requested_username text;
  final_username text;
BEGIN
  requested_username := NULLIF(BTRIM(NEW.raw_user_meta_data->>'username'), '');

  IF requested_username IS NULL THEN
    requested_username := 'Player_' || substr(NEW.id::text, 1, 8);
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.profiles
    WHERE username = requested_username
      AND id <> NEW.id
  ) THEN
    final_username := LEFT(requested_username, 40) || '_' || substr(NEW.id::text, 1, 8);
  ELSE
    final_username := requested_username;
  END IF;

  INSERT INTO public.profiles (id, username)
  VALUES (NEW.id, final_username)
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_profile_wallet()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.wallets (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'player')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_team()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.team_members (team_id, user_id, role, invited_by)
  VALUES (NEW.id, NEW.owner_id, 'leader', NEW.owner_id)
  ON CONFLICT (team_id, user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

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

INSERT INTO public.profiles (id, username)
SELECT
  u.id,
  CASE
    WHEN p.username IS NULL THEN 'Player_' || substr(u.id::text, 1, 8)
    ELSE LEFT(p.username, 40) || '_' || substr(u.id::text, 1, 8)
  END
FROM auth.users u
LEFT JOIN LATERAL (
  SELECT NULLIF(BTRIM(u.raw_user_meta_data->>'username'), '') AS username
) p ON true
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles existing WHERE existing.id = u.id
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.wallets (user_id)
SELECT p.id
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM public.wallets w WHERE w.user_id = p.id
)
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT p.id, 'player'::public.app_role
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles ur
  WHERE ur.user_id = p.id AND ur.role = 'player'::public.app_role
)
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.team_members (team_id, user_id, role, invited_by)
SELECT t.id, t.owner_id, 'leader', t.owner_id
FROM public.teams t
WHERE NOT EXISTS (
  SELECT 1 FROM public.team_members tm
  WHERE tm.team_id = t.id AND tm.user_id = t.owner_id
)
ON CONFLICT (team_id, user_id) DO NOTHING;