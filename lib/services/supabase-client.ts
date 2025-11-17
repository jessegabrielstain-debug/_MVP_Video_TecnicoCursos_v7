import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

type Env = {
  url: string;
  anonKey: string;
};

let browserClient: SupabaseClient<Database> | null = null;

function getEnv(): Env {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
  if (!url || !anonKey) {
    // Defer hard failure to consumers, but warn here
    // eslint-disable-next-line no-console
    console.warn('Supabase env vars ausentes: verifique NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }
  return { url, anonKey };
}

export function getSupabaseClient(): SupabaseClient<Database> {
  if (browserClient) return browserClient;
  const { url, anonKey } = getEnv();
  browserClient = createClient<Database>(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: true,
    },
  });
  return browserClient;
}
