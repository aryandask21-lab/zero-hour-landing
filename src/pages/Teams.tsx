import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/ScrollReveal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Shield, Users, Search, Plus, Target } from "lucide-react";

interface Team {
  id: string;
  name: string;
  tag: string | null;
  logo_url: string | null;
  description: string | null;
  max_members: number;
  owner_id: string;
}

export default function Teams() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const { data, error } = await supabase
        .from("teams")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTeams(data || []);
    } catch (error) {
      console.error("Error fetching teams:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTeams = teams.filter(t =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.tag?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Target className="w-12 h-12 text-crimson animate-pulse mx-auto mb-4" />
          <p className="text-muted-foreground">Loading teams...</p>
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
                  TEAMS
                </h1>
                <p className="text-muted-foreground">
                  Browse and join tactical squads
                </p>
              </div>
              
              {user && (
                <Button asChild className="btn-primary-tactical">
                  <Link to="/teams/create">
                    <Plus size={16} className="mr-2" />
                    CREATE TEAM
                  </Link>
                </Button>
              )}
            </div>
          </ScrollReveal>

          {/* Search */}
          <ScrollReveal delay={0.1}>
            <div className="relative mb-8">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search teams..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 bg-card/50 border-border focus:border-crimson"
              />
            </div>
          </ScrollReveal>

          {/* Team List */}
          <ScrollReveal delay={0.2}>
            {filteredTeams.length === 0 ? (
              <div className="bg-card/30 border border-border p-12 text-center">
                <Shield className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-heading text-xl text-white mb-2">No Teams Found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery ? "Try a different search term" : "Be the first to create a team!"}
                </p>
                {user && (
                  <Button asChild className="btn-outline-tactical">
                    <Link to="/teams/create">Create Team</Link>
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTeams.map((team) => (
                  <Link
                    key={team.id}
                    to={`/teams/${team.id}`}
                    className="block bg-card/50 border border-border hover:border-crimson/50 transition-all group"
                  >
                    <div className="p-6">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-14 h-14 bg-crimson/20 flex items-center justify-center flex-shrink-0">
                          {team.logo_url ? (
                            <img src={team.logo_url} alt={team.name} className="w-full h-full object-cover" />
                          ) : (
                            <Shield className="w-7 h-7 text-crimson" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-heading text-xl text-white group-hover:text-crimson transition-colors truncate">
                            {team.tag && <span className="text-crimson">[{team.tag}]</span>} {team.name}
                          </h3>
                          <div className="flex items-center gap-2 text-muted-foreground text-sm">
                            <Users size={14} />
                            <span>{team.max_members} members max</span>
                          </div>
                        </div>
                      </div>

                      {team.description && (
                        <p className="text-muted-foreground text-sm line-clamp-2">
                          {team.description}
                        </p>
                      )}

                      {user && team.owner_id === user.id && (
                        <div className="mt-4 pt-4 border-t border-border">
                          <span className="text-xs text-crimson uppercase tracking-wider">
                            You own this team
                          </span>
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
