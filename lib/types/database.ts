// Minimal Database types to type Supabase client for the new video-jobs endpoints only
export type JobStatus = 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled'

export interface Database {
  public: {
    Tables: {
      render_jobs: {
        Row: {
          id: string
          user_id: string
          project_id: string | null
          status: JobStatus
          progress: number
          output_url: string | null
          error_message: string | null
          render_settings: Record<string, unknown> | null
              attempts?: number
              duration_ms?: number | null
          started_at: string | null
          completed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          project_id?: string | null
          status?: JobStatus
          progress?: number
          output_url?: string | null
          error_message?: string | null
          render_settings?: Record<string, unknown> | null
          attempts?: number
          duration_ms?: number | null
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['render_jobs']['Row']>
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
  }
}
