import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { Database } from './database.types';

// Criando o cliente Supabase para uso no lado do servidor
export const createServerSupabaseClient = () => {
  // const cookieStore = cookies(); // Cookies not supported in plain supabase-js client
  
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      // cookies option removed as it is not supported by supabase-js createClient
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