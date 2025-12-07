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
      users: {
        Row: {
          id: string
          email: string
          name: string | null
          avatar_url: string | null
          role: 'user' | 'admin' | 'enterprise'
          credits: number
          subscription_tier: 'free' | 'pro' | 'enterprise'
          metadata: Json | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id: string
          email: string
          name?: string | null
          avatar_url?: string | null
          role?: 'user' | 'admin' | 'enterprise'
          credits?: number
          subscription_tier?: 'free' | 'pro' | 'enterprise'
          metadata?: Json | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          avatar_url?: string | null
          role?: 'user' | 'admin' | 'enterprise'
          credits?: number
          subscription_tier?: 'free' | 'pro' | 'enterprise'
          metadata?: Json | null
          created_at?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          status: 'draft' | 'processing' | 'ready' | 'rendering' | 'completed' | 'failed'
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          user_id: string
          name: string
          description?: string | null
          status?: 'draft' | 'processing' | 'ready' | 'rendering' | 'completed' | 'failed'
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          status?: 'draft' | 'processing' | 'ready' | 'rendering' | 'completed' | 'failed'
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      courses: {
        Row: {
          id: string
          title: string
          description: string | null
          thumbnail_url: string | null
          created_at: string
          updated_at: string | null
          author_id: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          thumbnail_url?: string | null
          created_at?: string
          updated_at?: string | null
          author_id: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          thumbnail_url?: string | null
          created_at?: string
          updated_at?: string | null
          author_id?: string
        }
        Relationships: []
      }
      videos: {
        Row: {
          id: string
          title: string
          description: string | null
          video_url: string
          thumbnail_url: string | null
          duration: number | null
          course_id: string
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          video_url: string
          thumbnail_url?: string | null
          duration?: number | null
          course_id: string
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          video_url?: string
          thumbnail_url?: string | null
          duration?: number | null
          course_id?: string
          created_at?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      slides: {
        Row: {
          id: string
          project_id: string
          index: number
          title: string | null
          content: string
          notes: string | null
          layout: string
          duration: number
          audio_url: string | null
          video_url: string | null
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          project_id: string
          index: number
          title?: string | null
          content: string
          notes?: string | null
          layout?: string
          duration?: number
          audio_url?: string | null
          video_url?: string | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          index?: number
          title?: string | null
          content?: string
          notes?: string | null
          layout?: string
          duration?: number
          audio_url?: string | null
          video_url?: string | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_progress: {
        Row: {
          id: string
          user_id: string
          video_id: string
          progress_percentage: number
          completed: boolean
          last_watched_at: string
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          video_id: string
          progress_percentage: number
          completed: boolean
          last_watched_at: string
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          video_id?: string
          progress_percentage?: number
          completed?: boolean
          last_watched_at?: string
          created_at?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      render_jobs: {
        Row: {
          id: string
          project_id: string
          user_id: string
          status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
          progress: number
          output_url: string | null
          error_message: string | null
          render_settings: Json | null
          started_at: string | null
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          project_id: string
          user_id: string
          status?: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
          progress?: number
          output_url?: string | null
          error_message?: string | null
          render_settings?: Json | null
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          user_id?: string
          status?: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
          progress?: number
          output_url?: string | null
          error_message?: string | null
          render_settings?: Json | null
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      analytics_events: {
        Row: {
          id: string
          user_id: string | null
          event_type: string
          event_data: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          event_type: string
          event_data?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          event_type?: string
          event_data?: Json | null
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_course_stats: {
        Args: { user_id: string }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}