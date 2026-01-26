import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { 
  UserPlus, 
  Shield, 
  Check, 
  X, 
  Clock, 
  Mail, 
  Search,
  Users
} from "lucide-react";

interface TeamInvite {
  id: string;
  team_id: string;
  invited_user_id: string;
  invited_by: string;
  status: string;
  message: string | null;
  created_at: string;
  expires_at: string;
  team?: { id: string; name: string; tag: string | null; logo_url: string | null };
  inviter?: { username: string };
}

interface UserProfile {
  id: string;
  username: string;
  avatar_url: string | null;
  elo_rating: number | null;
}

interface PendingInvitesProps {
  className?: string;
}

// Component for viewing and responding to pending invites
export function PendingInvites({ className }: PendingInvitesProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [invites, setInvites] = useState<TeamInvite[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchInvites();
      subscribeToInvites();
    }
  }, [user]);

  const fetchInvites = async () => {
    if (!user) return;

    const { data } = await supabase
      .from("team_invites")
      .select(`
        *,
        team:teams(id, name, tag, logo_url)
      `)
      .eq("invited_user_id", user.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    // Enrich with inviter data
    const enrichedInvites: TeamInvite[] = [];
    if (data) {
      for (const invite of data) {
        const { data: inviterData } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", invite.invited_by)
          .maybeSingle();
        
        enrichedInvites.push({
          ...invite,
          inviter: inviterData || undefined,
        } as TeamInvite);
      }
    }

    setInvites(enrichedInvites);
    setIsLoading(false);
  };

  const subscribeToInvites = () => {
    if (!user) return;

    const channel = supabase
      .channel(`team_invites_${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "team_invites",
          filter: `invited_user_id=eq.${user.id}`,
        },
        () => {
          fetchInvites();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleResponse = async (inviteId: string, accept: boolean) => {
    if (!user) return;

    try {
      const invite = invites.find(i => i.id === inviteId);
      if (!invite) return;

      // Update invite status
      const { error: updateError } = await supabase
        .from("team_invites")
        .update({
          status: accept ? "accepted" : "declined",
          responded_at: new Date().toISOString()
        })
        .eq("id", inviteId);

      if (updateError) throw updateError;

      // If accepted, add to team members
      if (accept) {
        const { error: memberError } = await supabase
          .from("team_members")
          .insert({
            team_id: invite.team_id,
            user_id: user.id,
            role: "member",
            invited_by: invite.invited_by
          });

        if (memberError) throw memberError;
      }

      toast({
        title: accept ? "Joined Team!" : "Invite Declined",
        description: accept 
          ? `You are now a member of ${invite.team?.name}` 
          : "The invite has been declined"
      });

      fetchInvites();
    } catch (error) {
      console.error("Error responding to invite:", error);
      toast({
        title: "Error",
        description: "Failed to respond to invite",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return <div className="animate-pulse text-muted-foreground">Loading invites...</div>;
  }

  if (invites.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      <h3 className="font-heading text-lg text-white mb-4 flex items-center gap-2">
        <Mail className="w-5 h-5 text-crimson" />
        TEAM INVITES ({invites.length})
      </h3>

      <div className="space-y-3">
        <AnimatePresence>
          {invites.map((invite) => (
            <motion.div
              key={invite.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100 }}
              className="bg-card/50 border border-crimson/30 p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-crimson/20 flex items-center justify-center">
                    {invite.team?.logo_url ? (
                      <img src={invite.team.logo_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Shield className="w-6 h-6 text-crimson" />
                    )}
                  </div>
                  <div>
                    <p className="font-heading text-white">
                      {invite.team?.tag && <span className="text-crimson">[{invite.team.tag}] </span>}
                      {invite.team?.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Invited by <span className="text-crimson">{invite.inviter?.username}</span>
                    </p>
                    {invite.message && (
                      <p className="text-sm text-muted-foreground mt-1 italic">
                        "{invite.message}"
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-right mr-4">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      Expires {new Date(invite.expires_at).toLocaleDateString()}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleResponse(invite.id, true)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleResponse(invite.id, false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

interface InvitePlayerDialogProps {
  teamId: string;
  teamName: string;
  onInviteSent?: () => void;
}

// Component for team owners to invite players
export function InvitePlayerDialog({ teamId, teamName, onInviteSent }: InvitePlayerDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [message, setMessage] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isInviting, setIsInviting] = useState<string | null>(null);
  const [existingMembers, setExistingMembers] = useState<string[]>([]);
  const [existingInvites, setExistingInvites] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      fetchExistingData();
    }
  }, [isOpen, teamId]);

  const fetchExistingData = async () => {
    // Get current team members
    const { data: members } = await supabase
      .from("team_members")
      .select("user_id")
      .eq("team_id", teamId);

    // Get pending invites
    const { data: invites } = await supabase
      .from("team_invites")
      .select("invited_user_id")
      .eq("team_id", teamId)
      .eq("status", "pending");

    setExistingMembers((members || []).map(m => m.user_id));
    setExistingInvites((invites || []).map(i => i.invited_user_id));
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    const { data } = await supabase
      .from("profiles")
      .select("id, username, avatar_url, elo_rating")
      .ilike("username", `%${searchQuery}%`)
      .neq("id", user?.id || "")
      .limit(10);

    setSearchResults(data || []);
    setIsSearching(false);
  };

  const handleInvite = async (playerId: string) => {
    if (!user) return;

    setIsInviting(playerId);
    try {
      const { error } = await supabase.from("team_invites").insert({
        team_id: teamId,
        invited_user_id: playerId,
        invited_by: user.id,
        message: message || null
      });

      if (error) throw error;

      toast({
        title: "Invite Sent!",
        description: "The player has been invited to join your team"
      });

      setExistingInvites([...existingInvites, playerId]);
      onInviteSent?.();
    } catch (error) {
      console.error("Error sending invite:", error);
      toast({
        title: "Error",
        description: "Failed to send invite",
        variant: "destructive"
      });
    } finally {
      setIsInviting(null);
    }
  };

  const canInvite = (playerId: string) => {
    return !existingMembers.includes(playerId) && !existingInvites.includes(playerId);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="btn-primary-tactical">
          <UserPlus className="w-4 h-4 mr-2" />
          INVITE PLAYER
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading text-white">
            Invite Player to {teamName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Search players by username..."
                className="pl-10 bg-background border-border"
              />
            </div>
            <Button onClick={handleSearch} disabled={isSearching}>
              Search
            </Button>
          </div>

          {/* Optional Message */}
          <div>
            <label className="text-sm text-muted-foreground">
              Message (optional)
            </label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add a personal message to your invite..."
              className="mt-1 bg-background border-border"
              rows={2}
            />
          </div>

          {/* Search Results */}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {isSearching ? (
              <div className="text-center py-8 text-muted-foreground">
                Searching...
              </div>
            ) : searchResults.length === 0 && searchQuery ? (
              <div className="text-center py-8 text-muted-foreground">
                No players found
              </div>
            ) : (
              searchResults.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between bg-background/50 p-3 border border-border"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-crimson/20 flex items-center justify-center">
                      {player.avatar_url ? (
                        <img src={player.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Users className="w-5 h-5 text-crimson" />
                      )}
                    </div>
                    <div>
                      <p className="text-white font-medium">{player.username}</p>
                      <p className="text-xs text-muted-foreground">
                        ELO: {player.elo_rating || 1000}
                      </p>
                    </div>
                  </div>

                  {canInvite(player.id) ? (
                    <Button
                      size="sm"
                      onClick={() => handleInvite(player.id)}
                      disabled={isInviting === player.id}
                      className="bg-crimson hover:bg-crimson/80"
                    >
                      {isInviting === player.id ? (
                        "Sending..."
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4 mr-1" />
                          Invite
                        </>
                      )}
                    </Button>
                  ) : existingMembers.includes(player.id) ? (
                    <span className="text-xs text-green-400 uppercase">Member</span>
                  ) : (
                    <span className="text-xs text-yellow-400 uppercase">Invited</span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface TeamInvitesBadgeProps {
  className?: string;
}

// Badge component showing invite count
export function TeamInvitesBadge({ className }: TeamInvitesBadgeProps) {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (user) {
      fetchCount();
      subscribeToChanges();
    }
  }, [user]);

  const fetchCount = async () => {
    if (!user) return;

    const { count: inviteCount } = await supabase
      .from("team_invites")
      .select("*", { count: "exact", head: true })
      .eq("invited_user_id", user.id)
      .eq("status", "pending");

    setCount(inviteCount || 0);
  };

  const subscribeToChanges = () => {
    if (!user) return;

    const channel = supabase
      .channel(`invite_count_${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "team_invites",
          filter: `invited_user_id=eq.${user.id}`,
        },
        () => {
          fetchCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  if (count === 0) return null;

  return (
    <span className={`bg-crimson text-white text-xs font-bold px-2 py-0.5 ${className}`}>
      {count}
    </span>
  );
}
