import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient as createSupabaseClient, type SupabaseClient, type SupabaseClientOptions } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { Database } from './database.types';

// Criando o cliente Supabase para uso no lado do servidor
export const createClient = () => {
  const cookieStore = cookies();
  
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // The `remove` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
};

// Cliente Supabase com a chave de serviço para operações administrativas
export const supabaseAdmin = createSupabaseClient<Database>(
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
  const authHeader = (req.headers.get('authorization') || req.headers.get('Authorization'));

  // Se houver header de autorização, usa o cliente padrão (API externa/Service)
  if (authHeader) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
    const globalHeaders: Record<string, string> = { 'Authorization': authHeader };

    return createSupabaseClient<Database>(url, anonKey, {
      global: { headers: globalHeaders },
      auth: { persistSession: false, autoRefreshToken: false },
    } as SupabaseClientOptions<'public'>);
  }

  // Fallback: Se não houver header, tenta usar cookies (Browser/Dashboard)
  return createClient();
}