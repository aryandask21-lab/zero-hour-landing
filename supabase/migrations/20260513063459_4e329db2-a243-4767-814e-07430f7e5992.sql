-- Allow admins and tournament creators to view team rosters of teams in their tournaments
CREATE POLICY "Admins and tournament creators can view team members"
ON public.team_members
FOR SELECT
TO authenticated
USING (
  public.is_admin()
  OR EXISTS (
    SELECT 1 FROM public.tournament_registrations tr
    JOIN public.tournaments t ON t.id = tr.tournament_id
    WHERE tr.team_id = team_members.team_id
      AND t.creator_id = auth.uid()
  )
);

-- Also allow public profile lookup by username for inviting members at team creation
-- (profiles already public-readable, no change needed)
