import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Shield, ChevronRight, Clock, Check } from "lucide-react";
import { motion } from "framer-motion";

interface Match {
  id: string;
  round: number;
  match_number: number;
  team1_id: string | null;
  team2_id: string | null;
  team1_score: number | null;
  team2_score: number | null;
  winner_id: string | null;
  status: string | null;
  scheduled_time: string | null;
  team1?: { id: string; name: string; tag: string | null };
  team2?: { id: string; name: string; tag: string | null };
}

interface TournamentBracketProps {
  tournamentId: string;
  bracketType?: string;
}

export function TournamentBracket({ tournamentId, bracketType = "single_elimination" }: TournamentBracketProps) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchMatches();

    // Live score updates — subscribe to any change on this tournament's matches
    const channel = supabase
      .channel(`bracket_${tournamentId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "matches", filter: `tournament_id=eq.${tournamentId}` },
        () => fetchMatches()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tournamentId]);

  const fetchMatches = async () => {
    const { data, error } = await supabase
      .from("matches")
      .select(`
        *,
        team1:teams!matches_team1_id_fkey(id, name, tag),
        team2:teams!matches_team2_id_fkey(id, name, tag)
      `)
      .eq("tournament_id", tournamentId)
      .order("round", { ascending: true })
      .order("match_number", { ascending: true });

    if (!error && data) {
      setMatches(data as Match[]);
    }
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-pulse text-crimson">Loading bracket...</div>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="bg-card/30 border border-border p-12 text-center">
        <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Bracket not yet generated</p>
      </div>
    );
  }

  // Group matches by round
  const rounds = matches.reduce((acc, match) => {
    if (!acc[match.round]) {
      acc[match.round] = [];
    }
    acc[match.round].push(match);
    return acc;
  }, {} as Record<number, Match[]>);

  const roundNumbers = Object.keys(rounds).map(Number).sort((a, b) => a - b);
  const maxRound = Math.max(...roundNumbers);

  const getRoundName = (round: number) => {
    const totalRounds = maxRound;
    if (round === totalRounds) return "FINALS";
    if (round === totalRounds - 1) return "SEMI-FINALS";
    if (round === totalRounds - 2) return "QUARTER-FINALS";
    return `ROUND ${round}`;
  };

  const getMatchStatus = (match: Match) => {
    if (match.winner_id) return "completed";
    if (match.status === "in_progress") return "live";
    if (match.team1_id && match.team2_id) return "ready";
    return "pending";
  };

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-8 min-w-max">
        {roundNumbers.map((roundNum, roundIndex) => (
          <div key={roundNum} className="flex flex-col">
            {/* Round Header */}
            <div className="text-center mb-4">
              <h3 className="font-heading text-sm text-crimson uppercase tracking-wider">
                {getRoundName(roundNum)}
              </h3>
            </div>

            {/* Matches in this round */}
            <div 
              className="flex flex-col justify-around flex-1 gap-4"
              style={{ 
                minHeight: `${Math.pow(2, maxRound - roundNum) * 100}px`
              }}
            >
              {rounds[roundNum].map((match, matchIndex) => (
                <motion.div
                  key={match.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: roundIndex * 0.1 + matchIndex * 0.05 }}
                  className="relative"
                >
                  <MatchCard match={match} />
                  
                  {/* Connector lines for single elimination */}
                  {roundIndex < roundNumbers.length - 1 && (
                    <div className="absolute right-0 top-1/2 w-8 h-px bg-border translate-x-full" />
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        ))}

        {/* Champion */}
        {matches.some(m => m.round === maxRound && m.winner_id) && (
          <div className="flex flex-col justify-center">
            <div className="text-center mb-4">
              <h3 className="font-heading text-sm text-yellow-500 uppercase tracking-wider">
                CHAMPION
              </h3>
            </div>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 border-2 border-yellow-500 p-6"
            >
              <Trophy className="w-12 h-12 text-yellow-500 mx-auto mb-2" />
              {(() => {
                const finalMatch = matches.find(m => m.round === maxRound);
                const winner = finalMatch?.winner_id === finalMatch?.team1_id 
                  ? finalMatch?.team1 
                  : finalMatch?.team2;
                return (
                  <p className="font-heading text-lg text-yellow-500 text-center">
                    {winner?.tag && `[${winner.tag}] `}{winner?.name || "TBD"}
                  </p>
                );
              })()}
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}

function MatchCard({ match }: { match: Match }) {
  const status = getMatchStatus(match);

  return (
    <div className={`w-56 bg-card/50 border transition-colors ${
      status === "completed" ? "border-green-500/30" :
      status === "live" ? "border-crimson animate-pulse" :
      status === "ready" ? "border-border hover:border-crimson/50" :
      "border-border/50"
    }`}>
      {/* Match Header */}
      <div className="flex items-center justify-between px-3 py-1 bg-background/50 border-b border-border">
        <span className="text-xs text-muted-foreground">Match {match.match_number}</span>
        <StatusBadge status={status} />
      </div>

      {/* Teams */}
      <div className="divide-y divide-border/50">
        <TeamRow 
          team={match.team1} 
          score={match.team1_score}
          isWinner={match.winner_id === match.team1_id}
          hasWinner={!!match.winner_id}
        />
        <TeamRow 
          team={match.team2} 
          score={match.team2_score}
          isWinner={match.winner_id === match.team2_id}
          hasWinner={!!match.winner_id}
        />
      </div>

      {/* Scheduled Time */}
      {match.scheduled_time && status !== "completed" && (
        <div className="px-3 py-1 bg-background/30 border-t border-border">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            {new Date(match.scheduled_time).toLocaleString(undefined, {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit"
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function TeamRow({ 
  team, 
  score, 
  isWinner, 
  hasWinner 
}: { 
  team?: { id: string; name: string; tag: string | null }; 
  score: number | null;
  isWinner: boolean;
  hasWinner: boolean;
}) {
  return (
    <div className={`flex items-center justify-between px-3 py-2 ${
      hasWinner 
        ? isWinner 
          ? "bg-green-500/10" 
          : "opacity-50" 
        : ""
    }`}>
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <Shield className={`w-4 h-4 shrink-0 ${isWinner ? "text-green-500" : "text-muted-foreground"}`} />
        <span className={`text-sm truncate ${
          isWinner ? "text-white font-medium" : 
          hasWinner ? "text-muted-foreground" : 
          team ? "text-white" : "text-muted-foreground"
        }`}>
          {team ? (
            <>
              {team.tag && <span className="text-crimson">[{team.tag}] </span>}
              {team.name}
            </>
          ) : (
            "TBD"
          )}
        </span>
      </div>
      <div className={`font-heading text-lg w-8 text-center ${
        isWinner ? "text-green-500" : "text-muted-foreground"
      }`}>
        {score ?? "-"}
      </div>
      {isWinner && (
        <Check className="w-4 h-4 text-green-500 shrink-0" />
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "completed":
      return (
        <span className="text-xs bg-green-500/20 text-green-400 px-1.5 py-0.5 uppercase">
          Final
        </span>
      );
    case "live":
      return (
        <span className="text-xs bg-crimson/20 text-crimson px-1.5 py-0.5 uppercase flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-crimson rounded-full animate-pulse" />
          Live
        </span>
      );
    case "ready":
      return (
        <span className="text-xs bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 uppercase">
          Ready
        </span>
      );
    default:
      return (
        <span className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 uppercase">
          Pending
        </span>
      );
  }
}

function getMatchStatus(match: Match) {
  if (match.winner_id) return "completed";
  if (match.status === "in_progress") return "live";
  if (match.team1_id && match.team2_id) return "ready";
  return "pending";
}
