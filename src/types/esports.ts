// Core types for the esports platform

export type AppRole = 'player' | 'team_leader' | 'organizer' | 'admin';
export type BanType = 'temporary' | 'permanent' | 'competition' | 'chat';
export type TournamentStatus = 'draft' | 'registration_open' | 'registration_closed' | 'check_in' | 'in_progress' | 'completed' | 'cancelled';
export type MatchFormat = 'bo1' | 'bo3' | 'bo5';
export type SeedingType = 'random' | 'manual' | 'rating';
export type BracketType = 'single_elimination' | 'double_elimination' | 'round_robin' | 'swiss';

export interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  region: string | null;
  preferred_game: string | null;
  gaming_stats: Record<string, unknown>;
  elo_rating: number;
  glicko_rating: number;
  glicko_rd: number;
  total_matches: number;
  wins: number;
  losses: number;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  granted_by: string | null;
  granted_at: string;
}

export interface Team {
  id: string;
  name: string;
  tag: string | null;
  description: string | null;
  logo_url: string | null;
  owner_id: string;
  max_members: number;
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: string;
  invited_by: string | null;
  joined_at: string;
  profile?: Profile;
}

export interface TeamInvite {
  id: string;
  team_id: string;
  invited_user_id: string;
  invited_by: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  message: string | null;
  created_at: string;
  responded_at: string | null;
  expires_at: string;
  team?: Team;
  inviter?: Profile;
}

export interface Tournament {
  id: string;
  name: string;
  description: string | null;
  creator_id: string;
  status: TournamentStatus;
  team_size: number;
  max_teams: number | null;
  bracket_type: BracketType | null;
  match_format: MatchFormat;
  seeding_type: SeedingType;
  map_veto_enabled: boolean;
  game_mode: string | null;
  prize_pool: string | null;
  prize_pool_credits: number;
  entry_fee: number;
  rules: string | null;
  livestream_url: string | null;
  featured: boolean;
  organizer_rating: number;
  start_time: string | null;
  end_time: string | null;
  registration_deadline: string | null;
  check_in_start: string | null;
  check_in_end: string | null;
  created_at: string;
  updated_at: string;
}

export interface Match {
  id: string;
  tournament_id: string;
  round: number;
  match_number: number;
  team1_id: string | null;
  team2_id: string | null;
  team1_score: number | null;
  team2_score: number | null;
  winner_id: string | null;
  status: string | null;
  scheduled_time: string | null;
  completed_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  team1?: Team;
  team2?: Team;
}

export interface MatchMap {
  id: string;
  match_id: string;
  map_id: string;
  map_order: number;
  picked_by: string | null;
  banned_by: string | null;
  is_decider: boolean;
  team1_side: 'attack' | 'defense' | 'random' | null;
  team1_score: number;
  team2_score: number;
  winner_id: string | null;
  status: 'pending' | 'vetoing' | 'in_progress' | 'completed';
  created_at: string;
  map?: MapPool;
}

export interface MapPool {
  id: string;
  game: string;
  map_name: string;
  map_image_url: string | null;
  is_active: boolean;
  created_at: string;
}

export interface MatchAsset {
  id: string;
  match_id: string;
  uploaded_by: string;
  asset_type: 'screenshot' | 'demo' | 'video' | 'other';
  file_url: string;
  description: string | null;
  verified: boolean;
  verified_by: string | null;
  verified_at: string | null;
  created_at: string;
}

export interface Forfeit {
  id: string;
  match_id: string;
  forfeiting_team_id: string;
  reason: 'no_show' | 'disconnect' | 'forfeit' | 'disqualification';
  reported_by: string;
  confirmed: boolean;
  confirmed_by: string | null;
  confirmed_at: string | null;
  created_at: string;
}

export interface Wallet {
  id: string;
  user_id: string;
  balance: number;
  frozen_balance: number;
  lifetime_earnings: number;
  lifetime_spent: number;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  type: 'deposit' | 'withdrawal' | 'entry_fee' | 'prize' | 'refund' | 'admin_credit' | 'admin_debit';
  amount: number;
  balance_after: number;
  reference_type: string | null;
  reference_id: string | null;
  description: string | null;
  created_at: string;
}

export interface Ban {
  id: string;
  user_id: string | null;
  team_id: string | null;
  ban_type: BanType;
  reason: string;
  evidence_url: string | null;
  banned_by: string;
  starts_at: string;
  ends_at: string | null;
  is_active: boolean;
  appealed: boolean;
  appeal_reason: string | null;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'match_start' | 'check_in' | 'dispute' | 'invite' | 'result' | 'prize' | 'ban' | 'system';
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface Leaderboard {
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
  updated_at: string;
  profile?: Profile;
}

export interface RatingHistory {
  id: string;
  user_id: string;
  old_rating: number;
  new_rating: number;
  rating_change: number;
  match_id: string | null;
  reason: string | null;
  created_at: string;
}
