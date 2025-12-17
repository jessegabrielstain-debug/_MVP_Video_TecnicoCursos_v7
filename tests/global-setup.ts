/**
 * Playwright Global Setup
 * Runs once before all tests to prepare the test environment
 */

import { FullConfig } from '@playwright/test';

async function globalSetup(_config: FullConfig) {
  console.log('🚀 Starting global setup...');
  
  // Verificar variáveis de ambiente necessárias
  const requiredEnvVars = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'];
  const missingVars = requiredEnvVars.filter(v => !process.env[v]);
  
  if (missingVars.length > 0) {
    console.warn(`⚠️ Missing env vars: ${missingVars.join(', ')}`);
  }
  
  console.log('✅ Global setup complete');
}

export default globalSetup;
