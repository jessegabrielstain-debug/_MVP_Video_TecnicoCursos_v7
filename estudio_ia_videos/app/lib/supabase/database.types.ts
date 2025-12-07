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
          role: string | null
          metadata: Json
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id: string
          email: string
          name?: string | null
          avatar_url?: string | null
          role?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          avatar_url?: string | null
          role?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string | null
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
      projects: {
        Row: {
          id: string
          user_id: string
          name: string
          type: 'pptx' | 'template-nr' | 'talking-photo' | 'custom' | 'ai-generated'
          description: string | null
          status: string
          metadata: Json
          render_settings: Json
          thumbnail_url: string | null
          preview_url: string | null
          current_version: string
          is_template: boolean
          is_public: boolean
          collaboration_enabled: boolean
          created_at: string
          updated_at: string | null
          last_accessed_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          type?: 'pptx' | 'template-nr' | 'talking-photo' | 'custom' | 'ai-generated'
          description?: string | null
          status?: string
          metadata?: Json
          render_settings?: Json
          thumbnail_url?: string | null
          preview_url?: string | null
          current_version?: string
          is_template?: boolean
          is_public?: boolean
          collaboration_enabled?: boolean
          created_at?: string
          updated_at?: string | null
          last_accessed_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          type?: 'pptx' | 'template-nr' | 'talking-photo' | 'custom' | 'ai-generated'
          description?: string | null
          status?: string
          metadata?: Json
          render_settings?: Json
          thumbnail_url?: string | null
          preview_url?: string | null
          current_version?: string
          is_template?: boolean
          is_public?: boolean
          collaboration_enabled?: boolean
          created_at?: string
          updated_at?: string | null
          last_accessed_at?: string | null
        }
        Relationships: []
      }
      slides: {
        Row: {
          id: string
          project_id: string
          order_index: number
          title: string | null
          content: string | null
          duration: number
          background_color: string | null
          background_image: string | null
          avatar_config: Json
          audio_config: Json
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          project_id: string
          order_index: number
          title?: string | null
          content?: string | null
          duration?: number
          background_color?: string | null
          background_image?: string | null
          avatar_config?: Json
          audio_config?: Json
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          project_id?: string
          order_index?: number
          title?: string | null
          content?: string | null
          duration?: number
          background_color?: string | null
          background_image?: string | null
          avatar_config?: Json
          audio_config?: Json
          created_at?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      render_jobs: {
        Row: {
          id: string
          project_id: string
          status: string
          progress: number
          output_url: string | null
          error_message: string | null
          render_settings: Json
          attempts: number
          duration_ms: number | null
          started_at: string | null
          completed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          status?: string
          progress?: number
          output_url?: string | null
          error_message?: string | null
          render_settings?: Json
          attempts?: number
          duration_ms?: number | null
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          status?: string
          progress?: number
          output_url?: string | null
          error_message?: string | null
          render_settings?: Json
          attempts?: number
          duration_ms?: number | null
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
      analytics_events: {
        Row: {
          id: string
          user_id: string | null
          event_type: string
          event_data: Json
          session_id: string | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string | null
          event_type: string
          event_data?: Json
          session_id?: string | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          event_type?: string
          event_data?: Json
          session_id?: string | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Relationships: []
      }
      nr_courses: {
        Row: {
          id: string
          course_code: string
          title: string
          description: string | null
          thumbnail_url: string | null
          duration: number | null
          modules_count: number
          status: string
          metadata: Json
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          course_code: string
          title: string
          description?: string | null
          thumbnail_url?: string | null
          duration?: number | null
          modules_count?: number
          status?: string
          metadata?: Json
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          course_code?: string
          title?: string
          description?: string | null
          thumbnail_url?: string | null
          duration?: number | null
          modules_count?: number
          status?: string
          metadata?: Json
          created_at?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      nr_modules: {
        Row: {
          id: string
          course_id: string
          order_index: number
          title: string
          description: string | null
          thumbnail_url: string | null
          video_url: string | null
          duration: number | null
          content: Json
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          course_id: string
          order_index: number
          title: string
          description?: string | null
          thumbnail_url?: string | null
          video_url?: string | null
          duration?: number | null
          content?: Json
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          course_id?: string
          order_index?: number
          title?: string
          description?: string | null
          thumbnail_url?: string | null
          video_url?: string | null
          duration?: number | null
          content?: Json
          created_at?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      nr_templates: {
        Row: {
          id: string
          nr_number: string
          title: string
          description: string | null
          slide_count: number
          duration_seconds: number
          template_config: Json
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          nr_number: string
          title: string
          description?: string | null
          slide_count?: number
          duration_seconds?: number
          template_config?: Json
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          nr_number?: string
          title?: string
          description?: string | null
          slide_count?: number
          duration_seconds?: number
          template_config?: Json
          created_at?: string
          updated_at?: string | null
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
          updated_at: string | null
        }
        Insert: {
          id?: string
          project_id: string
          tracks?: Json
          settings?: Json
          total_duration?: number
          version?: number
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          project_id?: string
          tracks?: Json
          settings?: Json
          total_duration?: number
          version?: number
          created_at?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      timeline_tracks: {
        Row: {
          id: string
          project_id: string
          name: string
          type: string
          order_index: number
          color: string | null
          height: number
          visible: boolean
          locked: boolean
          muted: boolean
          properties: Json
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          project_id: string
          name: string
          type: string
          order_index: number
          color?: string | null
          height?: number
          visible?: boolean
          locked?: boolean
          muted?: boolean
          properties?: Json
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          project_id?: string
          name?: string
          type?: string
          order_index?: number
          color?: string | null
          height?: number
          visible?: boolean
          locked?: boolean
          muted?: boolean
          properties?: Json
          created_at?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      timeline_elements: {
        Row: {
          id: string
          track_id: string
          type: string
          start_time: number
          duration: number
          content: Json
          properties: Json
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          track_id: string
          type: string
          start_time: number
          duration: number
          content?: Json
          properties?: Json
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          track_id?: string
          type?: string
          start_time?: number
          duration?: number
          content?: Json
          properties?: Json
          created_at?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      pptx_uploads: {
        Row: {
          id: string
          project_id: string
          original_filename: string | null
          status: string
          slide_count: number
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          project_id: string
          original_filename?: string | null
          status?: string
          slide_count?: number
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          project_id?: string
          original_filename?: string | null
          status?: string
          slide_count?: number
          created_at?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      pptx_slides: {
        Row: {
          id: string
          upload_id: string
          slide_number: number
          title: string | null
          content: string | null
          duration: number
          transition_type: string
          thumbnail_url: string | null
          notes: string | null
          properties: Json
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          upload_id: string
          slide_number: number
          title?: string | null
          content?: string | null
          duration?: number
          transition_type?: string
          thumbnail_url?: string | null
          notes?: string | null
          properties?: Json
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          upload_id?: string
          slide_number?: number
          title?: string | null
          content?: string | null
          duration?: number
          transition_type?: string
          thumbnail_url?: string | null
          notes?: string | null
          properties?: Json
          created_at?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      project_history: {
        Row: {
          id: string
          project_id: string
          user_id: string | null
          action: string
          entity_type: string | null
          entity_id: string | null
          description: string | null
          changes: Json
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          user_id?: string | null
          action: string
          entity_type?: string | null
          entity_id?: string | null
          description?: string | null
          changes?: Json
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          user_id?: string | null
          action?: string
          entity_type?: string | null
          entity_id?: string | null
          description?: string | null
          changes?: Json
          created_at?: string
        }
        Relationships: []
      }
      project_versions: {
        Row: {
          id: string
          project_id: string
          version_number: string
          name: string
          description: string | null
          changes_summary: string | null
          created_by: string
          created_at: string
          metadata: Json
        }
        Insert: {
          id?: string
          project_id: string
          version_number: string
          name: string
          description?: string | null
          changes_summary?: string | null
          created_by: string
          created_at?: string
          metadata?: Json
        }
        Update: {
          id?: string
          project_id?: string
          version_number?: string
          name?: string
          description?: string | null
          changes_summary?: string | null
          created_by?: string
          created_at?: string
          metadata?: Json
        }
        Relationships: []
      }
      project_collaborators: {
        Row: {
          id: string
          project_id: string
          user_id: string
          role: string
          permissions: string[]
          invited_by: string
          joined_at: string
          last_activity: string | null
        }
        Insert: {
          id?: string
          project_id: string
          user_id: string
          role: string
          permissions?: string[]
          invited_by: string
          joined_at?: string
          last_activity?: string | null
        }
        Update: {
          id?: string
          project_id?: string
          user_id?: string
          role?: string
          permissions?: string[]
          invited_by?: string
          joined_at?: string
          last_activity?: string | null
        }
        Relationships: []
      }
      roles: {
        Row: {
          id: string
          name: string
          description: string | null
          permissions: Json
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          permissions?: Json
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          permissions?: Json
          created_at?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          user_id: string
          role_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          role_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          role_id?: string
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {
    }
    Functions: {
      get_project_analytics: {
        Args: {
          project_id: string
        }
        Returns: Json
      }
    }
    Enums: {
    }
    CompositeTypes: {
    }
  }
}