/**
 * Supabase Database Types
 * FASE 2: Avatares 3D Hiper-Realistas
 * 
 * Este arquivo contém todas as definições de tipos TypeScript
 * para as tabelas e enums do banco de dados Supabase
 */

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
      avatar_models: {
        Row: {
          id: string
          name: string
          display_name: string
          description: string | null
          avatar_type: Database["public"]["Enums"]["avatar_type"]
          gender: Database["public"]["Enums"]["avatar_gender"]
          model_file_url: string
          texture_file_url: string | null
          animation_file_url: string | null
          thumbnail_url: string | null
          age_range: string | null
          ethnicity: string | null
          hair_color: string | null
          eye_color: string | null
          supports_audio2face: boolean | null
          supports_voice_cloning: boolean | null
          supports_real_time: boolean | null
          blend_shapes_count: number | null
          file_size: number | null
          model_version: string | null
          created_by: string | null
          is_active: boolean | null
          is_premium: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          display_name: string
          description?: string | null
          avatar_type?: Database["public"]["Enums"]["avatar_type"]
          gender: Database["public"]["Enums"]["avatar_gender"]
          model_file_url: string
          texture_file_url?: string | null
          animation_file_url?: string | null
          thumbnail_url?: string | null
          age_range?: string | null
          ethnicity?: string | null
          hair_color?: string | null
          eye_color?: string | null
          supports_audio2face?: boolean | null
          supports_voice_cloning?: boolean | null
          supports_real_time?: boolean | null
          blend_shapes_count?: number | null
          file_size?: number | null
          model_version?: string | null
          created_by?: string | null
          is_active?: boolean | null
          is_premium?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          display_name?: string
          description?: string | null
          avatar_type?: Database["public"]["Enums"]["avatar_type"]
          gender?: Database["public"]["Enums"]["avatar_gender"]
          model_file_url?: string
          texture_file_url?: string | null
          animation_file_url?: string | null
          thumbnail_url?: string | null
          age_range?: string | null
          ethnicity?: string | null
          hair_color?: string | null
          eye_color?: string | null
          supports_audio2face?: boolean | null
          supports_voice_cloning?: boolean | null
          supports_real_time?: boolean | null
          blend_shapes_count?: number | null
          file_size?: number | null
          model_version?: string | null
          created_by?: string | null
          is_active?: boolean | null
          is_premium?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "avatar_models_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      // Tabelas adicionais (stubs) para compatibilidade com código existente
      analytics_events: {
        Row: Record<string, unknown>
        Insert: Record<string, unknown>
        Update: Record<string, unknown>
        Relationships: []
      }
      analytics_alerts: {
        Row: Record<string, unknown>
        Insert: Record<string, unknown>
        Update: Record<string, unknown>
        Relationships: []
      }
      analytics_reports: {
        Row: Record<string, unknown>
        Insert: Record<string, unknown>
        Update: Record<string, unknown>
        Relationships: []
      }
      projects: {
        Row: Record<string, unknown>
        Insert: Record<string, unknown>
        Update: Record<string, unknown>
        Relationships: []
      }
      project_versions: {
        Row: Record<string, unknown>
        Insert: Record<string, unknown>
        Update: Record<string, unknown>
        Relationships: []
      }
      project_collaborators: {
        Row: Record<string, unknown>
        Insert: Record<string, unknown>
        Update: Record<string, unknown>
        Relationships: []
      }
      project_analytics: {
        Row: Record<string, unknown>
        Insert: Record<string, unknown>
        Update: Record<string, unknown>
        Relationships: []
      }
      users: {
        Row: Record<string, unknown>
        Insert: Record<string, unknown>
        Update: Record<string, unknown>
        Relationships: []
      }
      notifications: {
        Row: Record<string, unknown>
        Insert: Record<string, unknown>
        Update: Record<string, unknown>
        Relationships: []
      }
      notification_preferences: {
        Row: Record<string, unknown>
        Insert: Record<string, unknown>
        Update: Record<string, unknown>
        Relationships: []
      }
      user_render_settings: {
        Row: Record<string, unknown>
        Insert: Record<string, unknown>
        Update: Record<string, unknown>
        Relationships: []
      }
      slides: {
        Row: Record<string, unknown>
        Insert: Record<string, unknown>
        Update: Record<string, unknown>
        Relationships: []
      }
      user_external_api_configs: {
        Row: Record<string, unknown>
        Insert: Record<string, unknown>
        Update: Record<string, unknown>
        Relationships: []
      }
      external_api_usage: {
        Row: Record<string, unknown>
        Insert: Record<string, unknown>
        Update: Record<string, unknown>
        Relationships: []
      }
      tts_generation_history: {
        Row: Record<string, unknown>
        Insert: Record<string, unknown>
        Update: Record<string, unknown>
        Relationships: []
      }
      media_download_history: {
        Row: Record<string, unknown>
        Insert: Record<string, unknown>
        Update: Record<string, unknown>
        Relationships: []
      }
      compliance_check_history: {
        Row: Record<string, unknown>
        Insert: Record<string, unknown>
        Update: Record<string, unknown>
        Relationships: []
      }
      voice_profiles: {
        Row: {
          id: string
          name: string
          display_name: string
          description: string | null
          language: Database["public"]["Enums"]["supported_language"]
          gender: Database["public"]["Enums"]["avatar_gender"]
          age_range: string | null
          accent: string | null
          sample_audio_url: string
          training_data_url: string | null
          sample_rate: number | null
          bit_depth: number | null
          duration_seconds: number | null
          quality_score: number | null
          similarity_score: number | null
          naturalness_score: number | null
          created_by: string | null
          is_active: boolean | null
          is_premium: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          display_name: string
          description?: string | null
          language?: Database["public"]["Enums"]["supported_language"]
          gender: Database["public"]["Enums"]["avatar_gender"]
          age_range?: string | null
          accent?: string | null
          sample_audio_url: string
          training_data_url?: string | null
          sample_rate?: number | null
          bit_depth?: number | null
          duration_seconds?: number | null
          quality_score?: number | null
          similarity_score?: number | null
          naturalness_score?: number | null
          created_by?: string | null
          is_active?: boolean | null
          is_premium?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          display_name?: string
          description?: string | null
          language?: Database["public"]["Enums"]["supported_language"]
          gender?: Database["public"]["Enums"]["avatar_gender"]
          age_range?: string | null
          accent?: string | null
          sample_audio_url?: string
          training_data_url?: string | null
          sample_rate?: number | null
          bit_depth?: number | null
          duration_seconds?: number | null
          quality_score?: number | null
          similarity_score?: number | null
          naturalness_score?: number | null
          created_by?: string | null
          is_active?: boolean | null
          is_premium?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "voice_profiles_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      render_jobs: {
        Row: {
          id: string
          user_id: string
          avatar_model_id: string
          voice_profile_id: string | null
          status: Database["public"]["Enums"]["render_status"] | null
          quality: Database["public"]["Enums"]["render_quality"] | null
          resolution: Database["public"]["Enums"]["video_resolution"] | null
          script_text: string
          audio_file_url: string | null
          enable_audio2face: boolean | null
          enable_real_time_lipsync: boolean | null
          enable_ray_tracing: boolean | null
          camera_angle: string | null
          lighting_preset: string | null
          background_type: string | null
          progress_percentage: number | null
          estimated_duration_seconds: number | null
          actual_duration_seconds: number | null
          output_video_url: string | null
          output_thumbnail_url: string | null
          output_metadata: Json | null
          lipsync_accuracy: number | null
          render_time_seconds: number | null
          file_size_bytes: number | null
          processing_log: Json | null
          error_message: string | null
          retry_count: number | null
          processing_cost: number | null
          credits_used: number | null
          started_at: string | null
          completed_at: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          avatar_model_id: string
          voice_profile_id?: string | null
          status?: Database["public"]["Enums"]["render_status"] | null
          quality?: Database["public"]["Enums"]["render_quality"] | null
          resolution?: Database["public"]["Enums"]["video_resolution"] | null
          script_text: string
          audio_file_url?: string | null
          enable_audio2face?: boolean | null
          enable_real_time_lipsync?: boolean | null
          enable_ray_tracing?: boolean | null
          camera_angle?: string | null
          lighting_preset?: string | null
          background_type?: string | null
          progress_percentage?: number | null
          estimated_duration_seconds?: number | null
          actual_duration_seconds?: number | null
          output_video_url?: string | null
          output_thumbnail_url?: string | null
          output_metadata?: Json | null
          lipsync_accuracy?: number | null
          render_time_seconds?: number | null
          file_size_bytes?: number | null
          processing_log?: Json | null
          error_message?: string | null
          retry_count?: number | null
          processing_cost?: number | null
          credits_used?: number | null
          started_at?: string | null
          completed_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          avatar_model_id?: string
          voice_profile_id?: string | null
          status?: Database["public"]["Enums"]["render_status"] | null
          quality?: Database["public"]["Enums"]["render_quality"] | null
          resolution?: Database["public"]["Enums"]["video_resolution"] | null
          script_text?: string
          audio_file_url?: string | null
          enable_audio2face?: boolean | null
          enable_real_time_lipsync?: boolean | null
          enable_ray_tracing?: boolean | null
          camera_angle?: string | null
          lighting_preset?: string | null
          background_type?: string | null
          progress_percentage?: number | null
          estimated_duration_seconds?: number | null
          actual_duration_seconds?: number | null
          output_video_url?: string | null
          output_thumbnail_url?: string | null
          output_metadata?: Json | null
          lipsync_accuracy?: number | null
          render_time_seconds?: number | null
          file_size_bytes?: number | null
          processing_log?: Json | null
          error_message?: string | null
          retry_count?: number | null
          processing_cost?: number | null
          credits_used?: number | null
          started_at?: string | null
          completed_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "render_jobs_avatar_model_id_fkey"
            columns: ["avatar_model_id"]
            isOneToOne: false
            referencedRelation: "avatar_models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "render_jobs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "render_jobs_voice_profile_id_fkey"
            columns: ["voice_profile_id"]
            isOneToOne: false
            referencedRelation: "voice_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      audio2face_sessions: {
        Row: {
          id: string
          render_job_id: string
          session_id: string
          model_name: string
          sample_rate: number | null
          audio_file_path: string
          blend_shapes_file_path: string | null
          arkit_curves_url: string | null
          blend_shapes_data: Json | null
          processing_time_seconds: number | null
          accuracy_score: number | null
          status: Database["public"]["Enums"]["render_status"] | null
          error_message: string | null
          started_at: string | null
          completed_at: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          render_job_id: string
          session_id: string
          model_name: string
          sample_rate?: number | null
          audio_file_path: string
          blend_shapes_file_path?: string | null
          arkit_curves_url?: string | null
          blend_shapes_data?: Json | null
          processing_time_seconds?: number | null
          accuracy_score?: number | null
          status?: Database["public"]["Enums"]["render_status"] | null
          error_message?: string | null
          started_at?: string | null
          completed_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          render_job_id?: string
          session_id?: string
          model_name?: string
          sample_rate?: number | null
          audio_file_path?: string
          blend_shapes_file_path?: string | null
          arkit_curves_url?: string | null
          blend_shapes_data?: Json | null
          processing_time_seconds?: number | null
          accuracy_score?: number | null
          status?: Database["public"]["Enums"]["render_status"] | null
          error_message?: string | null
          started_at?: string | null
          completed_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audio2face_sessions_render_job_id_fkey"
            columns: ["render_job_id"]
            isOneToOne: false
            referencedRelation: "render_jobs"
            referencedColumns: ["id"]
          }
        ]
      }
      avatar_analytics: {
        Row: {
          id: string
          user_id: string | null
          avatar_model_id: string | null
          render_job_id: string | null
          event_type: string
          event_data: Json | null
          user_agent: string | null
          ip_address: string | null
          session_id: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          avatar_model_id?: string | null
          render_job_id?: string | null
          event_type: string
          event_data?: Json | null
          user_agent?: string | null
          ip_address?: string | null
          session_id?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          avatar_model_id?: string | null
          render_job_id?: string | null
          event_type?: string
          event_data?: Json | null
          user_agent?: string | null
          ip_address?: string | null
          session_id?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "avatar_analytics_avatar_model_id_fkey"
            columns: ["avatar_model_id"]
            isOneToOne: false
            referencedRelation: "avatar_models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "avatar_analytics_render_job_id_fkey"
            columns: ["render_job_id"]
            isOneToOne: false
            referencedRelation: "render_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "avatar_analytics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      system_stats: {
        Row: {
          id: string
          total_renders: number | null
          active_jobs: number | null
          completed_jobs: number | null
          failed_jobs: number | null
          avg_render_time_seconds: number | null
          avg_lipsync_accuracy: number | null
          success_rate: number | null
          cpu_usage: number | null
          memory_usage: number | null
          gpu_usage: number | null
          disk_usage: number | null
          audio2face_status: string | null
          redis_status: string | null
          database_status: string | null
          recorded_at: string | null
        }
        Insert: {
          id?: string
          total_renders?: number | null
          active_jobs?: number | null
          completed_jobs?: number | null
          failed_jobs?: number | null
          avg_render_time_seconds?: number | null
          avg_lipsync_accuracy?: number | null
          success_rate?: number | null
          cpu_usage?: number | null
          memory_usage?: number | null
          gpu_usage?: number | null
          disk_usage?: number | null
          audio2face_status?: string | null
          redis_status?: string | null
          database_status?: string | null
          recorded_at?: string | null
        }
        Update: {
          id?: string
          total_renders?: number | null
          active_jobs?: number | null
          completed_jobs?: number | null
          failed_jobs?: number | null
          avg_render_time_seconds?: number | null
          avg_lipsync_accuracy?: number | null
          success_rate?: number | null
          cpu_usage?: number | null
          memory_usage?: number | null
          gpu_usage?: number | null
          disk_usage?: number | null
          audio2face_status?: string | null
          redis_status?: string | null
          database_status?: string | null
          recorded_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      avatar_stats: {
        Row: {
          id: string | null
          name: string | null
          display_name: string | null
          avatar_type: Database["public"]["Enums"]["avatar_type"] | null
          gender: Database["public"]["Enums"]["avatar_gender"] | null
          total_renders: number | null
          completed_renders: number | null
          avg_lipsync_accuracy: number | null
          avg_render_time: number | null
        }
        Relationships: []
      }
      voice_stats: {
        Row: {
          id: string | null
          name: string | null
          display_name: string | null
          language: Database["public"]["Enums"]["supported_language"] | null
          gender: Database["public"]["Enums"]["avatar_gender"] | null
          total_uses: number | null
          avg_lipsync_accuracy: number | null
          quality_score: number | null
          naturalness_score: number | null
        }
        Relationships: []
      }
      render_dashboard: {
        Row: {
          date: string | null
          total_jobs: number | null
          completed_jobs: number | null
          failed_jobs: number | null
          processing_jobs: number | null
          avg_render_time: number | null
          avg_lipsync_accuracy: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      is_admin: {
        Args: {
          user_id: string
        }
        Returns: boolean
      }
      can_access_render_job: {
        Args: {
          job_id: string
          user_id: string
        }
        Returns: boolean
      }
      get_user_render_stats: {
        Args: {
          user_id: string
        }
        Returns: {
          total_jobs: number
          completed_jobs: number
          failed_jobs: number
          avg_render_time: number
          avg_lipsync_accuracy: number
        }[]
      }
      create_demo_render_job: {
        Args: {
          demo_user_id: string
        }
        Returns: string
      }
    }
    Enums: {
      render_status: "pending" | "queued" | "processing" | "completed" | "failed" | "cancelled"
      render_quality: "draft" | "standard" | "high" | "ultra"
      video_resolution: "480p" | "720p" | "1080p" | "1440p" | "4k"
      avatar_type: "realistic" | "stylized" | "cartoon" | "professional"
      avatar_gender: "male" | "female" | "neutral"
      supported_language: "pt-BR" | "en-US" | "es-ES" | "fr-FR" | "de-DE" | "it-IT" | "ja-JP" | "ko-KR" | "zh-CN"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Tipos auxiliares para facilitar o uso
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]
export type Functions<T extends keyof Database['public']['Functions']> = Database['public']['Functions'][T]