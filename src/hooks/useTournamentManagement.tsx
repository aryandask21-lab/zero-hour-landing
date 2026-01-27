import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Tournament, Match, Team } from '@/types/esports';

interface Registration {
  id: string;
  team_id: string;
  tournament_id: string;
  registered_by: string;
  seed: number | null;
  check_in_status: string | null;
  checked_in_at: string | null;
  registered_at: string;
  team: Team;
}

export function useTournamentManagement(tournamentId: string) {
  const { toast } = useToast();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTournament = useCallback(async () => {
    const { data, error } = await supabase
      .from('tournaments')
      .select('*')
      .eq('id', tournamentId)
      .maybeSingle();

    if (!error && data) {
      setTournament(data as unknown as Tournament);
    }
  }, [tournamentId]);

  const fetchRegistrations = useCallback(async () => {
    const { data, error } = await supabase
      .from('tournament_registrations')
      .select(`
        *,
        team:teams(*)
      `)
      .eq('tournament_id', tournamentId)
      .order('seed', { ascending: true, nullsFirst: false });

    if (!error && data) {
      setRegistrations(data as unknown as Registration[]);
    }
  }, [tournamentId]);

  const fetchMatches = useCallback(async () => {
    const { data, error } = await supabase
      .from('matches')
      .select(`
        *,
        team1:teams!matches_team1_id_fkey(*),
        team2:teams!matches_team2_id_fkey(*)
      `)
      .eq('tournament_id', tournamentId)
      .order('round', { ascending: true })
      .order('match_number', { ascending: true });

    if (!error && data) {
      setMatches(data as unknown as Match[]);
    }
  }, [tournamentId]);

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      await Promise.all([fetchTournament(), fetchRegistrations(), fetchMatches()]);
      setLoading(false);
    };
    loadAll();
  }, [fetchTournament, fetchRegistrations, fetchMatches]);

  const updateStatus = async (status: Tournament['status']) => {
    const { error } = await supabase
      .from('tournaments')
      .update({ status })
      .eq('id', tournamentId);

    if (error) {
      toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' });
      return false;
    }

    toast({ title: 'Status Updated', description: `Tournament is now ${status.replace(/_/g, ' ')}` });
    await fetchTournament();
    return true;
  };

  const updateSeed = async (registrationId: string, seed: number) => {
    const { error } = await supabase
      .from('tournament_registrations')
      .update({ seed })
      .eq('id', registrationId);

    if (error) {
      toast({ title: 'Error', description: 'Failed to update seed', variant: 'destructive' });
      return false;
    }

    await fetchRegistrations();
    return true;
  };

  const removeRegistration = async (registrationId: string) => {
    const { error } = await supabase
      .from('tournament_registrations')
      .delete()
      .eq('id', registrationId);

    if (error) {
      toast({ title: 'Error', description: 'Failed to remove team', variant: 'destructive' });
      return false;
    }

    toast({ title: 'Team Removed', description: 'Team has been removed from the tournament' });
    await fetchRegistrations();
    return true;
  };

  const generateBracket = async () => {
    if (!tournament) return false;

    const teamCount = registrations.length;
    if (teamCount < 2) {
      toast({ title: 'Error', description: 'Need at least 2 teams to generate bracket', variant: 'destructive' });
      return false;
    }

    // Sort by seed or randomize
    let seededTeams = [...registrations];
    if (tournament.seeding_type === 'random') {
      seededTeams = seededTeams.sort(() => Math.random() - 0.5);
    } else if (tournament.seeding_type === 'rating') {
      // Sort by team rating (would need to calculate average team rating)
      seededTeams = seededTeams.sort(() => Math.random() - 0.5); // Fallback to random for now
    } else {
      seededTeams = seededTeams.sort((a, b) => (a.seed || 999) - (b.seed || 999));
    }

    // Calculate number of rounds for single elimination
    const rounds = Math.ceil(Math.log2(teamCount));
    const bracketSize = Math.pow(2, rounds);
    
    // Create first round matches
    const firstRoundMatches: { round: number; match_number: number; team1_id: string | null; team2_id: string | null }[] = [];
    const firstRoundMatchCount = bracketSize / 2;
    
    for (let i = 0; i < firstRoundMatchCount; i++) {
      const team1 = seededTeams[i] || null;
      const team2 = seededTeams[bracketSize - 1 - i] || null;
      
      firstRoundMatches.push({
        round: 1,
        match_number: i + 1,
        team1_id: team1?.team_id || null,
        team2_id: team2?.team_id || null
      });
    }

    // Delete existing matches
    await supabase.from('matches').delete().eq('tournament_id', tournamentId);

    // Insert first round matches
    const matchesToInsert = firstRoundMatches.map(m => ({
      tournament_id: tournamentId,
      round: m.round,
      match_number: m.match_number,
      team1_id: m.team1_id,
      team2_id: m.team2_id,
      status: 'pending'
    }));

    // Also create placeholder matches for subsequent rounds
    let matchNum = firstRoundMatchCount + 1;
    for (let round = 2; round <= rounds; round++) {
      const matchesInRound = Math.pow(2, rounds - round);
      for (let i = 0; i < matchesInRound; i++) {
        matchesToInsert.push({
          tournament_id: tournamentId,
          round,
          match_number: matchNum++,
          team1_id: null,
          team2_id: null,
          status: 'pending'
        });
      }
    }

    const { error } = await supabase.from('matches').insert(matchesToInsert);

    if (error) {
      toast({ title: 'Error', description: 'Failed to generate bracket', variant: 'destructive' });
      return false;
    }

    // Handle byes (advance teams with no opponent)
    for (const match of firstRoundMatches) {
      if (match.team1_id && !match.team2_id) {
        // Team 1 gets a bye
        await advanceWinner(tournamentId, 1, match.match_number, match.team1_id);
      } else if (!match.team1_id && match.team2_id) {
        // Team 2 gets a bye
        await advanceWinner(tournamentId, 1, match.match_number, match.team2_id);
      }
    }

    toast({ title: 'Bracket Generated', description: `Created ${matchesToInsert.length} matches across ${rounds} rounds` });
    await fetchMatches();
    return true;
  };

  const advanceWinner = async (tournyId: string, round: number, matchNumber: number, winnerId: string) => {
    // Find the next match
    const matchesPerRound = registrations.length / Math.pow(2, round);
    const nextRound = round + 1;
    const nextMatchNumber = Math.ceil(matchNumber / 2);
    const isUpperSlot = matchNumber % 2 === 1;

    const { data: nextMatch } = await supabase
      .from('matches')
      .select('*')
      .eq('tournament_id', tournyId)
      .eq('round', nextRound)
      .maybeSingle();

    if (nextMatch) {
      const updateData = isUpperSlot 
        ? { team1_id: winnerId }
        : { team2_id: winnerId };
      
      await supabase.from('matches').update(updateData).eq('id', nextMatch.id);
    }
  };

  const updateMatchScore = async (matchId: string, team1Score: number, team2Score: number, winnerId: string | null) => {
    const { error } = await supabase
      .from('matches')
      .update({
        team1_score: team1Score,
        team2_score: team2Score,
        winner_id: winnerId,
        status: winnerId ? 'completed' : 'in_progress',
        completed_at: winnerId ? new Date().toISOString() : null
      })
      .eq('id', matchId);

    if (error) {
      toast({ title: 'Error', description: 'Failed to update match', variant: 'destructive' });
      return false;
    }

    // If there's a winner, advance to next round
    if (winnerId) {
      const match = matches.find(m => m.id === matchId);
      if (match && tournament) {
        const rounds = Math.ceil(Math.log2(registrations.length));
        if (match.round < rounds) {
          // Find next match
          const nextMatchNum = Math.ceil(match.match_number / 2);
          const isUpperSlot = match.match_number % 2 === 1;
          
          const { data: nextMatch } = await supabase
            .from('matches')
            .select('*')
            .eq('tournament_id', tournamentId)
            .eq('round', match.round + 1)
            .limit(100);

          const targetMatch = nextMatch?.find(m => {
            // Calculate which match this should feed into
            const expectedMatchNumber = nextMatchNum + (Math.pow(2, rounds - match.round) / 2 - Math.pow(2, rounds - match.round - 1));
            return m.match_number === Math.ceil(match.match_number / 2) + (Math.pow(2, rounds - 1) - Math.pow(2, rounds - match.round));
          });

          // Simplified: just find any match in next round that needs this team
          if (nextMatch && nextMatch.length > 0) {
            const idx = Math.ceil(match.match_number / 2) - 1;
            if (nextMatch[idx]) {
              const updateField = match.match_number % 2 === 1 ? 'team1_id' : 'team2_id';
              await supabase
                .from('matches')
                .update({ [updateField]: winnerId })
                .eq('id', nextMatch[idx].id);
            }
          }
        }
      }
    }

    toast({ title: 'Match Updated', description: winnerId ? 'Winner advanced to next round' : 'Score updated' });
    await fetchMatches();
    return true;
  };

  return {
    tournament,
    registrations,
    matches,
    loading,
    updateStatus,
    updateSeed,
    removeRegistration,
    generateBracket,
    updateMatchScore,
    refresh: () => Promise.all([fetchTournament(), fetchRegistrations(), fetchMatches()])
  };
}
