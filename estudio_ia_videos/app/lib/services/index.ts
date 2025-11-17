/**
 * Services Module Index
 * Exportações centralizadas de serviços e clientes Supabase
 */

export * from './redis-service';
export * from './bullmq-service';
export * from './logger-service';
export * from './monitoring-service';

// Re-exports Supabase (nomenclatura padronizada)
export { 
	createClient as createBrowserSupabaseClient, 
	supabase,
	getCurrentUser,
	isAuthenticated,
	signOut
} from '../supabase/client';
export { createServerSupabaseClient, supabaseAdmin } from '../supabase/server';
