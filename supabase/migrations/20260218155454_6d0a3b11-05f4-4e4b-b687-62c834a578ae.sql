
-- Player match statistics table
CREATE TABLE public.player_match_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  player_id uuid NOT NULL,
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  kills integer NOT NULL DEFAULT 0,
  deaths integer NOT NULL DEFAULT 0,
  assists integer NOT NULL DEFAULT 0,
  score integer NOT NULL DEFAULT 0,
  is_mvp boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(match_id, player_id)
);

ALTER TABLE public.player_match_stats ENABLE ROW LEVEL SECURITY;

-- Everyone can view stats
CREATE POLICY "Everyone can view player match stats"
  ON public.player_match_stats FOR SELECT
  USING (true);

-- Tournament creators and admins can insert/update stats
CREATE POLICY "Tournament creators can manage stats"
  ON public.player_match_stats FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.id = player_match_stats.match_id
      AND (is_tournament_creator(m.tournament_id) OR is_admin())
    )
  );

CREATE POLICY "Tournament creators can update stats"
  ON public.player_match_stats FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.id = player_match_stats.match_id
      AND (is_tournament_creator(m.tournament_id) OR is_admin())
    )
  );

CREATE POLICY "Tournament creators can delete stats"
  ON public.player_match_stats FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.id = player_match_stats.match_id
      AND (is_tournament_creator(m.tournament_id) OR is_admin())
    )
  );
