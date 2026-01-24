import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/ScrollReveal";
import { Button } from "@/components/ui/button";
import { Trophy, Users, Shield, Plus, Calendar, ChevronRight, Target } from "lucide-react";

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

export default function Dashboard() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [myTeams, setMyTeams] = useState<Team[]>([]);
  const [myTournaments, setMyTournaments] = useState<Tournament[]>([]);
  const [upcomingTournaments, setUpcomingTournaments] = useState<Tournament[]>([]);
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
      // Fetch teams where user is owner
      const { data: teamsData } = await supabase
        .from("teams")
        .select("*")
        .eq("owner_id", user.id);

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

      setMyTeams(teamsData || []);
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

          {/* Quick Stats */}
          <ScrollReveal delay={0.1}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="bg-card/50 border border-border p-6 hover:border-crimson/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm uppercase tracking-wider">My Teams</p>
                    <p className="font-heading text-3xl text-white mt-1">{myTeams.length}</p>
                  </div>
                  <Users className="w-10 h-10 text-crimson/50" />
                </div>
              </div>
              
              <div className="bg-card/50 border border-border p-6 hover:border-crimson/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm uppercase tracking-wider">My Tournaments</p>
                    <p className="font-heading text-3xl text-white mt-1">{myTournaments.length}</p>
                  </div>
                  <Trophy className="w-10 h-10 text-crimson/50" />
                </div>
              </div>
              
              <div className="bg-card/50 border border-border p-6 hover:border-crimson/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm uppercase tracking-wider">Open Tournaments</p>
                    <p className="font-heading text-3xl text-white mt-1">{upcomingTournaments.length}</p>
                  </div>
                  <Calendar className="w-10 h-10 text-crimson/50" />
                </div>
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

          {/* My Teams */}
          <ScrollReveal delay={0.3}>
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
                  <p className="text-muted-foreground">You haven't created any teams yet.</p>
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

          {/* Upcoming Tournaments */}
          <ScrollReveal delay={0.4}>
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
