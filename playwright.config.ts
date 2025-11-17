import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
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