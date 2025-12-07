
import { getBrowserClient } from './browser';
import { Database } from './database.types';

// Criando o cliente Supabase para uso no lado do cliente (browser)
// createClientComponentClient lida automaticamente com cookies e ambiente Next.js
export const supabase = getBrowserClient();

// Facilita importar o cliente em componentes client-side sem ambiguidade de tipos.
export const createClient = () => getBrowserClient();

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