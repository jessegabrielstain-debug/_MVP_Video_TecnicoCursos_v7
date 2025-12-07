import path from 'path';
import { Buffer } from 'buffer';
import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { PPTXPage } from './pages/PPTXPage';
import { SystemControlPage } from './pages/SystemControlPage';
import { 
  dashboardStatsFixture, 
  authSuccessResponse, 
  sessionSuccessResponse, 
  authErrorResponse 
} from './fixtures/mock-data';

const SUPABASE_AUTH_ROUTE = '**/auth/v1/token*grant_type=password*';
const SUPABASE_SESSION_ROUTE = '**/auth/v1/user';

test.beforeEach(async ({ page }) => {
  // Stabilize random generation for consistent snapshots/visuals if needed
  await page.addInitScript(() => {
    Math.random = () => 0.5;
  });
});

test.describe.serial('Full regression journey', () => {
  
  test('landing CTA routes to dashboard and stats hydrate', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);

    await page.route('**/api/dashboard/unified-stats', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify(dashboardStatsFixture),
        headers: { 'content-type': 'application/json' }
      });
    });

    await page.goto('/');
    await expect(page.getByRole('heading', { name: /Transforme PPTX/i })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Começar Agora' }).first()).toBeVisible();

    await page.getByRole('button', { name: 'Começar Agora' }).first().click();
    
    await dashboardPage.expectLoaded();
    await dashboardPage.expectStats('12', '3');

    await dashboardPage.navigateToTemplates();
    await dashboardPage.navigateToOverview();
  });

  test('login page validation surfaces errors and reason banner', async ({ page }) => {
    const loginPage = new LoginPage(page);
    
    await loginPage.goto('?reason=unauthorized');
    await loginPage.expectErrorMessage('Sessão expirada ou inválida. Por favor, faça login novamente.');

    await loginPage.submitButton.click();
    await loginPage.expectValidationErrors();

    await loginPage.emailInput.fill('invalid-email');
    await loginPage.passwordInput.fill('123');
    await loginPage.submitButton.click();

    await loginPage.expectValidationErrors();
    await expect(loginPage.forgotPasswordLink).toBeVisible();
  });

  test('login success redirects to dashboard', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);

    await page.route(SUPABASE_AUTH_ROUTE, async (route) => {
      await route.fulfill({
        status: 200,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(authSuccessResponse)
      });
    });

    await page.route(SUPABASE_SESSION_ROUTE, async (route) => {
      await route.fulfill({
        status: 200,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(sessionSuccessResponse)
      });
    });

    await page.route('**/api/dashboard/unified-stats', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify(dashboardStatsFixture),
        headers: { 'content-type': 'application/json' }
      });
    });

    await loginPage.goto();
    await loginPage.login('pro@example.com', 'supersecure');

    await dashboardPage.expectLoaded();
    await dashboardPage.expectStats('12', '3'); // Check specific stats to ensure hydration
  });

  test('login surfaces API rejection error', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await page.route(SUPABASE_AUTH_ROUTE, async (route) => {
      await route.fulfill({
        status: 400,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(authErrorResponse)
      });
    });

    await loginPage.goto();
    await loginPage.login('pro@example.com', 'supersecure');

    await loginPage.expectErrorMessage('Email ou senha incorretos. Tente novamente.');
  });

  test('pptx upload handles success path', async ({ page }) => {
    const pptxPage = new PPTXPage(page);

    await page.route('**/api/pptx/upload', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ jobId: 'test-job' }),
        headers: { 'content-type': 'application/json' }
      });
    });

    await pptxPage.goto();
    await pptxPage.expectLoaded();

    await pptxPage.uploadFile(path.resolve('tests/e2e/fixtures/sample.pptx'));
    await pptxPage.startProcessing();
    
    await pptxPage.expectSuccessMessage();
  });

  test('pptx upload surfaces API error message', async ({ page }) => {
    const pptxPage = new PPTXPage(page);

    await page.route('**/api/pptx/upload', async (route) => {
      await route.fulfill({
        status: 400,
        body: JSON.stringify({ error: 'Invalid file sent' }),
        headers: { 'content-type': 'application/json' }
      });
    });

    await pptxPage.goto();
    await pptxPage.uploadFile(path.resolve('tests/e2e/fixtures/invalid.pptx'));
    await pptxPage.startProcessing();

    await pptxPage.expectErrorMessage('Erro: Invalid file sent');
  });

  test('pptx upload enforces pptx-only validation client-side', async ({ page }) => {
    const pptxPage = new PPTXPage(page);
    await pptxPage.goto();
    await pptxPage.uploadFile(path.resolve('tests/e2e/fixtures/invalid.txt'));
    await pptxPage.expectErrorMessage('Por favor, selecione um arquivo .pptx válido');
  });

  test('pptx upload blocks files larger than 50MB', async ({ page }) => {
    const pptxPage = new PPTXPage(page);
    await pptxPage.goto();
    
    await pptxPage.uploadBuffer(
      'oversized.pptx',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      Buffer.alloc(51 * 1024 * 1024)
    );
    
    await pptxPage.expectErrorMessage('Arquivo excede o limite de 50MB');
  });

  test('render dashboard new project focuses timeline module', async ({ page }) => {
    await page.goto('/dashboard/render');
    await expect(page.getByRole('heading', { name: 'Render Dashboard' })).toBeVisible();

    await page.getByRole('button', { name: 'Novo Projeto' }).click();
    await expect(page.getByRole('tab', { name: 'Timeline Editor', pressed: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Meu Projeto PPTX' })).toBeVisible();
  });

  test('system control tabs switch views and manual refresh works', async ({ page }) => {
    const systemPage = new SystemControlPage(page);
    
    await systemPage.goto();
    await systemPage.expectLoaded();

    await systemPage.openValidationTab();
    await systemPage.runValidation();

    await systemPage.openConfigTab();
    await systemPage.openMonitoringTabAndRefresh();
  });
});
