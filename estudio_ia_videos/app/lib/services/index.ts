/**
 * Services Module Index
 * Exportações centralizadas de serviços e clientes Supabase
 * ATENÇÃO: Este arquivo é client-safe, não importa next/headers
 */

export * from './redis-service';
export * from './bullmq-service';
export * from './logger-service';
export * from './monitoring-service';

// Re-exports Supabase - SOMENTE CLIENT
export { 
	createClient as createBrowserSupabaseClient, 
	supabase,
	getCurrentUser,
	isAuthenticated,
	signOut
} from '../supabase/client';

// Re-exports Supabase - SERVER (API Routes)
export {
  createClient,
  createClient as createServerSupabaseClient,
  supabaseAdmin,
  getSupabaseForRequest
} from '../supabase/server';
