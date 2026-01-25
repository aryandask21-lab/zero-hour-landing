-- =====================================================
-- PHASE 1: FOUNDATION - USER ROLES & ENHANCED PROFILES
-- =====================================================

-- Create app role enum
CREATE TYPE public.app_role AS ENUM ('player', 'team_leader', 'organizer', 'admin');

-- Create user_roles table (CRITICAL: roles separate from profiles)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'player',
    granted_by UUID REFERENCES auth.users(id),
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Add enhanced profile fields
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS region TEXT,
ADD COLUMN IF NOT EXISTS preferred_game TEXT,
ADD COLUMN IF NOT EXISTS elo_rating INTEGER DEFAULT 1000,
ADD COLUMN IF NOT EXISTS glicko_rating NUMERIC(10,2) DEFAULT 1500.00,
ADD COLUMN IF NOT EXISTS glicko_rd NUMERIC(10,2) DEFAULT 350.00,
ADD COLUMN IF NOT EXISTS total_matches INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS wins INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS losses INTEGER DEFAULT 0;

-- Player rating history
CREATE TABLE public.rating_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    old_rating INTEGER NOT NULL,
    new_rating INTEGER NOT NULL,
    rating_change INTEGER NOT NULL,
    match_id UUID,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.rating_history ENABLE ROW LEVEL SECURITY;

-- Team invites system
CREATE TABLE public.team_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
    invited_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    invited_by UUID REFERENCES auth.users(id) NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    responded_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '7 days'),
    UNIQUE (team_id, invited_user_id, status)
);

ALTER TABLE public.team_invites ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PHASE 2: TOURNAMENT ENGINE
-- =====================================================

-- Map pool for games
CREATE TABLE public.map_pool (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game TEXT NOT NULL,
    map_name TEXT NOT NULL,
    map_image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (game, map_name)
);

ALTER TABLE public.map_pool ENABLE ROW LEVEL SECURITY;

-- Tournament map pool (which maps available for tournament)
CREATE TABLE public.tournament_map_pool (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE NOT NULL,
    map_id UUID REFERENCES public.map_pool(id) ON DELETE CASCADE NOT NULL,
    UNIQUE (tournament_id, map_id)
);

ALTER TABLE public.tournament_map_pool ENABLE ROW LEVEL SECURITY;

-- Match maps (veto results, selected maps)
CREATE TABLE public.match_maps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE NOT NULL,
    map_id UUID REFERENCES public.map_pool(id) ON DELETE CASCADE NOT NULL,
    map_order INTEGER NOT NULL,
    picked_by UUID REFERENCES public.teams(id),
    banned_by UUID REFERENCES public.teams(id),
    is_decider BOOLEAN DEFAULT false,
    team1_side TEXT CHECK (team1_side IN ('attack', 'defense', 'random')),
    team1_score INTEGER DEFAULT 0,
    team2_score INTEGER DEFAULT 0,
    winner_id UUID REFERENCES public.teams(id),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'vetoing', 'in_progress', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.match_maps ENABLE ROW LEVEL SECURITY;

-- Match assets (screenshots, demos, proof)
CREATE TABLE public.match_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE NOT NULL,
    uploaded_by UUID REFERENCES auth.users(id) NOT NULL,
    asset_type TEXT NOT NULL CHECK (asset_type IN ('screenshot', 'demo', 'video', 'other')),
    file_url TEXT NOT NULL,
    description TEXT,
    verified BOOLEAN DEFAULT false,
    verified_by UUID REFERENCES auth.users(id),
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.match_assets ENABLE ROW LEVEL SECURITY;

-- Forfeits and no-shows
CREATE TABLE public.forfeits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE NOT NULL UNIQUE,
    forfeiting_team_id UUID REFERENCES public.teams(id) NOT NULL,
    reason TEXT NOT NULL CHECK (reason IN ('no_show', 'disconnect', 'forfeit', 'disqualification')),
    reported_by UUID REFERENCES auth.users(id) NOT NULL,
    confirmed BOOLEAN DEFAULT false,
    confirmed_by UUID REFERENCES auth.users(id),
    confirmed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.forfeits ENABLE ROW LEVEL SECURITY;

-- Add tournament enhancements
ALTER TABLE public.tournaments
ADD COLUMN IF NOT EXISTS match_format TEXT DEFAULT 'bo1' CHECK (match_format IN ('bo1', 'bo3', 'bo5')),
ADD COLUMN IF NOT EXISTS seeding_type TEXT DEFAULT 'random' CHECK (seeding_type IN ('random', 'manual', 'rating')),
ADD COLUMN IF NOT EXISTS map_veto_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS entry_fee INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS prize_pool_credits INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS organizer_rating NUMERIC(3,2) DEFAULT 5.00;

-- =====================================================
-- PHASE 3: PAYMENTS & PRIZES (Virtual Credits)
-- =====================================================

-- User wallets
CREATE TABLE public.wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    balance INTEGER DEFAULT 0 CHECK (balance >= 0),
    frozen_balance INTEGER DEFAULT 0 CHECK (frozen_balance >= 0),
    lifetime_earnings INTEGER DEFAULT 0,
    lifetime_spent INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

-- Transactions
CREATE TABLE public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'entry_fee', 'prize', 'refund', 'admin_credit', 'admin_debit')),
    amount INTEGER NOT NULL,
    balance_after INTEGER NOT NULL,
    reference_type TEXT,
    reference_id UUID,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Tournament escrow
CREATE TABLE public.tournament_escrow (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE NOT NULL UNIQUE,
    total_pool INTEGER DEFAULT 0,
    distributed BOOLEAN DEFAULT false,
    distributed_at TIMESTAMP WITH TIME ZONE,
    distributed_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.tournament_escrow ENABLE ROW LEVEL SECURITY;

-- Prize distribution records
CREATE TABLE public.prize_distributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE NOT NULL,
    team_id UUID REFERENCES public.teams(id) NOT NULL,
    placement INTEGER NOT NULL,
    prize_amount INTEGER NOT NULL,
    distributed BOOLEAN DEFAULT false,
    distributed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.prize_distributions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PHASE 4: MODERATION & NOTIFICATIONS
-- =====================================================

-- Ban types enum
CREATE TYPE public.ban_type AS ENUM ('temporary', 'permanent', 'competition', 'chat');

-- Bans table
CREATE TABLE public.bans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
    ban_type ban_type NOT NULL,
    reason TEXT NOT NULL,
    evidence_url TEXT,
    banned_by UUID REFERENCES auth.users(id) NOT NULL,
    starts_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    ends_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    appealed BOOLEAN DEFAULT false,
    appeal_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    CHECK (user_id IS NOT NULL OR team_id IS NOT NULL)
);

ALTER TABLE public.bans ENABLE ROW LEVEL SECURITY;

-- Moderation logs
CREATE TABLE public.moderation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES auth.users(id) NOT NULL,
    action_type TEXT NOT NULL,
    target_type TEXT NOT NULL CHECK (target_type IN ('user', 'team', 'tournament', 'match', 'dispute')),
    target_id UUID NOT NULL,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.moderation_logs ENABLE ROW LEVEL SECURITY;

-- Notifications
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('match_start', 'check_in', 'dispute', 'invite', 'result', 'prize', 'ban', 'system')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link TEXT,
    read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Leaderboards
CREATE TABLE public.leaderboards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    game TEXT NOT NULL,
    season TEXT,
    rank INTEGER,
    points INTEGER DEFAULT 0,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    tournaments_played INTEGER DEFAULT 0,
    tournaments_won INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (user_id, game, season)
);

ALTER TABLE public.leaderboards ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- SECURITY DEFINER FUNCTIONS
-- =====================================================

-- Check if user has specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- Check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'admin');
$$;

-- Check if user is organizer or admin
CREATE OR REPLACE FUNCTION public.is_organizer_or_admin(_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'admin') OR public.has_role(_user_id, 'organizer');
$$;

-- Check if user is banned
CREATE OR REPLACE FUNCTION public.is_user_banned(_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.bans
    WHERE user_id = _user_id 
    AND is_active = true
    AND (ends_at IS NULL OR ends_at > now())
  );
$$;

-- Update ELO rating after match
CREATE OR REPLACE FUNCTION public.update_elo_ratings(
    winner_id UUID,
    loser_id UUID,
    p_match_id UUID,
    k_factor INTEGER DEFAULT 32
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    winner_rating INTEGER;
    loser_rating INTEGER;
    expected_winner NUMERIC;
    expected_loser NUMERIC;
    new_winner_rating INTEGER;
    new_loser_rating INTEGER;
    rating_change INTEGER;
BEGIN
    SELECT elo_rating INTO winner_rating FROM profiles WHERE id = winner_id;
    SELECT elo_rating INTO loser_rating FROM profiles WHERE id = loser_id;

    expected_winner := 1.0 / (1.0 + POWER(10, (loser_rating - winner_rating)::NUMERIC / 400));
    expected_loser := 1.0 - expected_winner;

    rating_change := ROUND(k_factor * (1 - expected_winner));
    new_winner_rating := winner_rating + rating_change;
    new_loser_rating := loser_rating - rating_change;

    UPDATE profiles SET elo_rating = new_winner_rating, wins = wins + 1, total_matches = total_matches + 1 WHERE id = winner_id;
    UPDATE profiles SET elo_rating = new_loser_rating, losses = losses + 1, total_matches = total_matches + 1 WHERE id = loser_id;

    INSERT INTO rating_history (user_id, old_rating, new_rating, rating_change, match_id, reason)
    VALUES (winner_id, winner_rating, new_winner_rating, rating_change, p_match_id, 'match_win');

    INSERT INTO rating_history (user_id, old_rating, new_rating, rating_change, match_id, reason)
    VALUES (loser_id, loser_rating, new_loser_rating, -rating_change, p_match_id, 'match_loss');
END;
$$;

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- User roles policies
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR ALL
USING (public.is_admin());

-- Rating history policies
CREATE POLICY "Users can view their own rating history"
ON public.rating_history FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Public can view rating history"
ON public.rating_history FOR SELECT
USING (true);

-- Team invites policies
CREATE POLICY "Users can view invites sent to them"
ON public.team_invites FOR SELECT
USING (invited_user_id = auth.uid() OR is_team_owner(team_id) OR is_team_member(team_id));

CREATE POLICY "Team owners can create invites"
ON public.team_invites FOR INSERT
WITH CHECK (is_team_owner(team_id) AND invited_by = auth.uid());

CREATE POLICY "Invited users can update their invite status"
ON public.team_invites FOR UPDATE
USING (invited_user_id = auth.uid());

-- Map pool policies
CREATE POLICY "Everyone can view map pool"
ON public.map_pool FOR SELECT
USING (true);

CREATE POLICY "Admins can manage map pool"
ON public.map_pool FOR ALL
USING (public.is_admin());

-- Tournament map pool policies
CREATE POLICY "Everyone can view tournament maps"
ON public.tournament_map_pool FOR SELECT
USING (true);

CREATE POLICY "Tournament creators can manage maps"
ON public.tournament_map_pool FOR ALL
USING (is_tournament_creator(tournament_id));

-- Match maps policies
CREATE POLICY "Everyone can view match maps"
ON public.match_maps FOR SELECT
USING (true);

CREATE POLICY "Match participants can update maps"
ON public.match_maps FOR UPDATE
USING (EXISTS (
    SELECT 1 FROM matches m
    WHERE m.id = match_maps.match_id
    AND (is_team_member(m.team1_id) OR is_team_member(m.team2_id) OR is_tournament_creator(m.tournament_id))
));

CREATE POLICY "Tournament creators can manage match maps"
ON public.match_maps FOR ALL
USING (EXISTS (
    SELECT 1 FROM matches m
    WHERE m.id = match_maps.match_id
    AND is_tournament_creator(m.tournament_id)
));

-- Match assets policies
CREATE POLICY "Everyone can view verified assets"
ON public.match_assets FOR SELECT
USING (verified = true OR uploaded_by = auth.uid() OR EXISTS (
    SELECT 1 FROM matches m
    WHERE m.id = match_assets.match_id
    AND is_tournament_creator(m.tournament_id)
));

CREATE POLICY "Match participants can upload assets"
ON public.match_assets FOR INSERT
WITH CHECK (EXISTS (
    SELECT 1 FROM matches m
    WHERE m.id = match_id
    AND (is_team_member(m.team1_id) OR is_team_member(m.team2_id))
) AND uploaded_by = auth.uid());

-- Forfeits policies
CREATE POLICY "Everyone can view forfeits"
ON public.forfeits FOR SELECT
USING (true);

CREATE POLICY "Match participants can report forfeits"
ON public.forfeits FOR INSERT
WITH CHECK (EXISTS (
    SELECT 1 FROM matches m
    WHERE m.id = match_id
    AND (is_team_member(m.team1_id) OR is_team_member(m.team2_id))
) AND reported_by = auth.uid());

CREATE POLICY "Tournament creators can confirm forfeits"
ON public.forfeits FOR UPDATE
USING (EXISTS (
    SELECT 1 FROM matches m
    WHERE m.id = forfeits.match_id
    AND is_tournament_creator(m.tournament_id)
));

-- Wallets policies
CREATE POLICY "Users can view their own wallet"
ON public.wallets FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "System creates wallets"
ON public.wallets FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage wallets"
ON public.wallets FOR ALL
USING (public.is_admin());

-- Transactions policies
CREATE POLICY "Users can view their own transactions"
ON public.transactions FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all transactions"
ON public.transactions FOR SELECT
USING (public.is_admin());

-- Tournament escrow policies
CREATE POLICY "Everyone can view escrow"
ON public.tournament_escrow FOR SELECT
USING (true);

CREATE POLICY "Tournament creators can manage escrow"
ON public.tournament_escrow FOR ALL
USING (is_tournament_creator(tournament_id) OR public.is_admin());

-- Prize distributions policies
CREATE POLICY "Everyone can view prize distributions"
ON public.prize_distributions FOR SELECT
USING (true);

CREATE POLICY "Organizers can manage distributions"
ON public.prize_distributions FOR ALL
USING (is_tournament_creator(tournament_id) OR public.is_admin());

-- Bans policies
CREATE POLICY "Users can view their own bans"
ON public.bans FOR SELECT
USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Admins can manage bans"
ON public.bans FOR ALL
USING (public.is_admin());

-- Moderation logs policies
CREATE POLICY "Admins can view moderation logs"
ON public.moderation_logs FOR SELECT
USING (public.is_admin());

CREATE POLICY "Admins can create moderation logs"
ON public.moderation_logs FOR INSERT
WITH CHECK (public.is_admin() AND admin_id = auth.uid());

-- Notifications policies
CREATE POLICY "Users can view their own notifications"
ON public.notifications FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
ON public.notifications FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "System can create notifications"
ON public.notifications FOR INSERT
WITH CHECK (true);

-- Leaderboards policies
CREATE POLICY "Everyone can view leaderboards"
ON public.leaderboards FOR SELECT
USING (true);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Create wallet on profile creation
CREATE OR REPLACE FUNCTION public.handle_new_profile_wallet()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.wallets (user_id) VALUES (NEW.id);
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'player');
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_profile_created_wallet
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_profile_wallet();

-- Update wallet timestamp
CREATE TRIGGER update_wallets_updated_at
BEFORE UPDATE ON public.wallets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.match_disputes;