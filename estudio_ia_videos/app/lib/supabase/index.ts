// Cliente Supabase
export { supabase, createClient, isAuthenticated } from './client';
export { supabase as supabaseClient } from './client';
export * from './server';
export * from './service';

// Autenticação
export * from './auth';

// Banco de dados
export * from './database';

// Armazenamento
export * from './storage';

// Funções serverless
export * from './functions';

// Tratamento de erros
export * from './error-handler';

// Tipos
export * from './database.types';