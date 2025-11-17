import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { Database } from './database.types';

// Criando o cliente Supabase para uso no lado do cliente (browser)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Faltam variáveis de ambiente do Supabase. Verifique o arquivo .env');
}

export const supabase = createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Facilita importar o cliente em componentes client-side sem ambiguidade de tipos.
export const createClient = () => supabase;

// Função auxiliar para obter o usuário atual
export const getCurrentUser = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user;
};

// Função para verificar se o usuário está autenticado
export const isAuthenticated = async () => {
  const user = await getCurrentUser();
  return !!user;
};

// Função para fazer logout
export const signOut = async () => {
  return await supabase.auth.signOut();
};