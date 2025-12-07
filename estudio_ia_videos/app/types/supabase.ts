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
      projects: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          status: 'draft' | 'processing' | 'rendering' | 'completed' | 'failed'
          settings: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          status?: 'draft' | 'processing' | 'rendering' | 'completed' | 'failed'
          settings?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          status?: 'draft' | 'processing' | 'rendering' | 'completed' | 'failed'
          settings?: Json | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      timelines: {
        Row: {
          id: string
          project_id: string
          tracks: Json
          settings: Json
          total_duration: number
          version: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          tracks?: Json
          settings?: Json
          total_duration?: number
          version?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          tracks?: Json
          settings?: Json
          total_duration?: number
          version?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      slides: {
        Row: {
          id: string
          project_id: string
          title: string | null
          content: Json | null
          order_index: number
          duration: number | null
          background_color: string | null
          background_image: string | null
          avatar_config: Json | null
          audio_config: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          title?: string | null
          content?: Json | null
          order_index: number
          duration?: number | null
          background_color?: string | null
          background_image?: string | null
          avatar_config?: Json | null
          audio_config?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          title?: string | null
          content?: Json | null
          order_index?: number
          duration?: number | null
          background_color?: string | null
          background_image?: string | null
          avatar_config?: Json | null
          audio_config?: Json | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      render_jobs: {
        Row: {
          id: string
          project_id: string
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
          id?: string
          project_id: string
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
          event_type: string
          event_data: Json
          user_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          event_type: string
          event_data: Json
          user_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          event_type?: string
          event_data?: Json
          user_id?: string | null
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

export type Project = Database['public']['Tables']['projects']['Row']
export type Slide = Database['public']['Tables']['slides']['Row']
export type RenderJob = Database['public']['Tables']['render_jobs']['Row']
