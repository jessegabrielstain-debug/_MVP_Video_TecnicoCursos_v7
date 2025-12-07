/**
 * Playwright Global Setup
 * Runs once before all tests to prepare the test environment
 */

import { chromium, FullConfig } from '@playwright/test';
import { setupTestUsers } from './e2e/auth-helpers';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global setup...');

  // Setup test users in Supabase
  console.log('📝 Creating test users...');
  await setupTestUsers();

  // Optional: Start the dev server if not already running
  // This assumes you have a script to start the server
  // You can use `@playwright/test` built-in webServer config instead

  // Optional: Seed test data
  console.log('🌱 Seeding test data...');
  // await seedTestData();

  console.log('✅ Global setup complete');
}

export default globalSetup;
