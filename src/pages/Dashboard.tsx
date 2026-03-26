import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/hooks/useNotifications";
import { useWallet } from "@/hooks/useWallet";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/ScrollReveal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Trophy, Users, Shield, Plus, Calendar, ChevronRight, Target, 
  Swords, Bell, Wallet, TrendingUp, Clock, CheckCircle2 
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Team {
  id: string;
  name: string;
  tag: string | null;
  logo_url: string | null;
  max_members: number;
}

interface Tournament {
  id: string;
  name: string;
  status: string;
  start_time: string | null;
  team_size: number;
  max_teams: number | null;
}

interface MatchHistory {
  id: string;
  tournament_id: string;
  round: number;
  status: string;
  team1_score: number;
  team2_score: number;
  winner_id: string | null;
  completed_at: string | null;
  team1: { id: string; name: string; tag: string | null } | null;
  team2: { id: string; name: string; tag: string | null } | null;
  tournament: { name: string } | null;
}

export default function Dashboard() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const { notifications } = useNotifications();
  const { balance, frozenBalance } = useWallet();
  const [myTeams, setMyTeams] = useState<Team[]>([]);
  const [myTournaments, setMyTournaments] = useState<Tournament[]>([]);
  const [upcomingTournaments, setUpcomingTournaments] = useState<Tournament[]>([]);
  const [recentMatches, setRecentMatches] = useState<MatchHistory[]>([]);
  const [upcomingMatches, setUpcomingMatches] = useState<MatchHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;

    try {
      // Fetch teams where user is owner or member
      const { data: teamsData } = await supabase
        .from("teams")
        .select("*")
        .eq("owner_id", user.id);

      const { data: memberTeams } = await supabase
        .from("team_members")
        .select("team_id, teams:team_id(id, name, tag, logo_url, max_members)")
        .eq("user_id", user.id);

      const allTeams = [
        ...(teamsData || []),
        ...(memberTeams || []).map(m => m.teams as unknown as Team).filter(Boolean)
      ];
      const uniqueTeams = allTeams.filter((t, i, arr) => arr.findIndex(x => x.id === t.id) === i);

      // Fetch tournaments created by user
      const { data: tournamentsData } = await supabase
        .from("tournaments")
        .select("*")
        .eq("creator_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);

      // Fetch upcoming public tournaments
      const { data: upcomingData } = await supabase
        .from("tournaments")
        .select("*")
        .in("status", ["registration_open", "check_in"])
        .order("start_time", { ascending: true })
        .limit(5);

      // Fetch user's team IDs for match queries
      const teamIds = uniqueTeams.map(t => t.id);

      if (teamIds.length > 0) {
        // Fetch completed matches
        const { data: completedMatches } = await supabase
          .from("matches")
          .select("*, team1:teams!matches_team1_id_fkey(id, name, tag), team2:teams!matches_team2_id_fkey(id, name, tag), tournament:tournaments!matches_tournament_id_fkey(name)")
          .or(teamIds.map(id => `team1_id.eq.${id},team2_id.eq.${id}`).join(","))
          .eq("status", "completed")
          .order("completed_at", { ascending: false })
          .limit(5);

        // Fetch upcoming/pending matches
        const { data: pendingMatches } = await supabase
          .from("matches")
          .select("*, team1:teams!matches_team1_id_fkey(id, name, tag), team2:teams!matches_team2_id_fkey(id, name, tag), tournament:tournaments!matches_tournament_id_fkey(name)")
          .or(teamIds.map(id => `team1_id.eq.${id},team2_id.eq.${id}`).join(","))
          .in("status", ["pending", "in_progress"])
          .order("scheduled_time", { ascending: true })
          .limit(5);

        setRecentMatches((completedMatches || []) as MatchHistory[]);
        setUpcomingMatches((pendingMatches || []) as MatchHistory[]);
      }

      setMyTeams(uniqueTeams);
      setMyTournaments(tournamentsData || []);
      setUpcomingTournaments(upcomingData || []);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Target className="w-12 h-12 text-crimson animate-pulse mx-auto mb-4" />
          <p className="text-muted-foreground">Loading command center...</p>
        </div>
      </div>
    );
  }

  const recentNotifications = notifications.slice(0, 5);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-6">
          {/* Welcome Section */}
          <ScrollReveal>
            <div className="mb-12">
              <h1 className="font-heading text-4xl md:text-5xl text-white mb-2">
                COMMAND CENTER
              </h1>
              <p className="text-muted-foreground">
                Welcome back, <span className="text-crimson">{profile?.username || "Operator"}</span>
              </p>
            </div>
          </ScrollReveal>

          {/* Quick Stats - Enhanced */}
          <ScrollReveal delay={0.1}>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-12">
              <div className="bg-card/50 border border-border p-5 hover:border-crimson/50 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <Users className="w-5 h-5 text-crimson/70" />
                </div>
                <p className="font-heading text-2xl text-white">{myTeams.length}</p>
                <p className="text-muted-foreground text-xs uppercase tracking-wider">Teams</p>
              </div>
              
              <div className="bg-card/50 border border-border p-5 hover:border-crimson/50 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <Trophy className="w-5 h-5 text-crimson/70" />
                </div>
                <p className="font-heading text-2xl text-white">{profile?.wins || 0}</p>
                <p className="text-muted-foreground text-xs uppercase tracking-wider">Wins</p>
              </div>

              <div className="bg-card/50 border border-border p-5 hover:border-crimson/50 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <TrendingUp className="w-5 h-5 text-crimson/70" />
                </div>
                <p className="font-heading text-2xl text-white">{profile?.elo_rating || 1000}</p>
                <p className="text-muted-foreground text-xs uppercase tracking-wider">ELO</p>
              </div>
              
              <div className="bg-card/50 border border-border p-5 hover:border-crimson/50 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <Swords className="w-5 h-5 text-crimson/70" />
                </div>
                <p className="font-heading text-2xl text-white">{profile?.total_matches || 0}</p>
                <p className="text-muted-foreground text-xs uppercase tracking-wider">Matches</p>
              </div>

              <div className="bg-card/50 border border-border p-5 hover:border-crimson/50 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <Wallet className="w-5 h-5 text-crimson/70" />
                </div>
                <p className="font-heading text-2xl text-white">{balance}</p>
                <p className="text-muted-foreground text-xs uppercase tracking-wider">Credits</p>
              </div>
            </div>
          </ScrollReveal>

          {/* Quick Actions */}
          <ScrollReveal delay={0.2}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
              <Link to="/teams/create" className="block">
                <div className="bg-gradient-to-r from-crimson/20 to-wine/20 border border-crimson/30 p-6 hover:border-crimson transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-crimson/20 flex items-center justify-center">
                      <Plus className="w-6 h-6 text-crimson" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-heading text-xl text-white group-hover:text-crimson transition-colors">
                        CREATE TEAM
                      </h3>
                      <p className="text-muted-foreground text-sm">Assemble your squad</p>
                    </div>
                    <ChevronRight className="w-6 h-6 text-muted-foreground group-hover:text-crimson transition-colors" />
                  </div>
                </div>
              </Link>

              <Link to="/tournaments/create" className="block">
                <div className="bg-gradient-to-r from-wine/20 to-crimson/20 border border-crimson/30 p-6 hover:border-crimson transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-crimson/20 flex items-center justify-center">
                      <Trophy className="w-6 h-6 text-crimson" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-heading text-xl text-white group-hover:text-crimson transition-colors">
                        HOST TOURNAMENT
                      </h3>
                      <p className="text-muted-foreground text-sm">Organize competitive events</p>
                    </div>
                    <ChevronRight className="w-6 h-6 text-muted-foreground group-hover:text-crimson transition-colors" />
                  </div>
                </div>
              </Link>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            {/* Upcoming Matches */}
            <ScrollReveal delay={0.25}>
              <div className="lg:col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-heading text-xl text-white flex items-center gap-2">
                    <Clock className="w-5 h-5 text-crimson" /> UPCOMING MATCHES
                  </h2>
                </div>
                {upcomingMatches.length === 0 ? (
                  <div className="bg-card/30 border border-border p-8 text-center">
                    <Swords className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground text-sm">No upcoming matches</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {upcomingMatches.map((match) => (
                      <Link key={match.id} to={`/tournaments/${match.tournament_id}`}
                        className="block bg-card/50 border border-border p-4 hover:border-crimson/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 text-sm">
                              <span className="text-white font-heading">
                                {match.team1?.tag ? `[${match.team1.tag}]` : ''} {match.team1?.name || 'TBD'}
                              </span>
                              <span className="text-crimson font-heading">VS</span>
                              <span className="text-white font-heading">
                                {match.team2?.tag ? `[${match.team2.tag}]` : ''} {match.team2?.name || 'TBD'}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant="outline" className="text-xs border-crimson/30 text-crimson">
                              {match.status === "in_progress" ? "LIVE" : "PENDING"}
                            </Badge>
                            <p className="text-muted-foreground text-xs mt-1">{match.tournament?.name}</p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </ScrollReveal>

            {/* Recent Notifications */}
            <ScrollReveal delay={0.3}>
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-heading text-xl text-white flex items-center gap-2">
                    <Bell className="w-5 h-5 text-crimson" /> NOTIFICATIONS
                  </h2>
                </div>
                {recentNotifications.length === 0 ? (
                  <div className="bg-card/30 border border-border p-8 text-center">
                    <Bell className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground text-sm">No notifications</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {recentNotifications.map((n) => (
                      <div key={n.id} className={`bg-card/50 border p-3 text-sm ${n.read ? 'border-border' : 'border-crimson/30'}`}>
                        <p className="text-white font-medium text-xs">{n.title}</p>
                        <p className="text-muted-foreground text-xs line-clamp-1">{n.message}</p>
                        <p className="text-muted-foreground/50 text-[10px] mt-1">
                          {formatDistanceToNow(new Date(n.created_at || ''), { addSuffix: true })}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </ScrollReveal>
          </div>

          {/* Match History */}
          <ScrollReveal delay={0.35}>
            <div className="mb-12">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-heading text-xl text-white flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-crimson" /> MATCH HISTORY
                </h2>
              </div>
              {recentMatches.length === 0 ? (
                <div className="bg-card/30 border border-border p-8 text-center">
                  <Swords className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm">No completed matches yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentMatches.map((match) => {
                    const userTeamIds = myTeams.map(t => t.id);
                    const isWinner = match.winner_id && userTeamIds.includes(match.winner_id);
                    return (
                      <Link key={match.id} to={`/tournaments/${match.tournament_id}`}
                        className="block bg-card/50 border border-border p-4 hover:border-crimson/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`w-2 h-8 ${isWinner ? 'bg-green-500' : 'bg-red-500'}`} />
                            <div className="flex items-center gap-2 text-sm">
                              <span className="text-white font-heading">
                                {match.team1?.tag ? `[${match.team1.tag}]` : ''} {match.team1?.name || 'TBD'}
                              </span>
                              <span className="text-crimson font-heading mx-1">
                                {match.team1_score} - {match.team2_score}
                              </span>
                              <span className="text-white font-heading">
                                {match.team2?.tag ? `[${match.team2.tag}]` : ''} {match.team2?.name || 'TBD'}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge className={isWinner ? 'bg-green-500/20 text-green-400 border-0' : 'bg-red-500/20 text-red-400 border-0'}>
                              {isWinner ? 'WIN' : 'LOSS'}
                            </Badge>
                            <p className="text-muted-foreground text-xs mt-1">{match.tournament?.name}</p>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </ScrollReveal>

          {/* My Teams */}
          <ScrollReveal delay={0.4}>
            <div className="mb-12">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-heading text-2xl text-white">MY TEAMS</h2>
                <Link to="/teams" className="text-crimson hover:text-white transition-colors text-sm">
                  View All
                </Link>
              </div>

              {myTeams.length === 0 ? (
                <div className="bg-card/30 border border-border p-8 text-center">
                  <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">You haven't joined any teams yet.</p>
                  <Button asChild className="mt-4 btn-outline-tactical">
                    <Link to="/teams/create">Create Your First Team</Link>
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {myTeams.map((team) => (
                    <Link
                      key={team.id}
                      to={`/teams/${team.id}`}
                      className="bg-card/50 border border-border p-4 hover:border-crimson/50 transition-colors group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-crimson/20 flex items-center justify-center">
                          <Shield className="w-6 h-6 text-crimson" />
                        </div>
                        <div>
                          <h3 className="font-heading text-lg text-white group-hover:text-crimson transition-colors">
                            {team.tag && `[${team.tag}] `}{team.name}
                          </h3>
                          <p className="text-muted-foreground text-sm">{team.max_members} members max</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </ScrollReveal>

          {/* Open Tournaments */}
          <ScrollReveal delay={0.5}>
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-heading text-2xl text-white">OPEN TOURNAMENTS</h2>
                <Link to="/tournaments" className="text-crimson hover:text-white transition-colors text-sm">
                  View All
                </Link>
              </div>

              {upcomingTournaments.length === 0 ? (
                <div className="bg-card/30 border border-border p-8 text-center">
                  <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No tournaments open for registration.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {upcomingTournaments.map((tournament) => (
                    <Link
                      key={tournament.id}
                      to={`/tournaments/${tournament.id}`}
                      className="block bg-card/50 border border-border p-4 hover:border-crimson/50 transition-colors group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Trophy className="w-8 h-8 text-crimson/50" />
                          <div>
                            <h3 className="font-heading text-lg text-white group-hover:text-crimson transition-colors">
                              {tournament.name}
                            </h3>
                            <p className="text-muted-foreground text-sm">
                              {tournament.team_size}v{tournament.team_size} • {tournament.max_teams || "Unlimited"} teams max
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`text-xs px-2 py-1 uppercase tracking-wider ${
                            tournament.status === "registration_open" 
                              ? "bg-green-500/20 text-green-400" 
                              : "bg-yellow-500/20 text-yellow-400"
                          }`}>
                            {tournament.status.replace("_", " ")}
                          </span>
                          {tournament.start_time && (
                            <p className="text-muted-foreground text-sm mt-1">
                              {new Date(tournament.start_time).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </ScrollReveal>
        </div>
      </main>

      <Footer />
    </div>
  );
}
