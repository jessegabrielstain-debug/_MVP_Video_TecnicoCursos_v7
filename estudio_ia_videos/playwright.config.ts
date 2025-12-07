import { defineConfig } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

export default defineConfig({
  testDir: '.',
  testMatch: ['**/app/e2e-playwright/**/*.spec.ts', '**/app/e2e/**/*.spec.ts'],
  // Skip global setup/teardown if they depend on root files we can't easily access or just rely on manual setup
  // If ../tests exists, we can try using it
  globalSetup: '../tests/global-setup.ts',
  globalTeardown: '../tests/global-teardown.ts',
  timeout: 60000,
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120000,
  },
  reporter: 'list'
});
