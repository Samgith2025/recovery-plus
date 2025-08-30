// Supabase database types
export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          email: string;
          first_name: string | null;
          last_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          first_name?: string | null;
          last_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          first_name?: string | null;
          last_name?: string | null;
          avatar_url?: string | null;
          updated_at?: string;
        };
      };
      questionnaire_responses: {
        Row: {
          id: string;
          user_id: string;
          responses: Record<string, unknown>;
          completed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          responses: Record<string, unknown>;
          completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          responses?: Record<string, unknown>;
          completed?: boolean;
          updated_at?: string;
        };
      };
      recovery_phases: {
        Row: {
          id: string;
          user_id: string;
          phase: number;
          title: string;
          description: string;
          weekly_plan: Record<string, unknown>;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          phase: number;
          title: string;
          description: string;
          weekly_plan: Record<string, unknown>;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          phase?: number;
          title?: string;
          description?: string;
          weekly_plan?: Record<string, unknown>;
          is_active?: boolean;
          updated_at?: string;
        };
      };
      exercises: {
        Row: {
          id: string;
          title: string;
          description: string;
          instructions: string[];
          sets: number | null;
          reps: number | null;
          hold_time: number | null;
          rest_time: number | null;
          difficulty: number;
          body_parts: string[];
          video_urls: string[];
          image_url: string | null;
          type: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          instructions: string[];
          sets?: number | null;
          reps?: number | null;
          hold_time?: number | null;
          rest_time?: number | null;
          difficulty: number;
          body_parts: string[];
          video_urls: string[];
          image_url?: string | null;
          type: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          description?: string;
          instructions?: string[];
          sets?: number | null;
          reps?: number | null;
          hold_time?: number | null;
          rest_time?: number | null;
          difficulty?: number;
          body_parts?: string[];
          video_urls?: string[];
          image_url?: string | null;
          type?: string;
          updated_at?: string;
        };
      };
      exercise_sessions: {
        Row: {
          id: string;
          exercise_id: string;
          user_id: string;
          completed: boolean;
          pain_level: number | null;
          difficulty_rating: number | null;
          notes: string | null;
          completed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          exercise_id: string;
          user_id: string;
          completed?: boolean;
          pain_level?: number | null;
          difficulty_rating?: number | null;
          notes?: string | null;
          completed_at?: string | null;
          created_at?: string;
        };
        Update: {
          completed?: boolean;
          pain_level?: number | null;
          difficulty_rating?: number | null;
          notes?: string | null;
          completed_at?: string | null;
        };
      };
      user_preferences: {
        Row: {
          id: string;
          user_id: string;
          notifications_enabled: boolean;
          reminder_time: string | null;
          theme: string;
          language: string;
          privacy_analytics: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          notifications_enabled?: boolean;
          reminder_time?: string | null;
          theme?: string;
          language?: string;
          privacy_analytics?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          notifications_enabled?: boolean;
          reminder_time?: string | null;
          theme?: string;
          language?: string;
          privacy_analytics?: boolean;
          updated_at?: string;
        };
      };
      chat_messages: {
        Row: {
          id: string;
          user_id: string;
          content: string;
          is_user: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          content: string;
          is_user: boolean;
          created_at?: string;
        };
        Update: {
          content?: string;
          is_user?: boolean;
        };
      };
      weekly_plans: {
        Row: {
          id: string;
          phase_id: string;
          exercises: Record<string, unknown>[];
          week_number: number;
          is_locked: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          phase_id: string;
          exercises: Record<string, unknown>[];
          week_number: number;
          is_locked?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          exercises?: Record<string, unknown>[];
          week_number?: number;
          is_locked?: boolean;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      exercise_type: 'strength' | 'mobility' | 'isometric' | 'cardio';
    };
  };
}
