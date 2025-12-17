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
          owner_id: string
          name: string
          description: string | null
          status: 'draft' | 'processing' | 'rendering' | 'completed' | 'failed'
          settings: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          name: string
          description?: string | null
          status?: 'draft' | 'processing' | 'rendering' | 'completed' | 'failed'
          settings?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          name?: string
          description?: string | null
          status?: 'draft' | 'processing' | 'rendering' | 'completed' | 'failed'
          settings?: Json | null
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
      pptx_uploads: {
        Row: {
          id: string
          project_id: string | null
          original_filename: string | null
          filename: string | null
          status: string
          slide_count: number
          preview_url: string | null
          file_path: string | null
          processing_progress: number | null
          slides_data: Json | null
          metadata: Json | null
          processed_at: string | null
          error_message: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id?: string | null
          original_filename?: string | null
          filename?: string | null
          status?: string
          slide_count?: number
          preview_url?: string | null
          file_path?: string | null
          processing_progress?: number | null
          slides_data?: Json | null
          metadata?: Json | null
          processed_at?: string | null
          error_message?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string | null
          original_filename?: string | null
          filename?: string | null
          status?: string
          slide_count?: number
          preview_url?: string | null
          file_path?: string | null
          processing_progress?: number | null
          slides_data?: Json | null
          metadata?: Json | null
          processed_at?: string | null
          error_message?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      pptx_slides: {
        Row: {
          id: string
          upload_id: string | null
          slide_number: number
          title: string | null
          content: string | null
          duration: number
          transition_type: string
          thumbnail_url: string | null
          notes: string | null
          properties: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          upload_id?: string | null
          slide_number: number
          title?: string | null
          content?: string | null
          duration?: number
          transition_type?: string
          thumbnail_url?: string | null
          notes?: string | null
          properties?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          upload_id?: string | null
          slide_number?: number
          title?: string | null
          content?: string | null
          duration?: number
          transition_type?: string
          thumbnail_url?: string | null
          notes?: string | null
          properties?: Json | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      avatars_3d: {
        Row: {
          id: string
          user_id: string
          project_id: string | null
          name: string
          ready_player_me_url: string | null
          avatar_type: 'full_body' | 'half_body' | 'head_only'
          gender: 'male' | 'female' | 'other' | null
          style: 'realistic' | 'cartoon' | 'anime' | null
          animations: Json | null
          voice_settings: Json | null
          properties: Json | null
          is_public: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          project_id?: string | null
          name: string
          ready_player_me_url?: string | null
          avatar_type?: 'full_body' | 'half_body' | 'head_only'
          gender?: 'male' | 'female' | 'other' | null
          style?: 'realistic' | 'cartoon' | 'anime' | null
          animations?: Json | null
          voice_settings?: Json | null
          properties?: Json | null
          is_public?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          project_id?: string | null
          name?: string
          ready_player_me_url?: string | null
          avatar_type?: 'full_body' | 'half_body' | 'head_only'
          gender?: 'male' | 'female' | 'other' | null
          style?: 'realistic' | 'cartoon' | 'anime' | null
          animations?: Json | null
          voice_settings?: Json | null
          properties?: Json | null
          is_public?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      render_settings: {
        Row: {
          id: string
          user_id: string
          settings: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          settings: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          settings?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      sync_jobs: {
        Row: {
          id: string
          user_id: string
          status: 'pending' | 'processing' | 'completed' | 'failed'
          type: string
          metadata: Json | null
          error_message: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          type: string
          metadata?: Json | null
          error_message?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          type?: string
          metadata?: Json | null
          error_message?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          id: string
          email: string
          name: string | null
          avatar_url: string | null
          role: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name?: string | null
          avatar_url?: string | null
          role?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          avatar_url?: string | null
          role?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_render_settings: {
        Row: {
          id: string
          user_id: string
          settings: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          settings: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          settings?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      timeline_tracks: {
        Row: {
          id: string
          project_id: string | null
          name: string
          type: string
          order_index: number
          color: string | null
          height: number | null
          visible: boolean | null
          locked: boolean | null
          muted: boolean | null
          properties: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id?: string | null
          name: string
          type: string
          order_index?: number
          color?: string | null
          height?: number | null
          visible?: boolean | null
          locked?: boolean | null
          muted?: boolean | null
          properties?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string | null
          name?: string
          type?: string
          order_index?: number
          color?: string | null
          height?: number | null
          visible?: boolean | null
          locked?: boolean | null
          muted?: boolean | null
          properties?: Json | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      timeline_elements: {
        Row: {
          id: string
          track_id: string | null
          project_id: string | null
          start_time: number
          duration: number
          end_time: number
          type: string
          content: string
          source_url: string | null
          properties: Json | null
          effects: Json | null
          transitions: Json | null
          thumbnail_url: string | null
          file_size: number | null
          mime_type: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          track_id?: string | null
          project_id?: string | null
          start_time?: number
          duration?: number
          type: string
          content: string
          source_url?: string | null
          properties?: Json | null
          effects?: Json | null
          transitions?: Json | null
          thumbnail_url?: string | null
          file_size?: number | null
          mime_type?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          track_id?: string | null
          project_id?: string | null
          start_time?: number
          duration?: number
          type?: string
          content?: string
          source_url?: string | null
          properties?: Json | null
          effects?: Json | null
          transitions?: Json | null
          thumbnail_url?: string | null
          file_size?: number | null
          mime_type?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      project_history: {
        Row: {
          id: string
          project_id: string
          user_id: string
          action: string
          entity_type: string | null
          entity_id: string | null
          description: string | null
          changes: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          user_id: string
          action: string
          entity_type?: string | null
          entity_id?: string | null
          description?: string | null
          changes?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          user_id?: string
          action?: string
          entity_type?: string | null
          entity_id?: string | null
          description?: string | null
          changes?: Json | null
          created_at?: string
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          id: string
          user_id: string
          email_notifications: boolean
          push_notifications: boolean
          in_app_notifications: boolean
          notification_types: Json | null
          quiet_hours: Json | null
          frequency_limits: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          email_notifications?: boolean
          push_notifications?: boolean
          in_app_notifications?: boolean
          notification_types?: Json | null
          quiet_hours?: Json | null
          frequency_limits?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          email_notifications?: boolean
          push_notifications?: boolean
          in_app_notifications?: boolean
          notification_types?: Json | null
          quiet_hours?: Json | null
          frequency_limits?: Json | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_external_api_configs: {
        Row: {
          id: string
          user_id: string
          api_type: string
          provider_id: string
          provider_name: string
          provider_type: string
          enabled: boolean
          config: Json | null
          pricing: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          api_type: string
          provider_id: string
          provider_name: string
          provider_type: string
          enabled?: boolean
          config?: Json | null
          pricing?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          api_type?: string
          provider_id?: string
          provider_name?: string
          provider_type?: string
          enabled?: boolean
          config?: Json | null
          pricing?: Json | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      external_api_usage: {
        Row: {
          id: string
          user_id: string
          api_type: string
          provider_id: string
          requests_made: number
          characters_used: number
          downloads_made: number
          cost: number
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          api_type: string
          provider_id: string
          requests_made?: number
          characters_used?: number
          downloads_made?: number
          cost?: number
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          api_type?: string
          provider_id?: string
          requests_made?: number
          characters_used?: number
          downloads_made?: number
          cost?: number
          metadata?: Json | null
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      is_admin: {
        Args: Record<string, never>
        Returns: boolean
      }
      check_table_exists: {
        Args: { table_name: string }
        Returns: boolean
      }
      exec_sql: {
        Args: { query: string }
        Returns: unknown
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

export type Project = Database['public']['Tables']['projects']['Row']
export type Slide = Database['public']['Tables']['slides']['Row']
export type RenderJob = Database['public']['Tables']['render_jobs']['Row']
export type Avatar3D = Database['public']['Tables']['avatars_3d']['Row']
export type RenderSettings = Database['public']['Tables']['render_settings']['Row']
export type SyncJob = Database['public']['Tables']['sync_jobs']['Row']
export type User = Database['public']['Tables']['users']['Row']
export type TimelineTrack = Database['public']['Tables']['timeline_tracks']['Row']
export type TimelineElement = Database['public']['Tables']['timeline_elements']['Row']
export type ProjectHistory = Database['public']['Tables']['project_history']['Row']
export type PptxUpload = Database['public']['Tables']['pptx_uploads']['Row']
export type PptxSlide = Database['public']['Tables']['pptx_slides']['Row']
export type NotificationPreferences = Database['public']['Tables']['notification_preferences']['Row']
