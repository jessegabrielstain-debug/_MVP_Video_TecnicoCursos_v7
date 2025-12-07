import { defineConfig } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from estudio_ia_videos/.env.local
dotenv.config({ path: path.resolve(process.cwd(), 'estudio_ia_videos', '.env.local') });

export default defineConfig({
  testDir: '.',
  testMatch: ['**/tests/e2e/**/*.spec.ts', '**/tests/e2e/**/*.test.ts', '**/app/e2e-playwright/**/*.spec.ts'],
  globalSetup: './tests/global-setup.ts',
  globalTeardown: './tests/global-teardown.ts',
  timeout: 60000,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry'
  },
  webServer: process.env.E2E_SKIP_SERVER ? undefined : {
    command: 'cd estudio_ia_videos && npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 90000
  },
  reporter: [ ['list'], ['html', { outputFolder: 'evidencias/fase-2/playwright-report' }] ]
});