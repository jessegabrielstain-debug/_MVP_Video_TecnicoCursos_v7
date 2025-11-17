/**
 * Playwright Global Teardown
 * Runs once after all tests to cleanup the test environment
 */

import { FullConfig } from '@playwright/test';
import { cleanupTestUsers } from './e2e/auth-helpers';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting global teardown...');

  // Cleanup test users (optional - comment out if you want to keep users)
  // console.log('🗑️  Cleaning up test users...');
  // await cleanupTestUsers();

  console.log('✅ Global teardown complete');
}

export default globalTeardown;
