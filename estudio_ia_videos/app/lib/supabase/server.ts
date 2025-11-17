import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { Database } from './database.types';

// Criando o cliente Supabase para uso no lado do servidor
export const createServerSupabaseClient = () => {
  const cookieStore = cookies();
  
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );
};

// Cliente Supabase com a chave de serviço para operações administrativas
export const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Cria cliente Supabase usando Authorization do Request (para APIs)
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