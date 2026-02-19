import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useRoles } from "@/hooks/useRoles";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/ScrollReveal";
import { TournamentBracket } from "@/components/TournamentBracket";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Trophy,
  Users,
  Calendar,
  Target,
  Play,
  CheckCircle,
  Settings,
  Swords,
  BarChart3,
  Star,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { TournamentStatusStepper } from "@/components/TournamentStatusStepper";

interface Tournament {
  id: string;
  name: string;
  description: string | null;
  game_mode: string | null;
  team_size: number;
  max_teams: number | null;
  bracket_type: string | null;
  match_format: string | null;
  status: string;
  start_time: string | null;
  entry_fee: number | null;
  prize_pool: string | null;
  creator_id: string;
}

interface Registration {
  id: string;
  team_id: string;
  check_in_status: string;
  seed: number | null;
  team: { id: string; name: string; tag: string | null };
}

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

interface PlayerStat {
  id: string;
  player_id: string;
  team_id: string;
  kills: number;
  deaths: number;
  assists: number;
  score: number;
  is_mvp: boolean;
  profile?: { username: string };
}

export default function TournamentManage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { isAdmin } = useRoles();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  // Score update state
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [team1Score, setTeam1Score] = useState("0");
  const [team2Score, setTeam2Score] = useState("0");
  const [winnerId, setWinnerId] = useState("");

  // Player stats state
  const [statsMatch, setStatsMatch] = useState<Match | null>(null);
  const [statsDialogOpen, setStatsDialogOpen] = useState(false);
  const [playerStats, setPlayerStats] = useState<PlayerStat[]>([]);
  const [newStat, setNewStat] = useState({ player_id: "", kills: 0, deaths: 0, assists: 0, score: 0, is_mvp: false });
  const [teamMembers, setTeamMembers] = useState<{ id: string; user_id: string; team_id: string; profile?: { username: string } }[]>([]);

  useEffect(() => {
    if (id) fetchAll();
  }, [id]);

  const fetchAll = async () => {
    if (!id) return;
    try {
      const [tournamentRes, regsRes, matchesRes] = await Promise.all([
        supabase.from("tournaments").select("*").eq("id", id).maybeSingle(),
        supabase.from("tournament_registrations").select("*, team:teams(id, name, tag)").eq("tournament_id", id),
        supabase.from("matches").select(`*, team1:teams!matches_team1_id_fkey(id, name, tag), team2:teams!matches_team2_id_fkey(id, name, tag)`).eq("tournament_id", id).order("round").order("match_number"),
      ]);

      if (tournamentRes.error || !tournamentRes.data) {
        navigate("/tournaments");
        return;
      }

      // Check permission
      if (tournamentRes.data.creator_id !== user?.id && !isAdmin()) {
        navigate("/tournaments");
        return;
      }

      setTournament(tournamentRes.data);
      setRegistrations(regsRes.data || []);
      setMatches((matchesRes.data || []) as Match[]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const updateTournamentStatus = async (newStatus: string) => {
    if (!tournament) return;
    const { error } = await supabase
      .from("tournaments")
      .update({ status: newStatus as any })
      .eq("id", tournament.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Status Updated", description: `Tournament is now ${newStatus.replace(/_/g, " ")}` });
      setTournament({ ...tournament, status: newStatus });
    }
  };

  const generateKnockoutBracket = async () => {
    if (!tournament || registrations.length < 2) {
      toast({ title: "Error", description: "Need at least 2 teams", variant: "destructive" });
      return;
    }
    setGenerating(true);
    try {
      // Delete existing matches
      await supabase.from("matches").delete().eq("tournament_id", tournament.id);

      const teams = [...registrations].sort(() => Math.random() - 0.5);
      const numTeams = teams.length;
      const totalRounds = Math.ceil(Math.log2(numTeams));
      const bracketSize = Math.pow(2, totalRounds);

      const allMatches: { tournament_id: string; round: number; match_number: number; team1_id: string | null; team2_id: string | null; status: string }[] = [];

      // Round 1
      for (let i = 0; i < bracketSize / 2; i++) {
        const t1 = teams[i * 2] || null;
        const t2 = teams[i * 2 + 1] || null;
        allMatches.push({
          tournament_id: tournament.id,
          round: 1,
          match_number: i + 1,
          team1_id: t1?.team_id || null,
          team2_id: t2?.team_id || null,
          status: t1 && t2 ? "pending" : "bye",
        });
      }

      // Later rounds (empty)
      for (let round = 2; round <= totalRounds; round++) {
        const matchesInRound = bracketSize / Math.pow(2, round);
        for (let i = 0; i < matchesInRound; i++) {
          allMatches.push({
            tournament_id: tournament.id,
            round,
            match_number: i + 1,
            team1_id: null,
            team2_id: null,
            status: "pending",
          });
        }
      }

      const { error } = await supabase.from("matches").insert(allMatches);
      if (error) throw error;

      // Handle byes: auto-advance teams with byes
      const round1 = allMatches.filter(m => m.round === 1);
      for (const match of round1) {
        if (match.status === "bye") {
          const winnerId = match.team1_id || match.team2_id;
          if (winnerId) {
            // Find the match in DB
            const { data: dbMatch } = await supabase
              .from("matches")
              .select("id")
              .eq("tournament_id", tournament.id)
              .eq("round", 1)
              .eq("match_number", match.match_number)
              .maybeSingle();
            if (dbMatch) {
              await supabase.from("matches").update({ winner_id: winnerId, status: "completed" }).eq("id", dbMatch.id);
              await advanceWinner(tournament.id, 1, match.match_number, winnerId);
            }
          }
        }
      }

      toast({ title: "Bracket Generated", description: `${allMatches.length} matches created` });
      fetchAll();
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Failed to generate bracket", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const generateLeagueBracket = async () => {
    if (!tournament || registrations.length < 2) {
      toast({ title: "Error", description: "Need at least 2 teams", variant: "destructive" });
      return;
    }
    setGenerating(true);
    try {
      await supabase.from("matches").delete().eq("tournament_id", tournament.id);

      const teams = registrations.map(r => r.team_id);
      const allMatches: { tournament_id: string; round: number; match_number: number; team1_id: string; team2_id: string; status: string }[] = [];
      let matchNum = 1;
      let round = 1;

      // Round robin: each team plays every other team
      for (let i = 0; i < teams.length; i++) {
        for (let j = i + 1; j < teams.length; j++) {
          allMatches.push({
            tournament_id: tournament.id,
            round,
            match_number: matchNum++,
            team1_id: teams[i],
            team2_id: teams[j],
            status: "pending",
          });
          if (matchNum > teams.length) {
            round++;
            matchNum = 1;
          }
        }
      }

      const { error } = await supabase.from("matches").insert(allMatches);
      if (error) throw error;

      toast({ title: "League Schedule Generated", description: `${allMatches.length} matches created` });
      fetchAll();
    } catch (err) {
      toast({ title: "Error", description: "Failed to generate schedule", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const advanceWinner = async (tournamentId: string, round: number, matchNumber: number, winnerTeamId: string) => {
    const nextRound = round + 1;
    const nextMatchNumber = Math.ceil(matchNumber / 2);
    const isTeam1 = matchNumber % 2 !== 0;

    const { data: nextMatch } = await supabase
      .from("matches")
      .select("id")
      .eq("tournament_id", tournamentId)
      .eq("round", nextRound)
      .eq("match_number", nextMatchNumber)
      .maybeSingle();

    if (nextMatch) {
      const update = isTeam1 ? { team1_id: winnerTeamId } : { team2_id: winnerTeamId };
      await supabase.from("matches").update(update).eq("id", nextMatch.id);
    }
  };

  const handleUpdateResult = async () => {
    if (!editingMatch || !winnerId) {
      toast({ title: "Error", description: "Select a winner", variant: "destructive" });
      return;
    }

    try {
      const { error } = await supabase
        .from("matches")
        .update({
          team1_score: parseInt(team1Score),
          team2_score: parseInt(team2Score),
          winner_id: winnerId,
          status: "completed",
          completed_at: new Date().toISOString(),
        })
        .eq("id", editingMatch.id);

      if (error) throw error;

      // Advance winner in knockout
      if (tournament?.bracket_type === "single_elimination" || tournament?.bracket_type === "double_elimination") {
        await advanceWinner(tournament.id, editingMatch.round, editingMatch.match_number, winnerId);
      }

      toast({ title: "Result Updated" });
      setEditingMatch(null);
      fetchAll();
    } catch (err) {
      toast({ title: "Error", description: "Failed to update result", variant: "destructive" });
    }
  };

  const openStatsDialog = async (match: Match) => {
    setStatsMatch(match);
    setStatsDialogOpen(true);

    // Fetch existing stats
    const { data: stats } = await supabase
      .from("player_match_stats")
      .select("*")
      .eq("match_id", match.id);
    setPlayerStats((stats || []) as PlayerStat[]);

    // Fetch team members for both teams
    const teamIds = [match.team1_id, match.team2_id].filter(Boolean);
    if (teamIds.length > 0) {
      const { data: members } = await supabase
        .from("team_members")
        .select("id, user_id, team_id")
        .in("team_id", teamIds as string[]);
      
      // Fetch profiles for members
      if (members && members.length > 0) {
        const userIds = members.map(m => m.user_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, username")
          .in("id", userIds);
        
        const enriched = members.map(m => ({
          ...m,
          profile: profiles?.find(p => p.id === m.user_id),
        }));
        setTeamMembers(enriched);
      }
    }
  };

  const handleAddPlayerStat = async () => {
    if (!statsMatch || !newStat.player_id) return;

    const member = teamMembers.find(m => m.user_id === newStat.player_id);
    if (!member) return;

    try {
      const { error } = await supabase.from("player_match_stats").insert({
        match_id: statsMatch.id,
        player_id: newStat.player_id,
        team_id: member.team_id,
        kills: newStat.kills,
        deaths: newStat.deaths,
        assists: newStat.assists,
        score: newStat.score,
        is_mvp: newStat.is_mvp,
      });

      if (error) throw error;
      toast({ title: "Stats Added" });
      setNewStat({ player_id: "", kills: 0, deaths: 0, assists: 0, score: 0, is_mvp: false });
      openStatsDialog(statsMatch);
    } catch (err) {
      toast({ title: "Error", description: "Failed to add stats", variant: "destructive" });
    }
  };

  const getStatusActions = () => {
    if (!tournament) return null;
    const s = tournament.status;

    const transitions: Record<string, { label: string; next: string; icon: React.ReactNode; color: string; confirm?: string; warning?: string }[]> = {
      draft: [{ label: "Open Registration", next: "registration_open", icon: <Play size={14} />, color: "bg-green-600 hover:bg-green-700", confirm: "This will make the tournament publicly visible and open for team registrations." }],
      registration_open: [{ label: "Close Registration", next: "registration_closed", icon: <XCircle size={14} />, color: "bg-yellow-600 hover:bg-yellow-700", confirm: "No more teams will be able to register after this." }],
      registration_closed: [
        { label: "Start Check-In", next: "check_in", icon: <CheckCircle size={14} />, color: "bg-blue-600 hover:bg-blue-700", confirm: "Teams will be prompted to check in." },
        { label: "Start Tournament", next: "in_progress", icon: <Swords size={14} />, color: "bg-crimson hover:bg-primary", confirm: "The tournament will go live. Make sure matches are generated first.", warning: matches.length === 0 ? "No matches generated yet! Generate a bracket before starting." : undefined },
      ],
      check_in: [{ label: "Start Tournament", next: "in_progress", icon: <Swords size={14} />, color: "bg-crimson hover:bg-primary", confirm: "The tournament will begin. This cannot be undone.", warning: matches.length === 0 ? "No matches generated yet! Generate a bracket before starting." : undefined }],
      in_progress: [{ label: "Complete Tournament", next: "completed", icon: <Trophy size={14} />, color: "bg-green-600 hover:bg-green-700", confirm: "This will finalize all results and make the tournament read-only.", warning: pendingMatches.length > 0 ? `${pendingMatches.length} match(es) still pending!` : undefined }],
    };

    return transitions[s] || [];
  };

  const pendingMatches = matches.filter(m => m.status !== "completed" && m.status !== "bye" && m.team1_id && m.team2_id);
  const completedMatches = matches.filter(m => m.status === "completed");

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Target className="w-12 h-12 text-crimson animate-pulse" />
      </div>
    );
  }

  if (!tournament) return null;

  const statusActions = getStatusActions();
  const isKnockout = tournament.bracket_type === "single_elimination" || tournament.bracket_type === "double_elimination";
  const isLeague = tournament.bracket_type === "round_robin" || tournament.bracket_type === "swiss";

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-6">
          <button onClick={() => navigate(`/tournaments/${tournament.id}`)} className="flex items-center gap-2 text-muted-foreground hover:text-white transition-colors mb-8">
            <ArrowLeft size={16} />
            <span className="text-sm">Back to Tournament</span>
          </button>

          <ScrollReveal>
            <div className="space-y-6 mb-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="font-heading text-3xl md:text-4xl text-foreground">{tournament.name}</h1>
                  <p className="text-muted-foreground">Tournament Management</p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  {statusActions && statusActions.map(action => (
                    <AlertDialog key={action.next}>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" className={action.color}>
                          {action.icon}
                          <span className="ml-1">{action.label}</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-card border-border">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="font-heading text-foreground">{action.label}?</AlertDialogTitle>
                          <AlertDialogDescription className="space-y-2">
                            <span>{action.confirm || `Change status to "${action.next.replace(/_/g, " ")}".`}</span>
                            {action.warning && (
                              <span className="flex items-center gap-2 text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 p-2 rounded-sm mt-2">
                                <AlertTriangle className="w-4 h-4 shrink-0" />
                                {action.warning}
                              </span>
                            )}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="border-border">Cancel</AlertDialogCancel>
                          <AlertDialogAction className="bg-crimson hover:bg-primary" onClick={() => updateTournamentStatus(action.next)}>
                            Confirm
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  ))}
                </div>
              </div>

              {/* Status Stepper */}
              <div className="bg-card/50 border border-border p-4">
                <TournamentStatusStepper currentStatus={tournament.status} />
              </div>
            </div>
          </ScrollReveal>

          <Tabs defaultValue="matches" className="space-y-6">
            <TabsList className="bg-card border border-border p-1">
              <TabsTrigger value="matches" className="data-[state=active]:bg-crimson data-[state=active]:text-white">
                <Swords className="w-4 h-4 mr-1" /> Matches
              </TabsTrigger>
              <TabsTrigger value="bracket" className="data-[state=active]:bg-crimson data-[state=active]:text-white">
                <Trophy className="w-4 h-4 mr-1" /> Bracket
              </TabsTrigger>
              <TabsTrigger value="teams" className="data-[state=active]:bg-crimson data-[state=active]:text-white">
                <Users className="w-4 h-4 mr-1" /> Teams ({registrations.length})
              </TabsTrigger>
              <TabsTrigger value="settings" className="data-[state=active]:bg-crimson data-[state=active]:text-white">
                <Settings className="w-4 h-4 mr-1" /> Settings
              </TabsTrigger>
            </TabsList>

            {/* Matches Tab */}
            <TabsContent value="matches" className="space-y-6">
              {/* Generate Matches */}
              {matches.length === 0 && registrations.length >= 2 && (
                <div className="bg-card/50 border border-border p-8 text-center">
                  <Swords className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">No matches yet. Generate the schedule.</p>
                  <div className="flex gap-4 justify-center">
                    {isKnockout && (
                      <Button onClick={generateKnockoutBracket} disabled={generating} className="bg-crimson hover:bg-primary">
                        {generating ? "Generating..." : "Generate Knockout Bracket"}
                      </Button>
                    )}
                    {isLeague && (
                      <Button onClick={generateLeagueBracket} disabled={generating} className="bg-crimson hover:bg-primary">
                        {generating ? "Generating..." : "Generate Round Robin Schedule"}
                      </Button>
                    )}
                    {!isKnockout && !isLeague && (
                      <>
                        <Button onClick={generateKnockoutBracket} disabled={generating} className="bg-crimson hover:bg-primary">
                          Knockout Bracket
                        </Button>
                        <Button onClick={generateLeagueBracket} disabled={generating} variant="outline">
                          Round Robin
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Pending Matches */}
              {pendingMatches.length > 0 && (
                <div>
                  <h3 className="font-heading text-lg text-white mb-4">PENDING MATCHES ({pendingMatches.length})</h3>
                  <div className="space-y-3">
                    {pendingMatches.map(match => (
                      <div key={match.id} className="bg-card/50 border border-border p-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <span className="text-xs text-muted-foreground">R{match.round} M{match.match_number}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-white font-heading">
                              {match.team1?.tag ? `[${match.team1.tag}] ` : ""}{match.team1?.name || "TBD"}
                            </span>
                            <span className="text-crimson font-heading">VS</span>
                            <span className="text-white font-heading">
                              {match.team2?.tag ? `[${match.team2.tag}] ` : ""}{match.team2?.name || "TBD"}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => openStatsDialog(match)}>
                            <BarChart3 className="w-4 h-4 mr-1" /> Stats
                          </Button>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                className="bg-crimson hover:bg-primary"
                                onClick={() => {
                                  setEditingMatch(match);
                                  setTeam1Score(String(match.team1_score || 0));
                                  setTeam2Score(String(match.team2_score || 0));
                                  setWinnerId("");
                                }}
                              >
                                Update Result
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-card border-border">
                              <DialogHeader>
                                <DialogTitle className="font-heading text-white">Update Match Result</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-sm text-muted-foreground">{match.team1?.name || "Team 1"} Score</label>
                                    <Input type="number" value={team1Score} onChange={e => setTeam1Score(e.target.value)} className="bg-background border-border mt-1" />
                                  </div>
                                  <div>
                                    <label className="text-sm text-muted-foreground">{match.team2?.name || "Team 2"} Score</label>
                                    <Input type="number" value={team2Score} onChange={e => setTeam2Score(e.target.value)} className="bg-background border-border mt-1" />
                                  </div>
                                </div>
                                <div>
                                  <label className="text-sm text-muted-foreground">Winner</label>
                                  <Select value={winnerId} onValueChange={setWinnerId}>
                                    <SelectTrigger className="bg-background border-border mt-1">
                                      <SelectValue placeholder="Select winner" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {match.team1_id && <SelectItem value={match.team1_id}>{match.team1?.name || "Team 1"}</SelectItem>}
                                      {match.team2_id && <SelectItem value={match.team2_id}>{match.team2?.name || "Team 2"}</SelectItem>}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <Button onClick={handleUpdateResult} className="w-full bg-crimson hover:bg-primary">
                                  Save Result
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Completed Matches */}
              {completedMatches.length > 0 && (
                <div>
                  <h3 className="font-heading text-lg text-white mb-4">COMPLETED ({completedMatches.length})</h3>
                  <div className="space-y-3">
                    {completedMatches.map(match => (
                      <div key={match.id} className="bg-card/50 border border-green-500/20 p-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <span className="text-xs text-muted-foreground">R{match.round} M{match.match_number}</span>
                          <div className="flex items-center gap-2">
                            <span className={`font-heading ${match.winner_id === match.team1_id ? "text-green-400" : "text-muted-foreground"}`}>
                              {match.team1?.tag ? `[${match.team1.tag}] ` : ""}{match.team1?.name || "TBD"}
                            </span>
                            <span className="text-crimson font-heading">{match.team1_score} - {match.team2_score}</span>
                            <span className={`font-heading ${match.winner_id === match.team2_id ? "text-green-400" : "text-muted-foreground"}`}>
                              {match.team2?.tag ? `[${match.team2.tag}] ` : ""}{match.team2?.name || "TBD"}
                            </span>
                          </div>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => openStatsDialog(match)}>
                          <BarChart3 className="w-4 h-4 mr-1" /> Stats
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Bracket Tab */}
            <TabsContent value="bracket">
              {matches.length > 0 ? (
                <TournamentBracket tournamentId={tournament.id} bracketType={tournament.bracket_type || undefined} />
              ) : (
                <div className="bg-card/30 border border-border p-12 text-center">
                  <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Generate matches first to see the bracket</p>
                </div>
              )}
            </TabsContent>

            {/* Teams Tab */}
            <TabsContent value="teams" className="space-y-4">
              {registrations.length === 0 ? (
                <div className="bg-card/30 border border-border p-12 text-center">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No teams registered yet</p>
                </div>
              ) : (
                registrations.map((reg, i) => (
                  <div key={reg.id} className="bg-card/50 border border-border p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="text-muted-foreground font-mono w-8">#{i + 1}</span>
                      <span className="text-white font-heading">
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
                ))
              )}
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings">
              <div className="bg-card/50 border border-border p-6 space-y-4">
                <h3 className="font-heading text-lg text-white">Tournament Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-muted-foreground">Game Mode:</span> <span className="text-white ml-2">{tournament.game_mode || "N/A"}</span></div>
                  <div><span className="text-muted-foreground">Team Size:</span> <span className="text-white ml-2">{tournament.team_size}v{tournament.team_size}</span></div>
                  <div><span className="text-muted-foreground">Bracket:</span> <span className="text-white ml-2 capitalize">{tournament.bracket_type?.replace(/_/g, " ") || "N/A"}</span></div>
                  <div><span className="text-muted-foreground">Format:</span> <span className="text-white ml-2 uppercase">{tournament.match_format || "BO1"}</span></div>
                  <div><span className="text-muted-foreground">Max Teams:</span> <span className="text-white ml-2">{tournament.max_teams || "Unlimited"}</span></div>
                  <div><span className="text-muted-foreground">Entry Fee:</span> <span className="text-white ml-2">{tournament.entry_fee || 0} credits</span></div>
                  <div><span className="text-muted-foreground">Prize Pool:</span> <span className="text-white ml-2">{tournament.prize_pool || "None"}</span></div>
                  <div><span className="text-muted-foreground">Start:</span> <span className="text-white ml-2">{tournament.start_time ? new Date(tournament.start_time).toLocaleString() : "TBD"}</span></div>
                </div>

                {tournament.status !== "completed" && (
                  <div className="pt-4 border-t border-border">
                    <Button
                      variant="destructive"
                      onClick={() => updateTournamentStatus("cancelled")}
                    >
                      Cancel Tournament
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Player Stats Dialog */}
      <Dialog open={statsDialogOpen} onOpenChange={setStatsDialogOpen}>
        <DialogContent className="bg-card border-border max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-heading text-white">
              Player Statistics — {statsMatch?.team1?.name} vs {statsMatch?.team2?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {playerStats.length > 0 && (
              <div className="space-y-2">
                {playerStats.map(stat => (
                  <div key={stat.id} className="bg-background/50 p-3 flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      {stat.is_mvp && <Star className="w-4 h-4 text-yellow-400" />}
                      <span className="text-white">{(stat as any).profile?.username || stat.player_id.slice(0, 8)}</span>
                    </div>
                    <div className="flex gap-4 text-muted-foreground">
                      <span>K: <span className="text-green-400">{stat.kills}</span></span>
                      <span>D: <span className="text-red-400">{stat.deaths}</span></span>
                      <span>A: <span className="text-blue-400">{stat.assists}</span></span>
                      <span>Score: <span className="text-white">{stat.score}</span></span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add new stat */}
            <div className="border-t border-border pt-4">
              <h4 className="font-heading text-sm text-white mb-3">Add Player Stats</h4>
              <div className="grid grid-cols-2 gap-3">
                <Select value={newStat.player_id} onValueChange={v => setNewStat({ ...newStat, player_id: v })}>
                  <SelectTrigger className="bg-background border-border col-span-2">
                    <SelectValue placeholder="Select player" />
                  </SelectTrigger>
                  <SelectContent>
                    {teamMembers.map(m => (
                      <SelectItem key={m.user_id} value={m.user_id}>
                        {m.profile?.username || m.user_id.slice(0, 8)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div>
                  <label className="text-xs text-muted-foreground">Kills</label>
                  <Input type="number" value={newStat.kills} onChange={e => setNewStat({ ...newStat, kills: parseInt(e.target.value) || 0 })} className="bg-background border-border" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Deaths</label>
                  <Input type="number" value={newStat.deaths} onChange={e => setNewStat({ ...newStat, deaths: parseInt(e.target.value) || 0 })} className="bg-background border-border" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Assists</label>
                  <Input type="number" value={newStat.assists} onChange={e => setNewStat({ ...newStat, assists: parseInt(e.target.value) || 0 })} className="bg-background border-border" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Score</label>
                  <Input type="number" value={newStat.score} onChange={e => setNewStat({ ...newStat, score: parseInt(e.target.value) || 0 })} className="bg-background border-border" />
                </div>
                <label className="col-span-2 flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                  <input type="checkbox" checked={newStat.is_mvp} onChange={e => setNewStat({ ...newStat, is_mvp: e.target.checked })} className="accent-crimson" />
                  MVP of this match
                </label>
              </div>
              <Button onClick={handleAddPlayerStat} className="w-full mt-3 bg-crimson hover:bg-primary" disabled={!newStat.player_id}>
                Add Stats
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
