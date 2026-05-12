import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/ScrollReveal";
import { TournamentStatusStepper } from "@/components/TournamentStatusStepper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trophy, Calendar, Users, Search, Plus, Target } from "lucide-react";
import { formatIST } from "@/lib/datetime";
import { useAuth } from "@/contexts/AuthContext";

interface Tournament {
  id: string;
  name: string;
  description: string | null;
  game: string | null;
  game_mode: string | null;
  team_size: number;
  max_teams: number | null;
  prize_pool: string | null;
  start_time: string | null;
  status: string;
  creator_id: string;
}

type StatusFilter = "all" | "upcoming" | "ongoing" | "completed";

export default function Tournaments() {
  const { user } = useAuth();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  useEffect(() => {
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    try {
      // Auto-close any tournaments past their registration deadline
      await supabase.rpc("auto_close_expired_registrations");

      const { data, error } = await supabase
        .from("tournaments")
        .select("*")
        .neq("status", "draft")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTournaments(data || []);
    } catch (error) {
      console.error("Error fetching tournaments:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusGroup = (status: string): StatusFilter => {
    if (["registration_open", "registration_closed", "check_in"].includes(status)) return "upcoming";
    if (status === "in_progress") return "ongoing";
    if (status === "completed" || status === "cancelled") return "completed";
    return "upcoming";
  };

  const filteredTournaments = tournaments.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.game_mode?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = statusFilter === "all" || getStatusGroup(t.status) === statusFilter;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "registration_open":
        return "bg-green-500/20 text-green-400";
      case "registration_closed":
        return "bg-yellow-500/20 text-yellow-400";
      case "check_in":
        return "bg-blue-500/20 text-blue-400";
      case "in_progress":
        return "bg-crimson/20 text-crimson";
      case "completed":
        return "bg-muted text-muted-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const filterTabs: { key: StatusFilter; label: string; count: number }[] = [
    { key: "all", label: "All", count: tournaments.length },
    { key: "upcoming", label: "Upcoming", count: tournaments.filter(t => getStatusGroup(t.status) === "upcoming").length },
    { key: "ongoing", label: "Ongoing", count: tournaments.filter(t => getStatusGroup(t.status) === "ongoing").length },
    { key: "completed", label: "Completed", count: tournaments.filter(t => getStatusGroup(t.status) === "completed").length },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Target className="w-12 h-12 text-crimson animate-pulse mx-auto mb-4" />
          <p className="text-muted-foreground">Loading tournaments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-6">
          {/* Header */}
          <ScrollReveal>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <div>
                <h1 className="font-heading text-4xl md:text-5xl text-white mb-2">
                  TOURNAMENTS
                </h1>
                <p className="text-muted-foreground">
                  Compete in tactical esports events
                </p>
              </div>
              
              {user && (
                <Button asChild className="btn-primary-tactical">
                  <Link to="/tournaments/create">
                    <Plus size={16} className="mr-2" />
                    HOST TOURNAMENT
                  </Link>
                </Button>
              )}
            </div>
          </ScrollReveal>

          {/* Search & Filters */}
          <ScrollReveal delay={0.1}>
            <div className="space-y-4 mb-8">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search tournaments..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 bg-card/50 border-border focus:border-crimson"
                />
              </div>
              <div className="flex gap-2">
                {filterTabs.map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setStatusFilter(tab.key)}
                    className={`px-4 py-2 text-xs font-heading uppercase tracking-wider transition-all border ${
                      statusFilter === tab.key
                        ? "bg-crimson/20 border-crimson text-crimson"
                        : "bg-card/50 border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground"
                    }`}
                  >
                    {tab.label} ({tab.count})
                  </button>
                ))}
              </div>
            </div>
          </ScrollReveal>

          {/* Tournament List */}
          <ScrollReveal delay={0.2}>
            {filteredTournaments.length === 0 ? (
              <div className="bg-card/30 border border-border p-12 text-center">
                <Trophy className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-heading text-xl text-white mb-2">No Tournaments Found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery ? "Try a different search term" : "Be the first to host a tournament!"}
                </p>
                {user && (
                  <Button asChild className="btn-outline-tactical">
                    <Link to="/tournaments/create">Create Tournament</Link>
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredTournaments.map((tournament) => (
                  <Link
                    key={tournament.id}
                    to={`/tournaments/${tournament.id}`}
                    className="block bg-card/50 border border-border hover:border-crimson/50 transition-all group overflow-hidden"
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-crimson/20 flex items-center justify-center">
                            <Trophy className="w-6 h-6 text-crimson" />
                          </div>
                          <div>
                            <h3 className="font-heading text-xl text-white group-hover:text-crimson transition-colors">
                              {tournament.name}
                            </h3>
                            <p className="text-muted-foreground text-sm">
                              {tournament.game || "Tactical FPS"} · {tournament.game_mode || "Mixed"}
                            </p>
                          </div>
                        </div>
                        <span className={`text-xs px-2 py-1 uppercase tracking-wider ${getStatusColor(tournament.status)}`}>
                          {tournament.status.replace(/_/g, " ")}
                        </span>
                      </div>

                      {tournament.description && (
                        <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                          {tournament.description}
                        </p>
                      )}

                      <div className="flex items-center gap-6 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Users size={14} />
                          <span>{tournament.team_size}v{tournament.team_size}</span>
                        </div>
                        {tournament.max_teams && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <span>{tournament.max_teams} teams max</span>
                          </div>
                        )}
                        {tournament.start_time && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar size={14} />
                            <span>{formatIST(tournament.start_time, { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true })}</span>
                          </div>
                        )}
                      </div>

                      {/* Mini status stepper */}
                      <div className="mt-3 pt-3 border-t border-border">
                        <TournamentStatusStepper currentStatus={tournament.status} compact />
                      </div>
                      {tournament.prize_pool && (
                        <div className="mt-4 pt-4 border-t border-border">
                          <p className="text-crimson font-heading text-lg">
                            Prize: {tournament.prize_pool}
                          </p>
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </ScrollReveal>
        </div>
      </main>

      <Footer />
    </div>
  );
}
