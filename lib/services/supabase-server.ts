import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

export function getSupabaseForRequest(req: Request): SupabaseClient<Database> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
  const authHeader = (req.headers.get('authorization') || req.headers.get('Authorization')) ?? '';
  const globalHeaders: Record<string, string> = {};
  if (authHeader) globalHeaders['Authorization'] = authHeader;

  return createClient<Database>(url, anonKey, {
    global: { headers: globalHeaders },
    auth: { persistSession: false, autoRefreshToken: true },
  });
}
