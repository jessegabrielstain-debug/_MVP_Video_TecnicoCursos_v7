// JSON field types
type JsonObject = Record<string, unknown>;

export type Database = {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          role: 'user' | 'admin' | 'enterprise'
          credits: number
          subscription_tier: 'free' | 'pro' | 'enterprise'
          metadata: JsonObject | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          role?: 'user' | 'admin' | 'enterprise'
          credits?: number
          subscription_tier?: 'free' | 'pro' | 'enterprise'
          metadata?: JsonObject | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          role?: 'user' | 'admin' | 'enterprise'
          credits?: number
          subscription_tier?: 'free' | 'pro' | 'enterprise'
          metadata?: JsonObject | null
          created_at?: string
          updated_at?: string
        }
      }
      files: {
        Row: {
          id: string
          user_id: string
          project_id: string | null
          name: string
          path: string
          url: string
          thumbnail_url: string | null
          size: number
          type: string
          file_type: string | null
          metadata: JsonObject | null
          created_at: string
        }
        Insert: {
          id: string
          user_id: string
          project_id?: string | null
          name: string
          path: string
          url: string
          thumbnail_url?: string | null
          size: number
          type: string
          file_type?: string | null
          metadata?: JsonObject | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          project_id?: string | null
          name?: string
          path?: string
          url?: string
          thumbnail_url?: string | null
          size?: number
          type?: string
          file_type?: string | null
          metadata?: JsonObject | null
          created_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          status: 'draft' | 'processing' | 'ready' | 'rendering' | 'completed' | 'failed'
          metadata: JsonObject | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          user_id: string
          name: string
          description?: string | null
          status?: 'draft' | 'processing' | 'ready' | 'rendering' | 'completed' | 'failed'
          metadata?: JsonObject | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          status?: 'draft' | 'processing' | 'ready' | 'rendering' | 'completed' | 'failed'
          metadata?: JsonObject | null
          created_at?: string
          updated_at?: string
        }
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
          metadata: JsonObject | null
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
          metadata?: JsonObject | null
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
          metadata?: JsonObject | null
          created_at?: string
          updated_at?: string
        }
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
          render_settings: JsonObject | null
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
          render_settings?: JsonObject | null
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
          render_settings?: JsonObject | null
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      analytics_events: {
        Row: {
          id: string
          user_id: string | null
          event_type: string
          event_data: JsonObject | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          event_type: string
          event_data?: JsonObject | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          event_type?: string
          event_data?: JsonObject | null
          created_at?: string
        }
      }
    }
    Views: {
      user_stats: {
        Row: {
          id: string
          email: string
          credits: number
          subscription_tier: string
          total_projects: number
          total_files: number
          total_renders: number
          completed_renders: number
          total_storage_used: number
        }
      }
      projects_detailed: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          status: string
          metadata: JsonObject | null
          created_at: string
          updated_at: string
          user_email: string
          slide_count: number
          file_count: number
          render_count: number
          last_render_at: string | null
        }
      }
    }
  }
}
