import { useParams, useNavigate, Link } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTournamentManagement } from "@/hooks/useTournamentManagement";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/ScrollReveal";
import { TournamentBracket } from "@/components/TournamentBracket";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  ArrowLeft, Trophy, Users, Target, Settings, Play, Pause, CheckCircle, 
  XCircle, Shuffle, Hash, Trash2, RefreshCw, ChevronRight, Crown
} from "lucide-react";

export default function TournamentManage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedMatch, setSelectedMatch] = useState<string | null>(null);
  const [scores, setScores] = useState({ team1: 0, team2: 0 });

  const {
    tournament,
    registrations,
    matches,
    loading,
    updateStatus,
    updateSeed,
    removeRegistration,
    generateBracket,
    updateMatchScore,
    refresh
  } = useTournamentManagement(id || '');

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Target className="w-12 h-12 text-crimson animate-pulse mx-auto mb-4" />
          <p className="text-muted-foreground">Loading tournament...</p>
        </div>
      </div>
    );
  }

  if (!tournament || tournament.creator_id !== user?.id) {
    navigate('/tournaments');
    return null;
  }

  const statusFlow = [
    { value: 'draft', label: 'Draft', icon: Settings },
    { value: 'registration_open', label: 'Registration Open', icon: Users },
    { value: 'registration_closed', label: 'Registration Closed', icon: Pause },
    { value: 'check_in', label: 'Check-in', icon: CheckCircle },
    { value: 'in_progress', label: 'In Progress', icon: Play },
    { value: 'completed', label: 'Completed', icon: Trophy },
  ];

  const currentStatusIndex = statusFlow.findIndex(s => s.value === tournament.status);

  const getMatchById = (matchId: string) => matches.find(m => m.id === matchId);

  const handleScoreSubmit = async () => {
    if (!selectedMatch) return;
    const match = getMatchById(selectedMatch);
    if (!match) return;

    let winnerId: string | null = null;
    if (scores.team1 > scores.team2 && match.team1_id) {
      winnerId = match.team1_id;
    } else if (scores.team2 > scores.team1 && match.team2_id) {
      winnerId = match.team2_id;
    }

    await updateMatchScore(selectedMatch, scores.team1, scores.team2, winnerId);
    setSelectedMatch(null);
    setScores({ team1: 0, team2: 0 });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-6">
          {/* Back Button */}
          <button
            onClick={() => navigate(`/tournaments/${id}`)}
            className="flex items-center gap-2 text-muted-foreground hover:text-white transition-colors mb-6"
          >
            <ArrowLeft size={16} />
            <span className="text-sm">Back to Tournament</span>
          </button>

          {/* Header */}
          <ScrollReveal>
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-crimson/20 flex items-center justify-center">
                  <Settings className="w-8 h-8 text-crimson" />
                </div>
                <div>
                  <h1 className="font-heading text-3xl text-white">
                    MANAGE: {tournament.name}
                  </h1>
                  <p className="text-muted-foreground">
                    {registrations.length} teams registered • {matches.length} matches
                  </p>
                </div>
              </div>
              <Button onClick={refresh} variant="outline" className="btn-outline-tactical">
                <RefreshCw size={16} className="mr-2" />
                REFRESH
              </Button>
            </div>
          </ScrollReveal>

          {/* Status Flow */}
          <ScrollReveal delay={0.1}>
            <div className="bg-card/50 border border-border p-6 mb-8">
              <h3 className="font-heading text-lg text-white mb-4">TOURNAMENT STATUS</h3>
              <div className="flex flex-wrap items-center gap-2">
                {statusFlow.map((status, index) => {
                  const Icon = status.icon;
                  const isActive = status.value === tournament.status;
                  const isPast = index < currentStatusIndex;
                  const isNext = index === currentStatusIndex + 1;
                  
                  return (
                    <div key={status.value} className="flex items-center gap-2">
                      <button
                        onClick={() => isNext && updateStatus(status.value as typeof tournament.status)}
                        disabled={!isNext && !isActive}
                        className={`flex items-center gap-2 px-4 py-2 transition-all ${
                          isActive 
                            ? 'bg-crimson text-white' 
                            : isPast 
                              ? 'bg-green-500/20 text-green-400'
                              : isNext
                                ? 'bg-card border border-crimson/50 text-white hover:bg-crimson/20 cursor-pointer'
                                : 'bg-card/30 text-muted-foreground cursor-not-allowed'
                        }`}
                      >
                        <Icon size={16} />
                        <span className="text-sm font-medium">{status.label}</span>
                      </button>
                      {index < statusFlow.length - 1 && (
                        <ChevronRight size={16} className="text-muted-foreground" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </ScrollReveal>

          {/* Main Content Tabs */}
          <Tabs defaultValue="registrations" className="space-y-6">
            <TabsList className="bg-card/50 border border-border p-1">
              <TabsTrigger value="registrations" className="data-[state=active]:bg-crimson">
                <Users size={16} className="mr-2" />
                Registrations ({registrations.length})
              </TabsTrigger>
              <TabsTrigger value="bracket" className="data-[state=active]:bg-crimson">
                <Trophy size={16} className="mr-2" />
                Bracket
              </TabsTrigger>
              <TabsTrigger value="matches" className="data-[state=active]:bg-crimson">
                <Target size={16} className="mr-2" />
                Matches ({matches.length})
              </TabsTrigger>
            </TabsList>

            {/* Registrations Tab */}
            <TabsContent value="registrations">
              <ScrollReveal>
                <div className="bg-card/50 border border-border">
                  <div className="p-4 border-b border-border flex items-center justify-between">
                    <h3 className="font-heading text-lg text-white">REGISTERED TEAMS</h3>
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => {
                          registrations.forEach((reg, idx) => updateSeed(reg.id, idx + 1));
                        }}
                        variant="outline" 
                        size="sm"
                        className="btn-outline-tactical"
                      >
                        <Hash size={14} className="mr-1" />
                        Auto Seed
                      </Button>
                      <Button 
                        onClick={() => {
                          const shuffled = [...registrations].sort(() => Math.random() - 0.5);
                          shuffled.forEach((reg, idx) => updateSeed(reg.id, idx + 1));
                        }}
                        variant="outline" 
                        size="sm"
                        className="btn-outline-tactical"
                      >
                        <Shuffle size={14} className="mr-1" />
                        Randomize
                      </Button>
                    </div>
                  </div>

                  {registrations.length === 0 ? (
                    <div className="p-12 text-center">
                      <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No teams registered yet</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-border">
                      {registrations.map((reg) => (
                        <div key={reg.id} className="p-4 flex items-center justify-between hover:bg-card/30">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-background flex items-center justify-center">
                              <Input
                                type="number"
                                min="1"
                                value={reg.seed || ''}
                                onChange={(e) => updateSeed(reg.id, parseInt(e.target.value) || 0)}
                                className="w-10 h-10 text-center p-0 bg-transparent border-crimson/50 text-crimson font-heading"
                              />
                            </div>
                            <div>
                              <p className="text-white font-medium">
                                {reg.team.tag && <span className="text-crimson">[{reg.team.tag}] </span>}
                                {reg.team.name}
                              </p>
                              <p className="text-muted-foreground text-sm">
                                Registered {new Date(reg.registered_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className={`text-xs px-2 py-1 ${
                              reg.check_in_status === 'checked_in' 
                                ? 'bg-green-500/20 text-green-400' 
                                : 'bg-muted text-muted-foreground'
                            }`}>
                              {reg.check_in_status || 'pending'}
                            </span>
                            <Button
                              onClick={() => removeRegistration(reg.id)}
                              variant="ghost"
                              size="sm"
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </ScrollReveal>
            </TabsContent>

            {/* Bracket Tab */}
            <TabsContent value="bracket">
              <ScrollReveal>
                <div className="bg-card/50 border border-border">
                  <div className="p-4 border-b border-border flex items-center justify-between">
                    <h3 className="font-heading text-lg text-white">TOURNAMENT BRACKET</h3>
                    <Button 
                      onClick={generateBracket}
                      disabled={registrations.length < 2}
                      className="btn-primary-tactical"
                    >
                      <Shuffle size={16} className="mr-2" />
                      {matches.length > 0 ? 'REGENERATE BRACKET' : 'GENERATE BRACKET'}
                    </Button>
                  </div>

                  {matches.length === 0 ? (
                    <div className="p-12 text-center">
                      <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground mb-4">
                        No bracket generated yet. Add teams and generate the bracket to start.
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {registrations.length} / 2 minimum teams registered
                      </p>
                    </div>
                  ) : (
                    <div className="p-6 overflow-x-auto">
                      <TournamentBracket tournamentId={id || ''} />
                    </div>
                  )}
                </div>
              </ScrollReveal>
            </TabsContent>

            {/* Matches Tab */}
            <TabsContent value="matches">
              <ScrollReveal>
                <div className="bg-card/50 border border-border">
                  <div className="p-4 border-b border-border">
                    <h3 className="font-heading text-lg text-white">ALL MATCHES</h3>
                  </div>

                  {matches.length === 0 ? (
                    <div className="p-12 text-center">
                      <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Generate bracket first to see matches</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-border">
                      {matches.map((match) => (
                        <div key={match.id} className="p-4 hover:bg-card/30">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-6">
                              <div className="text-center">
                                <p className="text-xs text-muted-foreground uppercase">Round</p>
                                <p className="font-heading text-xl text-white">{match.round}</p>
                              </div>
                              
                              <div className="flex items-center gap-4">
                                {/* Team 1 */}
                                <div className={`text-right min-w-[150px] ${match.winner_id === match.team1_id ? 'text-green-400' : 'text-white'}`}>
                                  {match.team1 ? (
                                    <div className="flex items-center justify-end gap-2">
                                      {match.winner_id === match.team1_id && <Crown size={14} className="text-yellow-400" />}
                                      <span>{match.team1.tag && `[${match.team1.tag}] `}{match.team1.name}</span>
                                    </div>
                                  ) : (
                                    <span className="text-muted-foreground">TBD</span>
                                  )}
                                </div>

                                {/* Score */}
                                <div className="flex items-center gap-2 bg-background px-4 py-2">
                                  <span className={`font-heading text-xl ${match.winner_id === match.team1_id ? 'text-green-400' : 'text-white'}`}>
                                    {match.team1_score ?? '-'}
                                  </span>
                                  <span className="text-muted-foreground">:</span>
                                  <span className={`font-heading text-xl ${match.winner_id === match.team2_id ? 'text-green-400' : 'text-white'}`}>
                                    {match.team2_score ?? '-'}
                                  </span>
                                </div>

                                {/* Team 2 */}
                                <div className={`min-w-[150px] ${match.winner_id === match.team2_id ? 'text-green-400' : 'text-white'}`}>
                                  {match.team2 ? (
                                    <div className="flex items-center gap-2">
                                      <span>{match.team2.tag && `[${match.team2.tag}] `}{match.team2.name}</span>
                                      {match.winner_id === match.team2_id && <Crown size={14} className="text-yellow-400" />}
                                    </div>
                                  ) : (
                                    <span className="text-muted-foreground">TBD</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-4">
                              <span className={`text-xs px-2 py-1 uppercase ${
                                match.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                                match.status === 'in_progress' ? 'bg-crimson/20 text-crimson' :
                                'bg-muted text-muted-foreground'
                              }`}>
                                {match.status || 'pending'}
                              </span>

                              {match.team1_id && match.team2_id && (
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button
                                      onClick={() => {
                                        setSelectedMatch(match.id);
                                        setScores({
                                          team1: match.team1_score || 0,
                                          team2: match.team2_score || 0
                                        });
                                      }}
                                      size="sm"
                                      className="btn-outline-tactical"
                                    >
                                      UPDATE SCORE
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="bg-card border-border">
                                    <DialogHeader>
                                      <DialogTitle className="font-heading text-white">
                                        UPDATE MATCH SCORE
                                      </DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-6 py-4">
                                      <div className="flex items-center justify-center gap-6">
                                        <div className="text-center space-y-2">
                                          <p className="text-white font-medium">
                                            {match.team1?.tag && `[${match.team1.tag}] `}{match.team1?.name}
                                          </p>
                                          <Input
                                            type="number"
                                            min="0"
                                            value={scores.team1}
                                            onChange={(e) => setScores(s => ({ ...s, team1: parseInt(e.target.value) || 0 }))}
                                            className="w-20 text-center font-heading text-2xl bg-background border-border"
                                          />
                                        </div>
                                        <span className="text-2xl text-muted-foreground">VS</span>
                                        <div className="text-center space-y-2">
                                          <p className="text-white font-medium">
                                            {match.team2?.tag && `[${match.team2.tag}] `}{match.team2?.name}
                                          </p>
                                          <Input
                                            type="number"
                                            min="0"
                                            value={scores.team2}
                                            onChange={(e) => setScores(s => ({ ...s, team2: parseInt(e.target.value) || 0 }))}
                                            className="w-20 text-center font-heading text-2xl bg-background border-border"
                                          />
                                        </div>
                                      </div>
                                      <div className="flex gap-2">
                                        <Button
                                          onClick={handleScoreSubmit}
                                          className="flex-1 btn-primary-tactical"
                                        >
                                          SAVE & ADVANCE WINNER
                                        </Button>
                                      </div>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </ScrollReveal>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
}
