

import { createClient } from '@supabase/supabase-js'

export type Json = any

export interface MyDatabase {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
        }
        Insert: {
          id: string
          email: string
        }
        Update: {
          id?: string
          email?: string
        }
        Relationships: []
      },
      projects: {
        Row: {
          id: string
          name: string
        }
        Insert: {
          id?: string
          name: string
        }
        Update: {
          id?: string
          name?: string
        }
        Relationships: []
      }
    }
    Views: {
    }
    Functions: {
    }
    Enums: {
    }
    CompositeTypes: {
    }
  }
}

const supabase = createClient<MyDatabase>('', '')

async function test() {
  const payload = {
    user_id: '123',
    name: 'test',
    description: null,
    status: 'draft',
    metadata: null,
  }

  await supabase.from('projects').insert(payload)
}

