import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useRoles } from "@/hooks/useRoles";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/ScrollReveal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  Shield, 
  Ban, 
  AlertTriangle, 
  Users, 
  Search, 
  Target,
  Gavel,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Trophy
} from "lucide-react";

interface BanRecord {
  id: string;
  user_id: string | null;
  team_id: string | null;
  ban_type: string;
  reason: string;
  starts_at: string;
  ends_at: string | null;
  is_active: boolean;
  appealed: boolean;
  appeal_reason: string | null;
  profile?: { username: string };
  team?: { name: string };
}

interface Dispute {
  id: string;
  match_id: string;
  disputing_team_id: string;
  reason: string;
  evidence_url: string | null;
  status: string;
  resolution: string | null;
  created_at: string;
  team?: { name: string };
  match?: { 
    round: number;
    match_number: number;
    tournament?: { name: string };
  };
}

interface UserProfile {
  id: string;
  username: string;
  avatar_url: string | null;
  elo_rating: number;
  total_matches: number;
  created_at: string;
}

export default function Admin() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: rolesLoading } = useRoles();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [bans, setBans] = useState<BanRecord[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [tournaments, setTournaments] = useState<{ id: string; name: string; status: string; team_size: number; max_teams: number | null; created_at: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [banDialogOpen, setBanDialogOpen] = useState(false);

  // Ban form state
  const [banTarget, setBanTarget] = useState("");
  const [banType, setBanType] = useState<string>("temporary");
  const [banReason, setBanReason] = useState("");
  const [banDuration, setBanDuration] = useState("7");

  // Dispute resolution state
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [resolution, setResolution] = useState("");

  useEffect(() => {
    if (!authLoading && !rolesLoading) {
      if (!user || !isAdmin()) {
        navigate("/");
        return;
      }
      fetchAdminData();
    }
  }, [user, authLoading, rolesLoading, isAdmin, navigate]);

  const fetchAdminData = async () => {
    try {
      // Fetch bans
      const { data: bansData } = await supabase
        .from("bans")
        .select(`*`)
        .order("created_at", { ascending: false });

      // Enrich bans with profile data
      const enrichedBans: BanRecord[] = [];
      if (bansData) {
        for (const ban of bansData) {
          let profileData = null;
          let teamData = null;
          
          if (ban.user_id) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("username")
              .eq("id", ban.user_id)
              .maybeSingle();
            profileData = profile;
          }
          
          if (ban.team_id) {
            const { data: team } = await supabase
              .from("teams")
              .select("name")
              .eq("id", ban.team_id)
              .maybeSingle();
            teamData = team;
          }
          
          enrichedBans.push({
            ...ban,
            profile: profileData || undefined,
            team: teamData || undefined,
          });
        }
      }

      // Fetch open disputes
      const { data: disputesData } = await supabase
        .from("match_disputes")
        .select(`
          *,
          team:teams!match_disputes_disputing_team_id_fkey(name),
          match:matches!match_disputes_match_id_fkey(
            round,
            match_number,
            tournament:tournaments!matches_tournament_id_fkey(name)
          )
        `)
        .order("created_at", { ascending: false });

      // Fetch users
      const { data: usersData } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      // Fetch all tournaments
      const { data: tournamentsData } = await supabase
        .from("tournaments")
        .select("id, name, status, team_size, max_teams, created_at")
        .order("created_at", { ascending: false });

      setBans(enrichedBans);
      setDisputes(disputesData || []);
      setUsers(usersData || []);
      setTournaments(tournamentsData || []);
    } catch (error) {
      console.error("Error fetching admin data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBanUser = async () => {
    if (!banTarget || !banReason) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      const endsAt = banType === "permanent" 
        ? null 
        : new Date(Date.now() + parseInt(banDuration) * 24 * 60 * 60 * 1000).toISOString();

      const { error } = await supabase.from("bans").insert({
        user_id: banTarget,
        ban_type: banType as "temporary" | "permanent" | "competition" | "chat",
        reason: banReason,
        ends_at: endsAt,
        banned_by: user!.id
      });

      if (error) throw error;

      toast({ title: "Success", description: "User has been banned" });
      setBanDialogOpen(false);
      setBanTarget("");
      setBanReason("");
      fetchAdminData();
    } catch (error) {
      console.error("Error banning user:", error);
      toast({
        title: "Error",
        description: "Failed to ban user",
        variant: "destructive"
      });
    }
  };

  const handleLiftBan = async (banId: string) => {
    try {
      const { error } = await supabase
        .from("bans")
        .update({ is_active: false })
        .eq("id", banId);

      if (error) throw error;

      toast({ title: "Success", description: "Ban has been lifted" });
      fetchAdminData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to lift ban",
        variant: "destructive"
      });
    }
  };

  const handleResolveDispute = async (disputeId: string, outcome: "resolved" | "rejected") => {
    if (!resolution && outcome === "resolved") {
      toast({
        title: "Error",
        description: "Please provide a resolution",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("match_disputes")
        .update({
          status: outcome,
          resolution: resolution || (outcome === "rejected" ? "Dispute rejected by admin" : null),
          resolved_by: user!.id,
          resolved_at: new Date().toISOString()
        })
        .eq("id", disputeId);

      if (error) throw error;

      toast({ title: "Success", description: `Dispute ${outcome}` });
      setSelectedDispute(null);
      setResolution("");
      fetchAdminData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to resolve dispute",
        variant: "destructive"
      });
    }
  };

  const filteredUsers = users.filter(u =>
    u.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (authLoading || rolesLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Target className="w-12 h-12 text-crimson animate-pulse mx-auto mb-4" />
          <p className="text-muted-foreground">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  const activeBans = bans.filter(b => b.is_active);
  const openDisputes = disputes.filter(d => d.status === "open");
  const appealedBans = bans.filter(b => b.appealed && b.is_active);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-6">
          <ScrollReveal>
            <div className="mb-8">
              <h1 className="font-heading text-4xl md:text-5xl text-white mb-2">
                ADMIN COMMAND
              </h1>
              <p className="text-muted-foreground">
                Platform moderation and oversight
              </p>
            </div>
          </ScrollReveal>

          {/* Quick Stats */}
          <ScrollReveal delay={0.1}>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-card/50 border border-border p-4">
                <div className="flex items-center gap-3">
                  <Ban className="w-8 h-8 text-crimson" />
                  <div>
                    <p className="text-2xl font-heading text-white">{activeBans.length}</p>
                    <p className="text-xs text-muted-foreground uppercase">Active Bans</p>
                  </div>
                </div>
              </div>
              <div className="bg-card/50 border border-border p-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-8 h-8 text-yellow-500" />
                  <div>
                    <p className="text-2xl font-heading text-white">{openDisputes.length}</p>
                    <p className="text-xs text-muted-foreground uppercase">Open Disputes</p>
                  </div>
                </div>
              </div>
              <div className="bg-card/50 border border-border p-4">
                <div className="flex items-center gap-3">
                  <Gavel className="w-8 h-8 text-blue-500" />
                  <div>
                    <p className="text-2xl font-heading text-white">{appealedBans.length}</p>
                    <p className="text-xs text-muted-foreground uppercase">Ban Appeals</p>
                  </div>
                </div>
              </div>
              <div className="bg-card/50 border border-border p-4">
                <div className="flex items-center gap-3">
                  <Users className="w-8 h-8 text-green-500" />
                  <div>
                    <p className="text-2xl font-heading text-white">{users.length}</p>
                    <p className="text-xs text-muted-foreground uppercase">Total Users</p>
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>

          {/* Main Content Tabs */}
          <ScrollReveal delay={0.2}>
            <Tabs defaultValue="disputes" className="space-y-6">
              <TabsList className="bg-card border border-border p-1">
                <TabsTrigger value="disputes" className="data-[state=active]:bg-crimson data-[state=active]:text-white">
                  Disputes ({openDisputes.length})
                </TabsTrigger>
                <TabsTrigger value="bans" className="data-[state=active]:bg-crimson data-[state=active]:text-white">
                  Bans
                </TabsTrigger>
                <TabsTrigger value="users" className="data-[state=active]:bg-crimson data-[state=active]:text-white">
                  Users
                </TabsTrigger>
                <TabsTrigger value="tournaments" className="data-[state=active]:bg-crimson data-[state=active]:text-white">
                  Tournaments ({tournaments.length})
                </TabsTrigger>
              </TabsList>

              {/* Disputes Tab */}
              <TabsContent value="disputes" className="space-y-4">
                {openDisputes.length === 0 ? (
                  <div className="bg-card/30 border border-border p-12 text-center">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                    <p className="text-muted-foreground">No open disputes</p>
                  </div>
                ) : (
                  openDisputes.map(dispute => (
                    <div key={dispute.id} className="bg-card/50 border border-border p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className="w-5 h-5 text-yellow-500" />
                            <span className="font-heading text-white">
                              {dispute.match?.tournament?.name || "Unknown Tournament"}
                            </span>
                            <span className="text-muted-foreground text-sm">
                              Round {dispute.match?.round}, Match {dispute.match?.match_number}
                            </span>
                          </div>
                          <p className="text-crimson text-sm mb-2">
                            Disputed by: {dispute.team?.name || "Unknown Team"}
                          </p>
                          <p className="text-muted-foreground text-sm mb-4">
                            {dispute.reason}
                          </p>
                          {dispute.evidence_url && (
                            <a 
                              href={dispute.evidence_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-crimson text-sm hover:underline inline-flex items-center gap-1"
                            >
                              <Eye className="w-4 h-4" />
                              View Evidence
                            </a>
                          )}
                          <p className="text-xs text-muted-foreground mt-2">
                            <Clock className="w-3 h-3 inline mr-1" />
                            {new Date(dispute.created_at).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                size="sm" 
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => setSelectedDispute(dispute)}
                              >
                                Resolve
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-card border-border">
                              <DialogHeader>
                                <DialogTitle className="font-heading text-white">Resolve Dispute</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <label className="text-sm text-muted-foreground">Resolution</label>
                                  <Textarea
                                    value={resolution}
                                    onChange={(e) => setResolution(e.target.value)}
                                    placeholder="Describe the resolution..."
                                    className="mt-1 bg-background border-border"
                                  />
                                </div>
                                <div className="flex gap-2">
                                  <Button 
                                    onClick={() => handleResolveDispute(dispute.id, "resolved")}
                                    className="flex-1 bg-green-600 hover:bg-green-700"
                                  >
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Resolve
                                  </Button>
                                  <Button 
                                    onClick={() => handleResolveDispute(dispute.id, "rejected")}
                                    variant="destructive"
                                    className="flex-1"
                                  >
                                    <XCircle className="w-4 h-4 mr-2" />
                                    Reject
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </TabsContent>

              {/* Bans Tab */}
              <TabsContent value="bans" className="space-y-4">
                <div className="flex justify-end mb-4">
                  <Dialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="btn-primary-tactical">
                        <Ban className="w-4 h-4 mr-2" />
                        ISSUE BAN
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-card border-border">
                      <DialogHeader>
                        <DialogTitle className="font-heading text-white">Issue Ban</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm text-muted-foreground">User ID</label>
                          <Input
                            value={banTarget}
                            onChange={(e) => setBanTarget(e.target.value)}
                            placeholder="Enter user ID..."
                            className="mt-1 bg-background border-border"
                          />
                        </div>
                        <div>
                          <label className="text-sm text-muted-foreground">Ban Type</label>
                          <Select value={banType} onValueChange={setBanType}>
                            <SelectTrigger className="mt-1 bg-background border-border">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-card border-border">
                              <SelectItem value="temporary">Temporary</SelectItem>
                              <SelectItem value="permanent">Permanent</SelectItem>
                              <SelectItem value="competition">Competition Only</SelectItem>
                              <SelectItem value="chat">Chat Only</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {banType !== "permanent" && (
                          <div>
                            <label className="text-sm text-muted-foreground">Duration (days)</label>
                            <Input
                              type="number"
                              value={banDuration}
                              onChange={(e) => setBanDuration(e.target.value)}
                              min="1"
                              className="mt-1 bg-background border-border"
                            />
                          </div>
                        )}
                        <div>
                          <label className="text-sm text-muted-foreground">Reason</label>
                          <Textarea
                            value={banReason}
                            onChange={(e) => setBanReason(e.target.value)}
                            placeholder="Reason for ban..."
                            className="mt-1 bg-background border-border"
                          />
                        </div>
                        <Button 
                          onClick={handleBanUser}
                          className="w-full btn-primary-tactical"
                        >
                          CONFIRM BAN
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {bans.length === 0 ? (
                  <div className="bg-card/30 border border-border p-12 text-center">
                    <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No bans on record</p>
                  </div>
                ) : (
                  bans.map(ban => (
                    <div key={ban.id} className={`bg-card/50 border p-4 ${ban.is_active ? 'border-crimson/50' : 'border-border'}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 flex items-center justify-center ${ban.is_active ? 'bg-crimson/20' : 'bg-muted/20'}`}>
                            <Ban className={`w-5 h-5 ${ban.is_active ? 'text-crimson' : 'text-muted-foreground'}`} />
                          </div>
                          <div>
                            <p className="text-white font-medium">
                              {ban.profile?.username || ban.team?.name || "Unknown"}
                            </p>
                            <p className="text-sm text-muted-foreground">{ban.reason}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`text-xs px-2 py-0.5 uppercase ${
                                ban.ban_type === 'permanent' ? 'bg-crimson/20 text-crimson' :
                                ban.ban_type === 'temporary' ? 'bg-yellow-500/20 text-yellow-400' :
                                'bg-muted text-muted-foreground'
                              }`}>
                                {ban.ban_type}
                              </span>
                              {ban.appealed && (
                                <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5">
                                  APPEALED
                                </span>
                              )}
                              {!ban.is_active && (
                                <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5">
                                  LIFTED
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">
                            {ban.ends_at ? `Expires: ${new Date(ban.ends_at).toLocaleDateString()}` : 'Permanent'}
                          </p>
                          {ban.is_active && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleLiftBan(ban.id)}
                              className="mt-2"
                            >
                              Lift Ban
                            </Button>
                          )}
                        </div>
                      </div>
                      {ban.appealed && ban.appeal_reason && (
                        <div className="mt-3 pt-3 border-t border-border">
                          <p className="text-xs text-muted-foreground uppercase mb-1">Appeal Reason</p>
                          <p className="text-sm text-white">{ban.appeal_reason}</p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </TabsContent>

              {/* Users Tab */}
              <TabsContent value="users" className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 bg-card/50 border-border"
                  />
                </div>

                <div className="bg-card/50 border border-border overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-background/50">
                      <tr>
                        <th className="text-left p-4 text-xs text-muted-foreground uppercase">User</th>
                        <th className="text-left p-4 text-xs text-muted-foreground uppercase">ELO</th>
                        <th className="text-left p-4 text-xs text-muted-foreground uppercase">Matches</th>
                        <th className="text-left p-4 text-xs text-muted-foreground uppercase">Joined</th>
                        <th className="text-right p-4 text-xs text-muted-foreground uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map(u => (
                        <tr key={u.id} className="border-t border-border hover:bg-background/30">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-crimson/20 flex items-center justify-center">
                                {u.avatar_url ? (
                                  <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <Users className="w-4 h-4 text-crimson" />
                                )}
                              </div>
                              <span className="text-white">{u.username}</span>
                            </div>
                          </td>
                          <td className="p-4 text-crimson font-heading">{u.elo_rating || 1000}</td>
                          <td className="p-4 text-muted-foreground">{u.total_matches || 0}</td>
                          <td className="p-4 text-muted-foreground text-sm">
                            {new Date(u.created_at).toLocaleDateString()}
                          </td>
                          <td className="p-4 text-right">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setBanTarget(u.id);
                                setBanDialogOpen(true);
                              }}
                              className="text-crimson hover:text-white hover:bg-crimson/20"
                            >
                              <Ban className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TabsContent>

              {/* Tournaments Tab */}
              <TabsContent value="tournaments" className="space-y-4">
                <div className="flex justify-end mb-4">
                  <Button asChild className="btn-primary-tactical">
                    <Link to="/tournaments/create">
                      <Trophy className="w-4 h-4 mr-2" /> CREATE TOURNAMENT
                    </Link>
                  </Button>
                </div>
                {tournaments.length === 0 ? (
                  <div className="bg-card/30 border border-border p-12 text-center">
                    <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No tournaments yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {tournaments.map(t => (
                      <div key={t.id} className="bg-card/50 border border-border p-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Trophy className="w-5 h-5 text-crimson" />
                          <div>
                            <p className="text-white font-heading">{t.name}</p>
                            <p className="text-muted-foreground text-xs">{t.team_size}v{t.team_size} • {new Date(t.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-xs px-2 py-1 uppercase tracking-wider ${
                            t.status === "registration_open" ? "bg-green-500/20 text-green-400" :
                            t.status === "in_progress" ? "bg-crimson/20 text-crimson" :
                            t.status === "completed" ? "bg-muted text-muted-foreground" :
                            "bg-yellow-500/20 text-yellow-400"
                          }`}>
                            {t.status.replace(/_/g, " ")}
                          </span>
                          <Button asChild size="sm" variant="outline">
                            <Link to={`/tournaments/${t.id}/manage`}>
                              Manage
                            </Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </ScrollReveal>
        </div>
      </main>

      <Footer />
    </div>
  );
}
