/**
 * Playwright Global Teardown
 * Runs once after all tests to clean up the test environment
 */

import { FullConfig } from '@playwright/test';

async function globalTeardown(_config: FullConfig) {
  console.log('🧹 Starting global teardown...');
  
  // Cleanup de recursos de teste se necessário
  
  console.log('✅ Global teardown complete');
}

export default globalTeardown;
