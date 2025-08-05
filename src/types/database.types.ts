export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      sessions: {
        Row: {
          id: string
          title: string
          created_at: string
          current_stage: number
          status: 'not_started' | 'active' | 'reflection' | 'ended'
          trainer_id: string // Now stores email address as TEXT
          trainer_code: string
          cyclists_count: number
          stage_open: boolean
          stage_locked: boolean
          multiplier_active: boolean
          current_multiplier: number
        }
        Insert: {
          id?: string
          title: string
          created_at?: string
          current_stage?: number
          status?: 'not_started' | 'active' | 'reflection' | 'ended'
          trainer_id: string // Email address as TEXT
          trainer_code: string
          cyclists_count?: number
          stage_open?: boolean
          stage_locked?: boolean
          multiplier_active?: boolean
          current_multiplier?: number
        }
        Update: {
          id?: string
          title?: string
          created_at?: string
          current_stage?: number
          status?: 'not_started' | 'active' | 'reflection' | 'ended'
          trainer_id?: string // Email address as TEXT
          trainer_code?: string
          cyclists_count?: number
          stage_open?: boolean
          stage_locked?: boolean
          multiplier_active?: boolean
          current_multiplier?: number
        }
      }
      teams: {
        Row: {
          id: string
          session_id: string
          name: string
          type: 'rubicon' | 'solaris' | 'corex' | 'vortex'
          synergy_score: number
          total_points: number
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          name: string
          type?: 'rubicon' | 'solaris' | 'corex' | 'vortex'
          synergy_score?: number
          total_points?: number
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          name?: string
          type?: 'rubicon' | 'solaris' | 'corex' | 'vortex'
          synergy_score?: number
          total_points?: number
          created_at?: string
        }
      }
      cyclists: {
        Row: {
          id: string
          team_id: string
          name: string
          stamina: number
          current_points: number
          character_role: 'luca' | 'jonas' | 'mateo' | 'kenji'
          fatigue_penalty: boolean
          created_at: string
        }
        Insert: {
          id?: string
          team_id: string
          name: string
          stamina?: number
          current_points?: number
          character_role: 'luca' | 'jonas' | 'mateo' | 'kenji'
          fatigue_penalty?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          team_id?: string
          name?: string
          stamina?: number
          current_points?: number
          character_role?: 'luca' | 'jonas' | 'mateo' | 'kenji'
          fatigue_penalty?: boolean
          created_at?: string
        }
      }
      users: {
        Row: {
          id: string
          email: string | null
          team_id: string | null
          cyclist_id: string | null
          role: 'player' | 'trainer'
          assigned_code: string | null
          session_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          email?: string | null
          team_id?: string | null
          cyclist_id?: string | null
          role?: 'player' | 'trainer'
          assigned_code?: string | null
          session_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          team_id?: string | null
          cyclist_id?: string | null
          role?: 'player' | 'trainer'
          assigned_code?: string | null
          session_id?: string | null
          created_at?: string
        }
      }
      decisions_log: {
        Row: {
          id: string
          cyclist_id: string
          session_id: string
          stage_number: number
          decision: 'sprint' | 'cruise'
          points_earned: number
          timestamp: string
        }
        Insert: {
          id?: string
          cyclist_id: string
          session_id: string
          stage_number: number
          decision: 'sprint' | 'cruise'
          points_earned?: number
          timestamp?: string
        }
        Update: {
          id?: string
          cyclist_id?: string
          session_id?: string
          stage_number?: number
          decision?: 'sprint' | 'cruise'
          points_earned?: number
          timestamp?: string
        }
      }
      reflections: {
        Row: {
          id: string
          user_id: string
          session_id: string
          stage_number: number
          reflection_text: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          session_id: string
          stage_number: number
          reflection_text: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          session_id?: string
          stage_number?: number
          reflection_text?: string
          created_at?: string
        }
      }
      negotiations: {
        Row: {
          id: string
          session_id: string
          stage_number: number
          is_open: boolean
          multiplier: number
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          stage_number: number
          is_open?: boolean
          multiplier?: number
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          stage_number?: number
          is_open?: boolean
          multiplier?: number
          created_at?: string
        }
      }
      cyclist_codes: {
        Row: {
          id: string
          session_id: string
          cyclist_name: string
          cyclist_id: string
          code: string
          team_name: string | null
          assigned_to: string | null
          player_joined_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          cyclist_name: string
          cyclist_id: string
          code: string
          team_name?: string | null
          assigned_to?: string | null
          player_joined_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          cyclist_name?: string
          cyclist_id?: string
          code?: string
          team_name?: string | null
          assigned_to?: string | null
          player_joined_at?: string | null
          created_at?: string
        }
      }
      trainer_requests: {
        Row: {
          id: string
          name: string
          email: string
          organization: string | null
          message: string | null
          status: 'pending' | 'approved' | 'denied'
          approved_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          organization?: string | null
          message?: string | null
          status?: 'pending' | 'approved' | 'denied'
          approved_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          organization?: string | null
          message?: string | null
          status?: 'pending' | 'approved' | 'denied'
          approved_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      approved_trainers: {
        Row: {
          id: string
          request_id: string
          name: string
          email: string
          organization: string | null
          approved_by: string
          created_at: string
        }
        Insert: {
          id?: string
          request_id: string
          name: string
          email: string
          organization?: string | null
          approved_by: string
          created_at?: string
        }
        Update: {
          id?: string
          request_id?: string
          name?: string
          email?: string
          organization?: string | null
          approved_by?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}