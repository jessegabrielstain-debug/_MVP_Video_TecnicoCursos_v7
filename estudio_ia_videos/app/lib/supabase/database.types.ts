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
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id: string
          email: string
          name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string | null
        }
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
  }
}