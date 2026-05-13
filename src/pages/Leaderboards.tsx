import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Trophy, Medal, TrendingUp, Users, Filter, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface LeaderboardEntry {
  id: string;
  user_id: string;
  game: string;
  season: string | null;
  rank: number | null;
  points: number;
  wins: number;
  losses: number;
  tournaments_played: number;
  tournaments_won: number;
  profiles?: {
    username: string;
    avatar_url: string | null;
    elo_rating: number;
    region: string | null;
  };
}

interface TopPlayer {
  id: string;
  username: string;
  avatar_url: string | null;
  elo_rating: number;
  wins: number;
  losses: number;
  total_matches: number;
  region: string | null;
}

interface TeamStanding {
  id: string;
  name: string;
  tag: string | null;
  logo_url: string | null;
  wins: number;
  losses: number;
  points_for: number;
  points_against: number;
}

const games = ['All Games', 'Valorant', 'CS2', 'Rainbow Six', 'Overwatch'];
const regions = ['All Regions', 'NA', 'EU', 'ASIA', 'OCE', 'SA'];

export default function Leaderboards() {
  const [topPlayers, setTopPlayers] = useState<TopPlayer[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [teamStandings, setTeamStandings] = useState<TeamStanding[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGame, setSelectedGame] = useState('All Games');
  const [selectedRegion, setSelectedRegion] = useState('All Regions');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('rating');

  useEffect(() => {
    fetchLeaderboards();
  }, [selectedGame, selectedRegion, activeTab]);

  const fetchLeaderboards = async () => {
    setLoading(true);

    // Fetch top players by ELO
    let query = supabase
      .from('profiles')
      .select('id, username, avatar_url, elo_rating, wins, losses, total_matches, region')
      .order('elo_rating', { ascending: false })
      .limit(100);

    if (selectedRegion !== 'All Regions') {
      query = query.eq('region', selectedRegion);
    }

    const { data: players } = await query;
    if (players) {
      setTopPlayers(players as TopPlayer[]);
    }

    // Game-specific leaderboards derive from profiles for now
    setLeaderboard([]);

    setLoading(false);
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-400" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-300" />;
    if (rank === 3) return <Medal className="h-5 w-5 text-orange-400" />;
    return <span className="text-muted-foreground font-mono">#{rank}</span>;
  };

  const getWinRate = (wins: number, losses: number) => {
    const total = wins + losses;
    if (total === 0) return '0%';
    return `${Math.round((wins / total) * 100)}%`;
  };

  const filteredPlayers = topPlayers.filter(player =>
    player.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-6 py-24">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="text-crimson font-heading text-sm tracking-[0.3em] uppercase">Rankings</span>
          <h1 className="font-heading text-5xl lg:text-6xl text-white mt-4">
            GLOBAL <span className="text-crimson">LEADERBOARDS</span>
          </h1>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
            Compete with the best players worldwide. Climb the ranks and prove your dominance.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-8 justify-center">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search players..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-card border-border"
            />
          </div>
          <Select value={selectedGame} onValueChange={setSelectedGame}>
            <SelectTrigger className="w-40 bg-card border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {games.map(game => (
                <SelectItem key={game} value={game}>{game}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedRegion} onValueChange={setSelectedRegion}>
            <SelectTrigger className="w-40 bg-card border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {regions.map(region => (
                <SelectItem key={region} value={region}>{region}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
            <TabsTrigger value="rating" className="gap-2">
              <TrendingUp className="h-4 w-4" /> ELO Rating
            </TabsTrigger>
            <TabsTrigger value="tournaments" className="gap-2">
              <Trophy className="h-4 w-4" /> Tournaments
            </TabsTrigger>
          </TabsList>

          <TabsContent value="rating">
            {/* Top 3 Podium */}
            {!searchQuery && filteredPlayers.length >= 3 && (
              <div className="grid grid-cols-3 gap-4 mb-12 max-w-3xl mx-auto">
                {[1, 0, 2].map((index) => {
                  const player = filteredPlayers[index];
                  if (!player) return null;
                  const isFirst = index === 0;
                  
                  return (
                    <div
                      key={player.id}
                      className={`relative p-6 text-center ${
                        isFirst ? 'bg-gradient-to-b from-yellow-500/20 to-transparent -mt-8 order-2' : 
                        index === 1 ? 'bg-gradient-to-b from-gray-400/20 to-transparent order-1' :
                        'bg-gradient-to-b from-orange-500/20 to-transparent order-3'
                      } rounded-t-lg border border-border/50`}
                    >
                      <div className={`absolute -top-4 left-1/2 -translate-x-1/2 ${
                        isFirst ? 'text-3xl' : 'text-2xl'
                      }`}>
                        {isFirst ? '👑' : index === 1 ? '🥈' : '🥉'}
                      </div>
                      <Avatar className={`mx-auto mb-4 border-2 ${
                        isFirst ? 'h-24 w-24 border-yellow-400' :
                        index === 1 ? 'h-20 w-20 border-gray-400' :
                        'h-20 w-20 border-orange-400'
                      }`}>
                        <AvatarImage src={player.avatar_url || undefined} />
                        <AvatarFallback className="font-heading text-2xl">
                          {player.username[0]}
                        </AvatarFallback>
                      </Avatar>
                      <h3 className={`font-heading ${isFirst ? 'text-xl' : 'text-lg'} text-white mb-1`}>
                        {player.username}
                      </h3>
                      <p className={`font-mono ${isFirst ? 'text-2xl text-yellow-400' : 'text-xl text-crimson'}`}>
                        {player.elo_rating}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {getWinRate(player.wins, player.losses)} Win Rate
                      </p>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Full Leaderboard Table */}
            <div className="bg-card/50 border border-border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-secondary/50">
                  <tr className="text-left">
                    <th className="px-6 py-4 font-heading text-sm text-muted-foreground">RANK</th>
                    <th className="px-6 py-4 font-heading text-sm text-muted-foreground">PLAYER</th>
                    <th className="px-6 py-4 font-heading text-sm text-muted-foreground text-center">RATING</th>
                    <th className="px-6 py-4 font-heading text-sm text-muted-foreground text-center">W/L</th>
                    <th className="px-6 py-4 font-heading text-sm text-muted-foreground text-center">WIN RATE</th>
                    <th className="px-6 py-4 font-heading text-sm text-muted-foreground text-center">REGION</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                        Loading...
                      </td>
                    </tr>
                  ) : filteredPlayers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                        No players found
                      </td>
                    </tr>
                  ) : (
                    filteredPlayers.map((player, index) => (
                      <tr
                        key={player.id}
                        className="border-t border-border/50 hover:bg-secondary/20 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center w-8">
                            {getRankBadge(index + 1)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 border border-border">
                              <AvatarImage src={player.avatar_url || undefined} />
                              <AvatarFallback className="font-heading">
                                {player.username[0]}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium text-white">{player.username}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="font-mono text-lg text-crimson">{player.elo_rating}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-green-400">{player.wins}</span>
                          <span className="text-muted-foreground">/</span>
                          <span className="text-red-400">{player.losses}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <Badge variant="outline" className="font-mono">
                            {getWinRate(player.wins, player.losses)}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-muted-foreground">{player.region || 'N/A'}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="tournaments">
            <div className="bg-card/50 border border-border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-secondary/50">
                  <tr className="text-left">
                    <th className="px-6 py-4 font-heading text-sm text-muted-foreground">RANK</th>
                    <th className="px-6 py-4 font-heading text-sm text-muted-foreground">PLAYER</th>
                    <th className="px-6 py-4 font-heading text-sm text-muted-foreground text-center">POINTS</th>
                    <th className="px-6 py-4 font-heading text-sm text-muted-foreground text-center">TOURNAMENTS</th>
                    <th className="px-6 py-4 font-heading text-sm text-muted-foreground text-center">WINS</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                        Loading...
                      </td>
                    </tr>
                  ) : leaderboard.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                        No tournament data yet. Compete to get ranked!
                      </td>
                    </tr>
                  ) : (
                    leaderboard.map((entry, index) => (
                      <tr
                        key={entry.id}
                        className="border-t border-border/50 hover:bg-secondary/20 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center w-8">
                            {getRankBadge(index + 1)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 border border-border">
                              <AvatarImage src={entry.profiles?.avatar_url || undefined} />
                              <AvatarFallback className="font-heading">
                                {entry.profiles?.username?.[0] || '?'}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium text-white">
                              {entry.profiles?.username || 'Unknown'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="font-mono text-lg text-yellow-400">{entry.points}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-muted-foreground">{entry.tournaments_played}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <Badge className="bg-crimson/20 text-crimson border-crimson/50">
                            {entry.tournaments_won} 🏆
                          </Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>
      </main>
      
      <Footer />
    </div>
  );
}
