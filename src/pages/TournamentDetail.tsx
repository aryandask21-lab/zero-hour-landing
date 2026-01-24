import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/ScrollReveal";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Shield, Users, Trophy, Settings, UserPlus, Calendar, Target, Video } from "lucide-react";

interface Tournament {
  id: string;
  name: string;
  description: string | null;
  game_mode: string | null;
  team_size: number;
  max_teams: number | null;
  prize_pool: string | null;
  rules: string | null;
  start_time: string | null;
  end_time: string | null;
  registration_deadline: string | null;
  livestream_url: string | null;
  bracket_type: string | null;
  status: string;
  creator_id: string;
  creator?: { username: string };
}

interface Registration {
  id: string;
  team_id: string;
  check_in_status: string;
  team: { id: string; name: string; tag: string | null };
}

export default function TournamentDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [userTeams, setUserTeams] = useState<{ id: string; name: string; tag: string | null }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);

  const isCreator = user && tournament?.creator_id === user.id;

  useEffect(() => {
    if (id) {
      fetchTournament();
    }
  }, [id]);

  useEffect(() => {
    if (user) {
      fetchUserTeams();
    }
  }, [user]);

  const fetchTournament = async () => {
    try {
      const { data: tournamentData, error: tournamentError } = await supabase
        .from("tournaments")
        .select(`*, creator:profiles!tournaments_creator_id_fkey(username)`)
        .eq("id", id)
        .maybeSingle();

      if (tournamentError) throw tournamentError;
      if (!tournamentData) {
        navigate("/tournaments");
        return;
      }

      setTournament(tournamentData);

      // Fetch registrations
      const { data: regData } = await supabase
        .from("tournament_registrations")
        .select(`*, team:teams(id, name, tag)`)
        .eq("tournament_id", id);

      setRegistrations(regData || []);
    } catch (error) {
      console.error("Error fetching tournament:", error);
      toast({
        title: "Error",
        description: "Failed to load tournament",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserTeams = async () => {
    if (!user) return;

    const { data } = await supabase
      .from("teams")
      .select("id, name, tag")
      .eq("owner_id", user.id);

    setUserTeams(data || []);
  };

  const handleRegister = async (teamId: string) => {
    if (!user || !tournament) return;

    setIsRegistering(true);
    try {
      const { error } = await supabase
        .from("tournament_registrations")
        .insert({
          tournament_id: tournament.id,
          team_id: teamId,
          registered_by: user.id
        });

      if (error) throw error;

      toast({
        title: "Registered",
        description: "Your team has been registered for this tournament"
      });

      fetchTournament();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to register. Please try again.";
      toast({
        title: "Error",
        description: message,
        variant: "destructive"
      });
    } finally {
      setIsRegistering(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "registration_open": return "bg-green-500/20 text-green-400";
      case "registration_closed": return "bg-yellow-500/20 text-yellow-400";
      case "check_in": return "bg-blue-500/20 text-blue-400";
      case "in_progress": return "bg-crimson/20 text-crimson";
      case "completed": return "bg-muted text-muted-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getYouTubeEmbedUrl = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : null;
  };

  const getTwitchEmbedUrl = (url: string) => {
    const match = url.match(/twitch\.tv\/([^/?\s]+)/);
    return match ? `https://player.twitch.tv/?channel=${match[1]}&parent=${window.location.hostname}` : null;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Target className="w-12 h-12 text-crimson animate-pulse mx-auto mb-4" />
          <p className="text-muted-foreground">Loading tournament...</p>
        </div>
      </div>
    );
  }

  if (!tournament) return null;

  const registeredTeamIds = registrations.map(r => r.team_id);
  const availableTeamsToRegister = userTeams.filter(t => !registeredTeamIds.includes(t.id));

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-6">
          {/* Back Button */}
          <button
            onClick={() => navigate("/tournaments")}
            className="flex items-center gap-2 text-muted-foreground hover:text-white transition-colors mb-8"
          >
            <ArrowLeft size={16} />
            <span className="text-sm">Back to Tournaments</span>
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              <ScrollReveal>
                <div className="bg-card/50 border border-border p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-crimson/20 flex items-center justify-center">
                        <Trophy className="w-8 h-8 text-crimson" />
                      </div>
                      <div>
                        <h1 className="font-heading text-3xl text-white">
                          {tournament.name}
                        </h1>
                        <p className="text-muted-foreground">
                          Hosted by <span className="text-crimson">{tournament.creator?.username || "Unknown"}</span>
                        </p>
                      </div>
                    </div>
                    <span className={`text-xs px-3 py-1 uppercase tracking-wider ${getStatusColor(tournament.status)}`}>
                      {tournament.status.replace(/_/g, " ")}
                    </span>
                  </div>

                  {tournament.description && (
                    <p className="text-muted-foreground mb-6">
                      {tournament.description}
                    </p>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="bg-background/50 p-3">
                      <p className="text-muted-foreground text-xs uppercase">Format</p>
                      <p className="text-white font-heading">{tournament.team_size}v{tournament.team_size}</p>
                    </div>
                    <div className="bg-background/50 p-3">
                      <p className="text-muted-foreground text-xs uppercase">Mode</p>
                      <p className="text-white font-heading">{tournament.game_mode || "Bomb Defusal"}</p>
                    </div>
                    <div className="bg-background/50 p-3">
                      <p className="text-muted-foreground text-xs uppercase">Bracket</p>
                      <p className="text-white font-heading capitalize">{tournament.bracket_type?.replace(/_/g, " ") || "Single Elim"}</p>
                    </div>
                    <div className="bg-background/50 p-3">
                      <p className="text-muted-foreground text-xs uppercase">Teams</p>
                      <p className="text-white font-heading">{registrations.length}/{tournament.max_teams || "∞"}</p>
                    </div>
                  </div>

                  {tournament.prize_pool && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <p className="text-crimson font-heading text-xl">
                        Prize Pool: {tournament.prize_pool}
                      </p>
                    </div>
                  )}
                </div>
              </ScrollReveal>

              {/* Livestream Embed */}
              {tournament.livestream_url && (
                <ScrollReveal delay={0.1}>
                  <div className="bg-card/50 border border-border p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Video className="w-5 h-5 text-crimson" />
                      <h2 className="font-heading text-xl text-white">LIVESTREAM</h2>
                    </div>
                    
                    {(() => {
                      const youtubeEmbed = getYouTubeEmbedUrl(tournament.livestream_url!);
                      const twitchEmbed = getTwitchEmbedUrl(tournament.livestream_url!);

                      if (youtubeEmbed) {
                        return (
                          <div className="aspect-video">
                            <iframe
                              src={youtubeEmbed}
                              className="w-full h-full"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                          </div>
                        );
                      }

                      if (twitchEmbed) {
                        return (
                          <div className="aspect-video">
                            <iframe
                              src={twitchEmbed}
                              className="w-full h-full"
                              allowFullScreen
                            />
                          </div>
                        );
                      }

                      return (
                        <a
                          href={tournament.livestream_url!}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-crimson hover:underline"
                        >
                          Watch Stream →
                        </a>
                      );
                    })()}
                  </div>
                </ScrollReveal>
              )}

              {/* Rules */}
              {tournament.rules && (
                <ScrollReveal delay={0.2}>
                  <div className="bg-card/50 border border-border p-6">
                    <h2 className="font-heading text-xl text-white mb-4">RULES</h2>
                    <div className="text-muted-foreground whitespace-pre-wrap text-sm">
                      {tournament.rules}
                    </div>
                  </div>
                </ScrollReveal>
              )}

              {/* Registered Teams */}
              <ScrollReveal delay={0.3}>
                <div className="bg-card/50 border border-border p-6">
                  <h2 className="font-heading text-xl text-white mb-4">REGISTERED TEAMS</h2>
                  
                  {registrations.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No teams registered yet
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {registrations.map((reg, index) => (
                        <div key={reg.id} className="flex items-center justify-between bg-background/50 p-3">
                          <div className="flex items-center gap-3">
                            <span className="text-muted-foreground w-6">#{index + 1}</span>
                            <Shield className="w-5 h-5 text-crimson/50" />
                            <span className="text-white">
                              {reg.team.tag && <span className="text-crimson">[{reg.team.tag}] </span>}
                              {reg.team.name}
                            </span>
                          </div>
                          <span className={`text-xs px-2 py-1 ${
                            reg.check_in_status === "checked_in" ? "bg-green-500/20 text-green-400" : "bg-muted text-muted-foreground"
                          }`}>
                            {reg.check_in_status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </ScrollReveal>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Schedule */}
              <ScrollReveal delay={0.1}>
                <div className="bg-card/50 border border-border p-6">
                  <h3 className="font-heading text-lg text-white mb-4">SCHEDULE</h3>
                  
                  <div className="space-y-4 text-sm">
                    {tournament.registration_deadline && (
                      <div className="flex items-center gap-3">
                        <Calendar className="w-4 h-4 text-crimson" />
                        <div>
                          <p className="text-muted-foreground text-xs">Registration Deadline</p>
                          <p className="text-white">{new Date(tournament.registration_deadline).toLocaleString()}</p>
                        </div>
                      </div>
                    )}
                    {tournament.start_time && (
                      <div className="flex items-center gap-3">
                        <Calendar className="w-4 h-4 text-crimson" />
                        <div>
                          <p className="text-muted-foreground text-xs">Tournament Start</p>
                          <p className="text-white">{new Date(tournament.start_time).toLocaleString()}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </ScrollReveal>

              {/* Actions */}
              <ScrollReveal delay={0.2}>
                <div className="bg-card/50 border border-border p-6 space-y-4">
                  {isCreator ? (
                    <>
                      <Button asChild className="w-full btn-primary-tactical">
                        <Link to={`/tournaments/${tournament.id}/manage`}>
                          <Settings size={16} className="mr-2" />
                          MANAGE TOURNAMENT
                        </Link>
                      </Button>
                    </>
                  ) : tournament.status === "registration_open" && user ? (
                    <>
                      {availableTeamsToRegister.length > 0 ? (
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground mb-2">Register a team:</p>
                          {availableTeamsToRegister.map(team => (
                            <Button
                              key={team.id}
                              onClick={() => handleRegister(team.id)}
                              disabled={isRegistering}
                              className="w-full btn-outline-tactical"
                            >
                              {team.tag && `[${team.tag}] `}{team.name}
                            </Button>
                          ))}
                        </div>
                      ) : userTeams.length === 0 ? (
                        <div className="text-center">
                          <p className="text-muted-foreground text-sm mb-2">You need a team to register</p>
                          <Button asChild className="w-full btn-outline-tactical">
                            <Link to="/teams/create">
                              <UserPlus size={16} className="mr-2" />
                              CREATE TEAM
                            </Link>
                          </Button>
                        </div>
                      ) : (
                        <p className="text-center text-muted-foreground text-sm">
                          All your teams are already registered
                        </p>
                      )}
                    </>
                  ) : !user ? (
                    <Button asChild className="w-full btn-primary-tactical">
                      <Link to="/auth">
                        SIGN IN TO REGISTER
                      </Link>
                    </Button>
                  ) : (
                    <p className="text-center text-muted-foreground text-sm">
                      Registration is closed
                    </p>
                  )}
                </div>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
