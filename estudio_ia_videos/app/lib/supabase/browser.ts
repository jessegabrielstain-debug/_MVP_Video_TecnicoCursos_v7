import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getSupabaseConfig } from './config'
import type { Database } from './database.types'

let client: SupabaseClient<Database> | null = null

export function getBrowserClient(): SupabaseClient<Database> {
  if (client) {
    return client
  }

  const { url, anonKey } = getSupabaseConfig()
  client = createBrowserClient<Database>(url, anonKey)
  return client
}

export function createBrowserClientInstance(): SupabaseClient<Database> {
  const { url, anonKey } = getSupabaseConfig()
  return createBrowserClient<Database>(url, anonKey)
}
