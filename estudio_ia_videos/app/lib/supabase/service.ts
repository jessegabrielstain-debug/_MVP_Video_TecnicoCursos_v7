import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getSupabaseConfig } from './config'
import type { Database } from './database.types'

let cachedServiceClient: SupabaseClient<Database> | null = null

export function getServiceRoleClient(): SupabaseClient<Database> {
  if (cachedServiceClient) {
    return cachedServiceClient
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable for service Supabase client')
  }

  const { url } = getSupabaseConfig()
  cachedServiceClient = createClient<Database>(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })

  return cachedServiceClient
}
