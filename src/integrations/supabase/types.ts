export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      bans: {
        Row: {
          appeal_reason: string | null
          appealed: boolean | null
          ban_type: Database["public"]["Enums"]["ban_type"]
          banned_by: string
          created_at: string | null
          ends_at: string | null
          evidence_url: string | null
          id: string
          is_active: boolean | null
          reason: string
          starts_at: string | null
          team_id: string | null
          user_id: string | null
        }
        Insert: {
          appeal_reason?: string | null
          appealed?: boolean | null
          ban_type: Database["public"]["Enums"]["ban_type"]
          banned_by: string
          created_at?: string | null
          ends_at?: string | null
          evidence_url?: string | null
          id?: string
          is_active?: boolean | null
          reason: string
          starts_at?: string | null
          team_id?: string | null
          user_id?: string | null
        }
        Update: {
          appeal_reason?: string | null
          appealed?: boolean | null
          ban_type?: Database["public"]["Enums"]["ban_type"]
          banned_by?: string
          created_at?: string | null
          ends_at?: string | null
          evidence_url?: string | null
          id?: string
          is_active?: boolean | null
          reason?: string
          starts_at?: string | null
          team_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bans_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      forfeits: {
        Row: {
          confirmed: boolean | null
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string | null
          forfeiting_team_id: string
          id: string
          match_id: string
          reason: string
          reported_by: string
        }
        Insert: {
          confirmed?: boolean | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string | null
          forfeiting_team_id: string
          id?: string
          match_id: string
          reason: string
          reported_by: string
        }
        Update: {
          confirmed?: boolean | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string | null
          forfeiting_team_id?: string
          id?: string
          match_id?: string
          reason?: string
          reported_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "forfeits_forfeiting_team_id_fkey"
            columns: ["forfeiting_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forfeits_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: true
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      leaderboards: {
        Row: {
          game: string
          id: string
          losses: number | null
          points: number | null
          rank: number | null
          season: string | null
          tournaments_played: number | null
          tournaments_won: number | null
          updated_at: string | null
          user_id: string
          wins: number | null
        }
        Insert: {
          game: string
          id?: string
          losses?: number | null
          points?: number | null
          rank?: number | null
          season?: string | null
          tournaments_played?: number | null
          tournaments_won?: number | null
          updated_at?: string | null
          user_id: string
          wins?: number | null
        }
        Update: {
          game?: string
          id?: string
          losses?: number | null
          points?: number | null
          rank?: number | null
          season?: string | null
          tournaments_played?: number | null
          tournaments_won?: number | null
          updated_at?: string | null
          user_id?: string
          wins?: number | null
        }
        Relationships: []
      }
      map_pool: {
        Row: {
          created_at: string | null
          game: string
          id: string
          is_active: boolean | null
          map_image_url: string | null
          map_name: string
        }
        Insert: {
          created_at?: string | null
          game: string
          id?: string
          is_active?: boolean | null
          map_image_url?: string | null
          map_name: string
        }
        Update: {
          created_at?: string | null
          game?: string
          id?: string
          is_active?: boolean | null
          map_image_url?: string | null
          map_name?: string
        }
        Relationships: []
      }
      match_assets: {
        Row: {
          asset_type: string
          created_at: string | null
          description: string | null
          file_url: string
          id: string
          match_id: string
          uploaded_by: string
          verified: boolean | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          asset_type: string
          created_at?: string | null
          description?: string | null
          file_url: string
          id?: string
          match_id: string
          uploaded_by: string
          verified?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          asset_type?: string
          created_at?: string | null
          description?: string | null
          file_url?: string
          id?: string
          match_id?: string
          uploaded_by?: string
          verified?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "match_assets_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      match_disputes: {
        Row: {
          created_at: string
          disputing_team_id: string
          evidence_url: string | null
          id: string
          match_id: string
          reason: string
          resolution: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string | null
        }
        Insert: {
          created_at?: string
          disputing_team_id: string
          evidence_url?: string | null
          id?: string
          match_id: string
          reason: string
          resolution?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string
          disputing_team_id?: string
          evidence_url?: string | null
          id?: string
          match_id?: string
          reason?: string
          resolution?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "match_disputes_disputing_team_id_fkey"
            columns: ["disputing_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_disputes_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_disputes_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      match_maps: {
        Row: {
          banned_by: string | null
          created_at: string | null
          id: string
          is_decider: boolean | null
          map_id: string
          map_order: number
          match_id: string
          picked_by: string | null
          status: string | null
          team1_score: number | null
          team1_side: string | null
          team2_score: number | null
          winner_id: string | null
        }
        Insert: {
          banned_by?: string | null
          created_at?: string | null
          id?: string
          is_decider?: boolean | null
          map_id: string
          map_order: number
          match_id: string
          picked_by?: string | null
          status?: string | null
          team1_score?: number | null
          team1_side?: string | null
          team2_score?: number | null
          winner_id?: string | null
        }
        Update: {
          banned_by?: string | null
          created_at?: string | null
          id?: string
          is_decider?: boolean | null
          map_id?: string
          map_order?: number
          match_id?: string
          picked_by?: string | null
          status?: string | null
          team1_score?: number | null
          team1_side?: string | null
          team2_score?: number | null
          winner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "match_maps_banned_by_fkey"
            columns: ["banned_by"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_maps_map_id_fkey"
            columns: ["map_id"]
            isOneToOne: false
            referencedRelation: "map_pool"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_maps_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_maps_picked_by_fkey"
            columns: ["picked_by"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_maps_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          match_number: number
          notes: string | null
          round: number
          scheduled_time: string | null
          status: string | null
          team1_id: string | null
          team1_score: number | null
          team2_id: string | null
          team2_score: number | null
          tournament_id: string
          updated_at: string
          winner_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          match_number: number
          notes?: string | null
          round: number
          scheduled_time?: string | null
          status?: string | null
          team1_id?: string | null
          team1_score?: number | null
          team2_id?: string | null
          team2_score?: number | null
          tournament_id: string
          updated_at?: string
          winner_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          match_number?: number
          notes?: string | null
          round?: number
          scheduled_time?: string | null
          status?: string | null
          team1_id?: string | null
          team1_score?: number | null
          team2_id?: string | null
          team2_score?: number | null
          tournament_id?: string
          updated_at?: string
          winner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "matches_team1_id_fkey"
            columns: ["team1_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_team2_id_fkey"
            columns: ["team2_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      moderation_logs: {
        Row: {
          action_type: string
          admin_id: string
          created_at: string | null
          details: Json | null
          id: string
          target_id: string
          target_type: string
        }
        Insert: {
          action_type: string
          admin_id: string
          created_at?: string | null
          details?: Json | null
          id?: string
          target_id: string
          target_type: string
        }
        Update: {
          action_type?: string
          admin_id?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          target_id?: string
          target_type?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          link: string | null
          message: string
          read: boolean | null
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          link?: string | null
          message: string
          read?: boolean | null
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          link?: string | null
          message?: string
          read?: boolean | null
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      player_match_stats: {
        Row: {
          assists: number
          created_at: string
          deaths: number
          id: string
          is_mvp: boolean
          kills: number
          match_id: string
          player_id: string
          score: number
          team_id: string
        }
        Insert: {
          assists?: number
          created_at?: string
          deaths?: number
          id?: string
          is_mvp?: boolean
          kills?: number
          match_id: string
          player_id: string
          score?: number
          team_id: string
        }
        Update: {
          assists?: number
          created_at?: string
          deaths?: number
          id?: string
          is_mvp?: boolean
          kills?: number
          match_id?: string
          player_id?: string
          score?: number
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_match_stats_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_match_stats_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      prize_distributions: {
        Row: {
          created_at: string | null
          distributed: boolean | null
          distributed_at: string | null
          id: string
          placement: number
          prize_amount: number
          team_id: string
          tournament_id: string
        }
        Insert: {
          created_at?: string | null
          distributed?: boolean | null
          distributed_at?: string | null
          id?: string
          placement: number
          prize_amount: number
          team_id: string
          tournament_id: string
        }
        Update: {
          created_at?: string | null
          distributed?: boolean | null
          distributed_at?: string | null
          id?: string
          placement?: number
          prize_amount?: number
          team_id?: string
          tournament_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prize_distributions_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prize_distributions_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          elo_rating: number | null
          gaming_stats: Json | null
          glicko_rating: number | null
          glicko_rd: number | null
          id: string
          losses: number | null
          preferred_game: string | null
          region: string | null
          total_matches: number | null
          updated_at: string
          username: string
          wins: number | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          elo_rating?: number | null
          gaming_stats?: Json | null
          glicko_rating?: number | null
          glicko_rd?: number | null
          id: string
          losses?: number | null
          preferred_game?: string | null
          region?: string | null
          total_matches?: number | null
          updated_at?: string
          username: string
          wins?: number | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          elo_rating?: number | null
          gaming_stats?: Json | null
          glicko_rating?: number | null
          glicko_rd?: number | null
          id?: string
          losses?: number | null
          preferred_game?: string | null
          region?: string | null
          total_matches?: number | null
          updated_at?: string
          username?: string
          wins?: number | null
        }
        Relationships: []
      }
      rating_history: {
        Row: {
          created_at: string | null
          id: string
          match_id: string | null
          new_rating: number
          old_rating: number
          rating_change: number
          reason: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          match_id?: string | null
          new_rating: number
          old_rating: number
          rating_change: number
          reason?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          match_id?: string | null
          new_rating?: number
          old_rating?: number
          rating_change?: number
          reason?: string | null
          user_id?: string
        }
        Relationships: []
      }
      team_invites: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          invited_by: string
          invited_user_id: string
          message: string | null
          responded_at: string | null
          status: string | null
          team_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          invited_by: string
          invited_user_id: string
          message?: string | null
          responded_at?: string | null
          status?: string | null
          team_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          invited_by?: string
          invited_user_id?: string
          message?: string | null
          responded_at?: string | null
          status?: string | null
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_invites_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          id: string
          invited_by: string | null
          joined_at: string
          role: string
          team_id: string
          user_id: string
        }
        Insert: {
          id?: string
          invited_by?: string | null
          joined_at?: string
          role?: string
          team_id: string
          user_id: string
        }
        Update: {
          id?: string
          invited_by?: string | null
          joined_at?: string
          role?: string
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          description: string | null
          id: string
          logo_url: string | null
          max_members: number
          name: string
          owner_id: string
          tag: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          max_members?: number
          name: string
          owner_id: string
          tag?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          max_members?: number
          name?: string
          owner_id?: string
          tag?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teams_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_escrow: {
        Row: {
          created_at: string | null
          distributed: boolean | null
          distributed_at: string | null
          distributed_by: string | null
          id: string
          total_pool: number | null
          tournament_id: string
        }
        Insert: {
          created_at?: string | null
          distributed?: boolean | null
          distributed_at?: string | null
          distributed_by?: string | null
          id?: string
          total_pool?: number | null
          tournament_id: string
        }
        Update: {
          created_at?: string | null
          distributed?: boolean | null
          distributed_at?: string | null
          distributed_by?: string | null
          id?: string
          total_pool?: number | null
          tournament_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_escrow_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: true
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_map_pool: {
        Row: {
          id: string
          map_id: string
          tournament_id: string
        }
        Insert: {
          id?: string
          map_id: string
          tournament_id: string
        }
        Update: {
          id?: string
          map_id?: string
          tournament_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_map_pool_map_id_fkey"
            columns: ["map_id"]
            isOneToOne: false
            referencedRelation: "map_pool"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_map_pool_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_registrations: {
        Row: {
          approval_status: string
          check_in_status: string | null
          checked_in_at: string | null
          id: string
          registered_at: string
          registered_by: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          seed: number | null
          team_id: string
          tournament_id: string
        }
        Insert: {
          approval_status?: string
          check_in_status?: string | null
          checked_in_at?: string | null
          id?: string
          registered_at?: string
          registered_by: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          seed?: number | null
          team_id: string
          tournament_id: string
        }
        Update: {
          approval_status?: string
          check_in_status?: string | null
          checked_in_at?: string | null
          id?: string
          registered_at?: string
          registered_by?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          seed?: number | null
          team_id?: string
          tournament_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_registrations_registered_by_fkey"
            columns: ["registered_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_registrations_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_registrations_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournaments: {
        Row: {
          bracket_type: string | null
          check_in_end: string | null
          check_in_start: string | null
          created_at: string
          creator_id: string
          description: string | null
          end_time: string | null
          entry_fee: number | null
          featured: boolean | null
          game_mode: string | null
          id: string
          livestream_url: string | null
          map_veto_enabled: boolean | null
          match_format: string | null
          max_teams: number | null
          name: string
          organizer_rating: number | null
          prize_pool: string | null
          prize_pool_credits: number | null
          registration_deadline: string | null
          rules: string | null
          seeding_type: string | null
          start_time: string | null
          status: Database["public"]["Enums"]["tournament_status"]
          team_size: number
          updated_at: string
        }
        Insert: {
          bracket_type?: string | null
          check_in_end?: string | null
          check_in_start?: string | null
          created_at?: string
          creator_id: string
          description?: string | null
          end_time?: string | null
          entry_fee?: number | null
          featured?: boolean | null
          game_mode?: string | null
          id?: string
          livestream_url?: string | null
          map_veto_enabled?: boolean | null
          match_format?: string | null
          max_teams?: number | null
          name: string
          organizer_rating?: number | null
          prize_pool?: string | null
          prize_pool_credits?: number | null
          registration_deadline?: string | null
          rules?: string | null
          seeding_type?: string | null
          start_time?: string | null
          status?: Database["public"]["Enums"]["tournament_status"]
          team_size?: number
          updated_at?: string
        }
        Update: {
          bracket_type?: string | null
          check_in_end?: string | null
          check_in_start?: string | null
          created_at?: string
          creator_id?: string
          description?: string | null
          end_time?: string | null
          entry_fee?: number | null
          featured?: boolean | null
          game_mode?: string | null
          id?: string
          livestream_url?: string | null
          map_veto_enabled?: boolean | null
          match_format?: string | null
          max_teams?: number | null
          name?: string
          organizer_rating?: number | null
          prize_pool?: string | null
          prize_pool_credits?: number | null
          registration_deadline?: string | null
          rules?: string | null
          seeding_type?: string | null
          start_time?: string | null
          status?: Database["public"]["Enums"]["tournament_status"]
          team_size?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournaments_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          balance_after: number
          created_at: string | null
          description: string | null
          id: string
          reference_id: string | null
          reference_type: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string | null
          description?: string | null
          id?: string
          reference_id?: string | null
          reference_type?: string | null
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string | null
          description?: string | null
          id?: string
          reference_id?: string | null
          reference_type?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          granted_at: string | null
          granted_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wallets: {
        Row: {
          balance: number | null
          created_at: string | null
          frozen_balance: number | null
          id: string
          lifetime_earnings: number | null
          lifetime_spent: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          balance?: number | null
          created_at?: string | null
          frozen_balance?: number | null
          id?: string
          lifetime_earnings?: number | null
          lifetime_spent?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          balance?: number | null
          created_at?: string | null
          frozen_balance?: number | null
          id?: string
          lifetime_earnings?: number | null
          lifetime_spent?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_dispute_match: { Args: { match_uuid: string }; Returns: boolean }
      has_profile: { Args: { user_uuid?: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id?: string }; Returns: boolean }
      is_organizer_or_admin: { Args: { _user_id?: string }; Returns: boolean }
      is_registered_for_tournament: {
        Args: { tournament_uuid: string }
        Returns: boolean
      }
      is_team_member: { Args: { team_uuid: string }; Returns: boolean }
      is_team_owner: { Args: { team_uuid: string }; Returns: boolean }
      is_tournament_creator: {
        Args: { tournament_uuid: string }
        Returns: boolean
      }
      is_user_banned: { Args: { _user_id?: string }; Returns: boolean }
      update_elo_ratings: {
        Args: {
          k_factor?: number
          loser_id: string
          p_match_id: string
          winner_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "player" | "team_leader" | "organizer" | "admin"
      ban_type: "temporary" | "permanent" | "competition" | "chat"
      tournament_status:
        | "draft"
        | "registration_open"
        | "registration_closed"
        | "check_in"
        | "in_progress"
        | "completed"
        | "cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["player", "team_leader", "organizer", "admin"],
      ban_type: ["temporary", "permanent", "competition", "chat"],
      tournament_status: [
        "draft",
        "registration_open",
        "registration_closed",
        "check_in",
        "in_progress",
        "completed",
        "cancelled",
      ],
    },
  },
} as const
