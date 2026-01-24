-- =====================================================
-- ZERO HOUR ESPORTS TOURNAMENT PLATFORM DATABASE SCHEMA
-- =====================================================

-- =====================================================
-- 1. BASE TABLES
-- =====================================================

-- Profiles table for user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  gaming_stats JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Teams table
CREATE TABLE public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  tag TEXT, -- Team tag like [ZH] or [ELITE]
  logo_url TEXT,
  description TEXT,
  max_members INTEGER NOT NULL DEFAULT 5,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Team members junction table
CREATE TABLE public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'co-leader', 'leader')),
  invited_by UUID REFERENCES public.profiles(id),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(team_id, user_id)
);

-- Tournament status enum
CREATE TYPE public.tournament_status AS ENUM (
  'draft',
  'registration_open',
  'registration_closed',
  'check_in',
  'in_progress',
  'completed',
  'cancelled'
);

-- Tournaments table
CREATE TABLE public.tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  game_mode TEXT DEFAULT 'Bomb Defusal',
  team_size INTEGER NOT NULL DEFAULT 5,
  max_teams INTEGER DEFAULT 16,
  prize_pool TEXT,
  rules TEXT,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  registration_deadline TIMESTAMPTZ,
  check_in_start TIMESTAMPTZ,
  check_in_end TIMESTAMPTZ,
  livestream_url TEXT,
  bracket_type TEXT DEFAULT 'single_elimination' CHECK (bracket_type IN ('single_elimination', 'double_elimination', 'round_robin', 'swiss')),
  status public.tournament_status NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tournament registrations
CREATE TABLE public.tournament_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  registered_by UUID NOT NULL REFERENCES public.profiles(id),
  check_in_status TEXT DEFAULT 'pending' CHECK (check_in_status IN ('pending', 'checked_in', 'no_show')),
  seed INTEGER,
  registered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  checked_in_at TIMESTAMPTZ,
  UNIQUE(tournament_id, team_id)
);

-- Matches table
CREATE TABLE public.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  round INTEGER NOT NULL,
  match_number INTEGER NOT NULL,
  team1_id UUID REFERENCES public.teams(id),
  team2_id UUID REFERENCES public.teams(id),
  team1_score INTEGER DEFAULT 0,
  team2_score INTEGER DEFAULT 0,
  winner_id UUID REFERENCES public.teams(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'scheduled', 'in_progress', 'completed', 'disputed')),
  scheduled_time TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Match disputes
CREATE TABLE public.match_disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  disputing_team_id UUID NOT NULL REFERENCES public.teams(id),
  reason TEXT NOT NULL,
  evidence_url TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'under_review', 'resolved', 'rejected')),
  resolution TEXT,
  resolved_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

-- =====================================================
-- 2. INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX idx_teams_owner ON public.teams(owner_id);
CREATE INDEX idx_team_members_team ON public.team_members(team_id);
CREATE INDEX idx_team_members_user ON public.team_members(user_id);
CREATE INDEX idx_tournaments_creator ON public.tournaments(creator_id);
CREATE INDEX idx_tournaments_status ON public.tournaments(status);
CREATE INDEX idx_tournament_registrations_tournament ON public.tournament_registrations(tournament_id);
CREATE INDEX idx_tournament_registrations_team ON public.tournament_registrations(team_id);
CREATE INDEX idx_matches_tournament ON public.matches(tournament_id);
CREATE INDEX idx_match_disputes_match ON public.match_disputes(match_id);

-- =====================================================
-- 3. HELPER FUNCTIONS (SECURITY DEFINER)
-- =====================================================

-- Check if user has a profile
CREATE OR REPLACE FUNCTION public.has_profile(user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = user_uuid);
$$;

-- Check if user is team owner
CREATE OR REPLACE FUNCTION public.is_team_owner(team_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.teams 
    WHERE id = team_uuid AND owner_id = auth.uid()
  );
$$;

-- Check if user is team member (including owner)
CREATE OR REPLACE FUNCTION public.is_team_member(team_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.teams WHERE id = team_uuid AND owner_id = auth.uid()
    UNION
    SELECT 1 FROM public.team_members WHERE team_id = team_uuid AND user_id = auth.uid()
  );
$$;

-- Check if user is tournament creator
CREATE OR REPLACE FUNCTION public.is_tournament_creator(tournament_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tournaments 
    WHERE id = tournament_uuid AND creator_id = auth.uid()
  );
$$;

-- Check if user's team is registered for tournament
CREATE OR REPLACE FUNCTION public.is_registered_for_tournament(tournament_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tournament_registrations tr
    JOIN public.teams t ON tr.team_id = t.id
    WHERE tr.tournament_id = tournament_uuid 
    AND (t.owner_id = auth.uid() OR EXISTS (
      SELECT 1 FROM public.team_members tm WHERE tm.team_id = t.id AND tm.user_id = auth.uid()
    ))
  );
$$;

-- Check if user can dispute a match (their team is participating)
CREATE OR REPLACE FUNCTION public.can_dispute_match(match_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.matches m
    WHERE m.id = match_uuid
    AND (
      public.is_team_member(m.team1_id) OR public.is_team_member(m.team2_id)
    )
  );
$$;

-- =====================================================
-- 4. TRIGGERS
-- =====================================================

-- Auto-update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_teams_updated_at
  BEFORE UPDATE ON public.teams
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tournaments_updated_at
  BEFORE UPDATE ON public.tournaments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_matches_updated_at
  BEFORE UPDATE ON public.matches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'Operator_' || substr(NEW.id::text, 1, 8))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-add team owner as leader member
CREATE OR REPLACE FUNCTION public.handle_new_team()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.team_members (team_id, user_id, role, invited_by)
  VALUES (NEW.id, NEW.owner_id, 'leader', NEW.owner_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_team_created
  AFTER INSERT ON public.teams
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_team();

-- =====================================================
-- 5. ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_disputes ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 6. RLS POLICIES
-- =====================================================

-- PROFILES POLICIES
CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- TEAMS POLICIES
CREATE POLICY "Teams are viewable by everyone"
  ON public.teams FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create teams"
  ON public.teams FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid() AND public.has_profile());

CREATE POLICY "Team owners can update their teams"
  ON public.teams FOR UPDATE
  TO authenticated
  USING (public.is_team_owner(id));

CREATE POLICY "Team owners can delete their teams"
  ON public.teams FOR DELETE
  TO authenticated
  USING (public.is_team_owner(id));

-- TEAM MEMBERS POLICIES
CREATE POLICY "Team members are viewable by team members"
  ON public.team_members FOR SELECT
  TO authenticated
  USING (public.is_team_member(team_id));

CREATE POLICY "Team owners can add members"
  ON public.team_members FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_team_owner(team_id) 
    AND user_id != auth.uid()
    AND invited_by = auth.uid()
    AND public.has_profile(user_id)
  );

CREATE POLICY "Team owners can remove members or members can leave"
  ON public.team_members FOR DELETE
  TO authenticated
  USING (public.is_team_owner(team_id) OR user_id = auth.uid());

-- TOURNAMENTS POLICIES
CREATE POLICY "Published tournaments are viewable by everyone"
  ON public.tournaments FOR SELECT
  USING (status != 'draft' OR creator_id = auth.uid());

CREATE POLICY "Authenticated users can create tournaments"
  ON public.tournaments FOR INSERT
  TO authenticated
  WITH CHECK (creator_id = auth.uid() AND public.has_profile());

CREATE POLICY "Tournament creators can update their tournaments"
  ON public.tournaments FOR UPDATE
  TO authenticated
  USING (public.is_tournament_creator(id));

CREATE POLICY "Tournament creators can delete their tournaments"
  ON public.tournaments FOR DELETE
  TO authenticated
  USING (public.is_tournament_creator(id));

-- TOURNAMENT REGISTRATIONS POLICIES
CREATE POLICY "Registrations viewable by tournament creator or registered teams"
  ON public.tournament_registrations FOR SELECT
  TO authenticated
  USING (
    public.is_tournament_creator(tournament_id) 
    OR public.is_team_member(team_id)
  );

CREATE POLICY "Team members can register their team"
  ON public.tournament_registrations FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_team_member(team_id)
    AND registered_by = auth.uid()
  );

CREATE POLICY "Tournament creators can update registrations"
  ON public.tournament_registrations FOR UPDATE
  TO authenticated
  USING (public.is_tournament_creator(tournament_id));

CREATE POLICY "Tournament creators or team members can delete registration"
  ON public.tournament_registrations FOR DELETE
  TO authenticated
  USING (
    public.is_tournament_creator(tournament_id)
    OR public.is_team_member(team_id)
  );

-- MATCHES POLICIES
CREATE POLICY "Matches viewable by everyone for public tournaments"
  ON public.matches FOR SELECT
  USING (true);

CREATE POLICY "Tournament creators can manage matches"
  ON public.matches FOR INSERT
  TO authenticated
  WITH CHECK (public.is_tournament_creator(tournament_id));

CREATE POLICY "Tournament creators can update matches"
  ON public.matches FOR UPDATE
  TO authenticated
  USING (public.is_tournament_creator(tournament_id));

CREATE POLICY "Tournament creators can delete matches"
  ON public.matches FOR DELETE
  TO authenticated
  USING (public.is_tournament_creator(tournament_id));

-- MATCH DISPUTES POLICIES
CREATE POLICY "Disputes viewable by tournament creator or disputing team"
  ON public.match_disputes FOR SELECT
  TO authenticated
  USING (
    public.is_team_member(disputing_team_id)
    OR EXISTS (
      SELECT 1 FROM public.matches m 
      WHERE m.id = match_id AND public.is_tournament_creator(m.tournament_id)
    )
  );

CREATE POLICY "Team members can create disputes for their matches"
  ON public.match_disputes FOR INSERT
  TO authenticated
  WITH CHECK (
    public.can_dispute_match(match_id)
    AND public.is_team_member(disputing_team_id)
  );

CREATE POLICY "Tournament creators can update disputes"
  ON public.match_disputes FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.matches m 
      WHERE m.id = match_id AND public.is_tournament_creator(m.tournament_id)
    )
  );

CREATE POLICY "Tournament creators can delete disputes"
  ON public.match_disputes FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.matches m 
      WHERE m.id = match_id AND public.is_tournament_creator(m.tournament_id)
    )
  );

-- =====================================================
-- 7. STORAGE BUCKETS
-- =====================================================

INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('team-logos', 'team-logos', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('tournament-banners', 'tournament-banners', true);

-- Storage policies for avatars
CREATE POLICY "Avatar images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete their own avatar"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Storage policies for team logos
CREATE POLICY "Team logos are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'team-logos');

CREATE POLICY "Team owners can upload team logo"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'team-logos');

CREATE POLICY "Team owners can update team logo"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'team-logos');

CREATE POLICY "Team owners can delete team logo"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'team-logos');

-- Storage policies for tournament banners
CREATE POLICY "Tournament banners are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'tournament-banners');

CREATE POLICY "Tournament creators can upload banners"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'tournament-banners');

CREATE POLICY "Tournament creators can update banners"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'tournament-banners');

CREATE POLICY "Tournament creators can delete banners"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'tournament-banners');