import { useState, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { 
  User, Trophy, Target, TrendingUp, Calendar, MapPin, 
  Gamepad2, Edit, Shield, Users, Medal, ChartLine
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { format } from 'date-fns';
import type { Profile as ProfileType, RatingHistory, Team } from '@/types/esports';

export default function Profile() {
  const { id } = useParams<{ id: string }>();
  const { user, profile: currentUserProfile } = useAuth();
  const [profile, setProfile] = useState<ProfileType | null>(null);
  const [ratingHistory, setRatingHistory] = useState<RatingHistory[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  const profileId = id || user?.id;

  useEffect(() => {
    if (!profileId) return;

    const fetchProfile = async () => {
      setLoading(true);

      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profileId)
        .maybeSingle();

      if (profileData) {
        setProfile(profileData as ProfileType);
        setIsOwnProfile(user?.id === profileData.id);
      }

      // Fetch rating history
      const { data: ratingData } = await supabase
        .from('rating_history')
        .select('*')
        .eq('user_id', profileId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (ratingData) {
        setRatingHistory(ratingData as RatingHistory[]);
      }

      // Fetch teams
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

      setLoading(false);
    };

    fetchProfile();
  }, [profileId, user?.id]);

  if (!profileId) {
    return <Navigate to="/auth" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading profile...</div>
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
            <Avatar className="h-32 w-32 border-4 border-crimson">
              <AvatarImage src={profile.avatar_url || undefined} />
              <AvatarFallback className="font-heading text-4xl bg-crimson/20">
                {profile.username[0]}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 text-center lg:text-left">
              <div className="flex items-center justify-center lg:justify-start gap-3 mb-2">
                <h1 className="font-heading text-4xl text-white">{profile.username}</h1>
                <Badge className={`${rank.bg} ${rank.color} border-0`}>
                  <Shield className="h-3 w-3 mr-1" /> {rank.name}
                </Badge>
              </div>
              
              {profile.bio && (
                <p className="text-muted-foreground mb-4 max-w-2xl">{profile.bio}</p>
              )}
              
              <div className="flex flex-wrap gap-4 justify-center lg:justify-start text-sm text-muted-foreground">
                {profile.region && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" /> {profile.region}
                  </span>
                )}
                {profile.preferred_game && (
                  <span className="flex items-center gap-1">
                    <Gamepad2 className="h-4 w-4" /> {profile.preferred_game}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" /> Joined {format(new Date(profile.created_at), 'MMM yyyy')}
                </span>
              </div>
            </div>

            {isOwnProfile && (
              <Button variant="outline" className="gap-2 border-crimson/50">
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
          <TabsList className="grid w-full max-w-md grid-cols-3 mb-8">
            <TabsTrigger value="overview" className="gap-2">
              <ChartLine className="h-4 w-4" /> Overview
            </TabsTrigger>
            <TabsTrigger value="teams" className="gap-2">
              <Users className="h-4 w-4" /> Teams
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <Trophy className="h-4 w-4" /> History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Rating Progress */}
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
                              <span className={`font-mono ${
                                entry.rating_change > 0 ? 'text-green-400' : 'text-red-400'
                              }`}>
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

              {/* Performance Stats */}
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
                        <p className="font-heading text-2xl text-white">0</p>
                        <p className="text-xs text-muted-foreground">Tournaments Won</p>
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
                      <Button className="mt-4 bg-crimson hover:bg-crimson/90">
                        Create a Team
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
                          {team.tag && (
                            <Badge variant="outline" className="mt-1">[{team.tag}]</Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="history">
            <Card className="bg-card/50 border-border">
              <CardHeader>
                <CardTitle className="font-heading">Match History</CardTitle>
                <CardDescription>Your recent competitive matches</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-center text-muted-foreground py-8">
                  Match history will appear here after you compete in tournaments.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
}
