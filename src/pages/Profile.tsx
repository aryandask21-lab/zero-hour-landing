import { useState, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { 
  User, Trophy, Target, TrendingUp, Calendar, MapPin, 
  Gamepad2, Edit, Shield, Users, Medal, ChartLine, Save, X, Camera, Swords
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { format, formatDistanceToNow } from 'date-fns';
import type { Profile as ProfileType, RatingHistory, Team } from '@/types/esports';

interface MatchRecord {
  id: string;
  tournament_id: string;
  round: number;
  team1_score: number;
  team2_score: number;
  winner_id: string | null;
  completed_at: string | null;
  status: string;
  team1: { id: string; name: string; tag: string | null } | null;
  team2: { id: string; name: string; tag: string | null } | null;
  tournament: { name: string } | null;
}

export default function Profile() {
  const { id } = useParams<{ id: string }>();
  const { user, profile: currentUserProfile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<ProfileType | null>(null);
  const [ratingHistory, setRatingHistory] = useState<RatingHistory[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [matchHistory, setMatchHistory] = useState<MatchRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ bio: '', region: '', preferred_game: '' });
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const profileId = id || user?.id;

  useEffect(() => {
    if (!profileId) return;

    const fetchProfile = async () => {
      setLoading(true);

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profileId)
        .maybeSingle();

      if (profileData) {
        setProfile(profileData as ProfileType);
        setIsOwnProfile(user?.id === profileData.id);
        setEditForm({
          bio: profileData.bio || '',
          region: profileData.region || '',
          preferred_game: profileData.preferred_game || '',
        });
      }

      const { data: ratingData } = await supabase
        .from('rating_history')
        .select('*')
        .eq('user_id', profileId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (ratingData) {
        setRatingHistory(ratingData as RatingHistory[]);
      }

      const { data: teamMemberships } = await supabase
        .from('team_members')
        .select('team_id, role, teams:team_id(*)')
        .eq('user_id', profileId);

      if (teamMemberships) {
        const userTeams = teamMemberships
          .map(tm => tm.teams as unknown as Team)
          .filter(Boolean);
        setTeams(userTeams);
      }

      // Fetch match history
      const teamIds = (teamMemberships || []).map(tm => (tm.teams as unknown as Team)?.id).filter(Boolean);
      if (teamIds.length > 0) {
        const { data: matches } = await supabase
          .from('matches')
          .select('*, team1:teams!matches_team1_id_fkey(id, name, tag), team2:teams!matches_team2_id_fkey(id, name, tag), tournament:tournaments!matches_tournament_id_fkey(name)')
          .or(teamIds.map(tid => `team1_id.eq.${tid},team2_id.eq.${tid}`).join(','))
          .eq('status', 'completed')
          .order('completed_at', { ascending: false })
          .limit(20);

        setMatchHistory((matches || []) as MatchRecord[]);
      }

      setLoading(false);
    };

    fetchProfile();
  }, [profileId, user?.id]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setAvatarUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setProfile(prev => prev ? { ...prev, avatar_url: publicUrl } : null);
      await refreshProfile();
      toast({ title: "Avatar updated!" });
    } catch (err) {
      toast({ title: "Upload failed", description: "Please try again.", variant: "destructive" });
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          bio: editForm.bio || null,
          region: editForm.region || null,
          preferred_game: editForm.preferred_game || null,
        })
        .eq('id', user.id);

      if (error) throw error;

      setProfile(prev => prev ? { ...prev, ...editForm } : null);
      setIsEditing(false);
      await refreshProfile();
      toast({ title: "Profile updated!" });
    } catch {
      toast({ title: "Error", description: "Failed to update profile", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (!profileId) return <Navigate to="/auth" replace />;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Target className="w-12 h-12 text-crimson animate-pulse" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Profile not found</div>
      </div>
    );
  }

  const winRate = profile.total_matches > 0 
    ? Math.round((profile.wins / profile.total_matches) * 100) 
    : 0;

  const getRankTier = (elo: number) => {
    if (elo >= 2000) return { name: 'Champion', color: 'text-yellow-400', bg: 'bg-yellow-400/20' };
    if (elo >= 1700) return { name: 'Diamond', color: 'text-blue-400', bg: 'bg-blue-400/20' };
    if (elo >= 1400) return { name: 'Platinum', color: 'text-cyan-400', bg: 'bg-cyan-400/20' };
    if (elo >= 1100) return { name: 'Gold', color: 'text-amber-400', bg: 'bg-amber-400/20' };
    if (elo >= 800) return { name: 'Silver', color: 'text-gray-400', bg: 'bg-gray-400/20' };
    return { name: 'Bronze', color: 'text-orange-400', bg: 'bg-orange-400/20' };
  };

  const rank = getRankTier(profile.elo_rating);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-6 py-24">
        {/* Profile Header */}
        <div className="relative bg-gradient-to-r from-crimson/20 via-transparent to-transparent rounded-lg p-8 mb-8 border border-border">
          <div className="flex flex-col lg:flex-row gap-8 items-center lg:items-start">
            <div className="relative">
              <Avatar className="h-32 w-32 border-4 border-crimson">
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback className="font-heading text-4xl bg-crimson/20">
                  {profile.username[0]}
                </AvatarFallback>
              </Avatar>
              {isOwnProfile && (
                <label className="absolute bottom-0 right-0 w-9 h-9 bg-crimson rounded-full flex items-center justify-center cursor-pointer hover:bg-crimson/80 transition-colors">
                  <Camera className="w-4 h-4 text-white" />
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={avatarUploading} />
                </label>
              )}
            </div>
            
            <div className="flex-1 text-center lg:text-left">
              <div className="flex items-center justify-center lg:justify-start gap-3 mb-2">
                <h1 className="font-heading text-4xl text-white">{profile.username}</h1>
                <Badge className={`${rank.bg} ${rank.color} border-0`}>
                  <Shield className="h-3 w-3 mr-1" /> {rank.name}
                </Badge>
              </div>
              
              {isEditing ? (
                <div className="space-y-3 max-w-md mt-4">
                  <div>
                    <label className="text-xs text-muted-foreground uppercase mb-1 block">Bio</label>
                    <Input value={editForm.bio} onChange={e => setEditForm(f => ({ ...f, bio: e.target.value }))}
                      placeholder="Tell us about yourself..." className="bg-card/50 border-border" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground uppercase mb-1 block">Region</label>
                    <Select value={editForm.region} onValueChange={v => setEditForm(f => ({ ...f, region: v }))}>
                      <SelectTrigger className="bg-card/50 border-border"><SelectValue placeholder="Select region" /></SelectTrigger>
                      <SelectContent>
                        {['NA', 'EU', 'ASIA', 'SA', 'OCE', 'MENA', 'CIS'].map(r => (
                          <SelectItem key={r} value={r}>{r}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground uppercase mb-1 block">Preferred Game</label>
                    <Select value={editForm.preferred_game} onValueChange={v => setEditForm(f => ({ ...f, preferred_game: v }))}>
                      <SelectTrigger className="bg-card/50 border-border"><SelectValue placeholder="Select game" /></SelectTrigger>
                      <SelectContent>
                        {['Counter-Strike 2', 'Valorant', 'Rainbow Six', 'Overwatch 2', 'Apex Legends'].map(g => (
                          <SelectItem key={g} value={g}>{g}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSaveProfile} disabled={saving} className="bg-crimson hover:bg-crimson/90 gap-2">
                      <Save className="w-4 h-4" /> Save
                    </Button>
                    <Button variant="outline" onClick={() => setIsEditing(false)} className="gap-2">
                      <X className="w-4 h-4" /> Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  {profile.bio && <p className="text-muted-foreground mb-4 max-w-2xl">{profile.bio}</p>}
                  <div className="flex flex-wrap gap-4 justify-center lg:justify-start text-sm text-muted-foreground">
                    {profile.region && (
                      <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {profile.region}</span>
                    )}
                    {profile.preferred_game && (
                      <span className="flex items-center gap-1"><Gamepad2 className="h-4 w-4" /> {profile.preferred_game}</span>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" /> Joined {format(new Date(profile.created_at), 'MMM yyyy')}
                    </span>
                  </div>
                </>
              )}
            </div>

            {isOwnProfile && !isEditing && (
              <Button variant="outline" className="gap-2 border-crimson/50" onClick={() => setIsEditing(true)}>
                <Edit className="h-4 w-4" /> Edit Profile
              </Button>
            )}
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-8 pt-8 border-t border-border">
            <div className="text-center">
              <p className="font-heading text-3xl text-crimson">{profile.elo_rating}</p>
              <p className="text-sm text-muted-foreground">ELO Rating</p>
            </div>
            <div className="text-center">
              <p className="font-heading text-3xl text-white">{profile.total_matches}</p>
              <p className="text-sm text-muted-foreground">Matches</p>
            </div>
            <div className="text-center">
              <p className="font-heading text-3xl text-green-400">{profile.wins}</p>
              <p className="text-sm text-muted-foreground">Wins</p>
            </div>
            <div className="text-center">
              <p className="font-heading text-3xl text-red-400">{profile.losses}</p>
              <p className="text-sm text-muted-foreground">Losses</p>
            </div>
            <div className="text-center">
              <p className="font-heading text-3xl text-yellow-400">{winRate}%</p>
              <p className="text-sm text-muted-foreground">Win Rate</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full max-w-lg grid-cols-4 mb-8">
            <TabsTrigger value="overview" className="gap-2">
              <ChartLine className="h-4 w-4" /> Overview
            </TabsTrigger>
            <TabsTrigger value="teams" className="gap-2">
              <Users className="h-4 w-4" /> Teams
            </TabsTrigger>
            <TabsTrigger value="matches" className="gap-2">
              <Swords className="h-4 w-4" /> Matches
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <Trophy className="h-4 w-4" /> Rating
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-card/50 border-border">
                <CardHeader>
                  <CardTitle className="font-heading flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-crimson" /> Rating Progress
                  </CardTitle>
                  <CardDescription>Your competitive journey</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Next Rank: {getRankTier(profile.elo_rating + 300).name}</span>
                        <span className="text-sm text-crimson">{profile.elo_rating} / {Math.ceil(profile.elo_rating / 300) * 300}</span>
                      </div>
                      <Progress value={(profile.elo_rating % 300) / 3} className="h-2" />
                    </div>
                    
                    <div className="pt-4 border-t border-border">
                      <p className="text-sm text-muted-foreground mb-4">Recent Rating Changes</p>
                      {ratingHistory.length === 0 ? (
                        <p className="text-muted-foreground text-center py-4">No rating history yet</p>
                      ) : (
                        <div className="space-y-2">
                          {ratingHistory.slice(0, 5).map((entry) => (
                            <div key={entry.id} className="flex justify-between items-center">
                              <span className="text-sm text-muted-foreground capitalize">
                                {entry.reason?.replace('_', ' ') || 'Match'}
                              </span>
                              <span className={`font-mono ${entry.rating_change > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {entry.rating_change > 0 ? '+' : ''}{entry.rating_change}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-border">
                <CardHeader>
                  <CardTitle className="font-heading flex items-center gap-2">
                    <Target className="h-5 w-5 text-crimson" /> Performance
                  </CardTitle>
                  <CardDescription>Your competitive statistics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Win Rate</span>
                        <span className="text-sm text-white">{winRate}%</span>
                      </div>
                      <Progress value={winRate} className="h-2" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-secondary/20 p-4 rounded-lg text-center">
                        <Medal className="h-6 w-6 text-yellow-400 mx-auto mb-2" />
                        <p className="font-heading text-2xl text-white">{profile.wins}</p>
                        <p className="text-xs text-muted-foreground">Victories</p>
                      </div>
                      <div className="bg-secondary/20 p-4 rounded-lg text-center">
                        <Trophy className="h-6 w-6 text-crimson mx-auto mb-2" />
                        <p className="font-heading text-2xl text-white">{teams.length}</p>
                        <p className="text-xs text-muted-foreground">Teams</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="teams">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {teams.length === 0 ? (
                <Card className="bg-card/50 border-border col-span-full">
                  <CardContent className="py-12 text-center">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No teams yet</p>
                    {isOwnProfile && (
                      <Button asChild className="mt-4 bg-crimson hover:bg-crimson/90">
                        <a href="/teams/create">Create a Team</a>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                teams.map((team) => (
                  <Card key={team.id} className="bg-card/50 border-border hover:border-crimson/50 transition-colors">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16 border border-border">
                          <AvatarImage src={team.logo_url || undefined} />
                          <AvatarFallback className="font-heading bg-crimson/20">
                            {team.tag || team.name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-heading text-lg text-white">{team.name}</h3>
                          {team.tag && <Badge variant="outline" className="mt-1">[{team.tag}]</Badge>}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="matches">
            <Card className="bg-card/50 border-border">
              <CardHeader>
                <CardTitle className="font-heading flex items-center gap-2">
                  <Swords className="h-5 w-5 text-crimson" /> Match History
                </CardTitle>
                <CardDescription>Recent competitive matches</CardDescription>
              </CardHeader>
              <CardContent>
                {matchHistory.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No match history yet. Compete in tournaments to see results here.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {matchHistory.map(match => {
                      const userTeamIds = teams.map(t => t.id);
                      const isWinner = match.winner_id && userTeamIds.includes(match.winner_id);
                      return (
                        <div key={match.id} className="flex items-center justify-between bg-background/50 p-4 border border-border">
                          <div className="flex items-center gap-3">
                            <div className={`w-1.5 h-10 rounded-full ${isWinner ? 'bg-green-500' : 'bg-red-500'}`} />
                            <div>
                              <div className="flex items-center gap-2 text-sm">
                                <span className="text-white font-heading">
                                  {match.team1?.tag ? `[${match.team1.tag}]` : ''} {match.team1?.name || 'TBD'}
                                </span>
                                <span className="text-crimson font-heading">
                                  {match.team1_score} - {match.team2_score}
                                </span>
                                <span className="text-white font-heading">
                                  {match.team2?.tag ? `[${match.team2.tag}]` : ''} {match.team2?.name || 'TBD'}
                                </span>
                              </div>
                              <p className="text-muted-foreground text-xs mt-1">
                                {match.tournament?.name} • Round {match.round}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge className={isWinner ? 'bg-green-500/20 text-green-400 border-0' : 'bg-red-500/20 text-red-400 border-0'}>
                              {isWinner ? 'WIN' : 'LOSS'}
                            </Badge>
                            {match.completed_at && (
                              <p className="text-muted-foreground text-[10px] mt-1">
                                {formatDistanceToNow(new Date(match.completed_at), { addSuffix: true })}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card className="bg-card/50 border-border">
              <CardHeader>
                <CardTitle className="font-heading">Rating History</CardTitle>
                <CardDescription>All rating changes over time</CardDescription>
              </CardHeader>
              <CardContent>
                {ratingHistory.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No rating changes recorded yet.</p>
                ) : (
                  <div className="space-y-2">
                    {ratingHistory.map((entry) => (
                      <div key={entry.id} className="flex justify-between items-center bg-background/50 p-3 border border-border">
                        <div>
                          <span className="text-sm text-white capitalize">{entry.reason?.replace('_', ' ') || 'Match'}</span>
                          <p className="text-muted-foreground text-xs">
                            {entry.old_rating} → {entry.new_rating}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={`font-mono font-bold ${entry.rating_change > 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {entry.rating_change > 0 ? '+' : ''}{entry.rating_change}
                          </span>
                          {entry.created_at && (
                            <p className="text-muted-foreground text-[10px]">
                              {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
}
