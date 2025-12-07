import { defineConfig } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

export default defineConfig({
  testDir: '.',
  testMatch: ['**/app/e2e-playwright/**/*.spec.ts', '**/app/e2e/**/*.spec.ts', '**/app/tests/e2e/**/*.spec.ts'],
  // Global setup/teardown desabilitado - servidor roda manualmente
  // globalSetup: '../tests/global-setup.ts',
  // globalTeardown: '../tests/global-teardown.ts',
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
