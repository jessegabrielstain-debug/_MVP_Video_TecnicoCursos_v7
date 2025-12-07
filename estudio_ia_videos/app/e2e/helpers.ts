// TODO: Fixar return type async function Promise<string>
/**
 * E2E Test Helpers
 *
 * Funções auxiliares para testes E2E
 */

import { Page, expect } from '@playwright/test';

// ==========================================
// AUTHENTICATION HELPERS
// ==========================================

export const TEST_USERS = {
  admin: {
    email: 'test-admin@tecnicocursos.local',
    password: 'Admin@Test2024!',
    role: 'admin',
  },
} as const;

export async function loginAsAdmin(page: Page) {
  await page.goto('/login');

  // Prevent Welcome Tour
  await page.evaluate(() => {
    localStorage.setItem('hasSeenTour', 'true');
  });
  
  // Preencher formulário
  await page.fill('input[name="email"]', TEST_USERS.admin.email);
  await page.fill('input[name="password"]', TEST_USERS.admin.password);
  
  // Clicar em Entrar
  await page.click('button[type="submit"]');
  
  // Aguardar redirecionamento para dashboard
  // Aumentar timeout pois o primeiro login pode ser lento (compilação)
  await page.waitForURL('**/dashboard', { timeout: 30000 });
  
  // Verificar se carregou
  await page.waitForLoadState('networkidle');
  console.log(`✅ Logged in as: ${TEST_USERS.admin.email}`);
}

export async function login(page: Page, email: string = 'test@example.com', password: string = 'Test@12345') {
  await page.goto('/login');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 10000 });
}

export async function logout(page: Page) {
  await page.click('button[aria-label="Menu de usuário"]');
  await page.click('text=Sair');
  await page.waitForURL('**/login');
}

export async function isLoggedIn(page: Page): Promise<boolean> {
  try {
    await expect(page.locator('text=Dashboard')).toBeVisible({ timeout: 3000 });
    return true;
  } catch {
    return false;
  }
}

// ==========================================
// NAVIGATION HELPERS
// ==========================================

export async function navigateTo(page: Page, route: string) {
  await page.goto(route);
  await page.waitForLoadState('networkidle');
}

export async function waitForNavigation(page: Page, urlPattern: string | RegExp, timeout: number = 10000) {
  await page.waitForURL(urlPattern, { timeout });
}

// ==========================================
// UPLOAD HELPERS
// ==========================================

export async function uploadFile(page: Page, filePath: string) {
  await page.goto('/dashboard/upload');
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles(filePath);
  
  // Aguardar upload
  await expect(page.locator('text=Upload em progresso')).toBeVisible();
  await expect(page.locator('text=Upload concluído')).toBeVisible({ timeout: 30000 });
  
  // Retornar URL do projeto
  await page.waitForURL('**/dashboard/projects/*', { timeout: 10000 });
  return page.url();
}

export function getProjectIdFromUrl(url: string): string {
  const parts = url.split('/');
  return parts[parts.length - 1];
}

// ==========================================
// TTS HELPERS
// ==========================================

export async function selectVoice(page: Page, voiceName?: string) {
  await page.click('button:has-text("Selecione uma voz")');
  
  if (voiceName) {
    await page.click(`text=${voiceName} >> [role="option"]`);
  } else {
    await page.click('[role="option"]:first-child');
  }
}

export async function generateTTSForSlide(page: Page, slideNumber: number) {
  await page.click(`[data-testid="slide-${slideNumber}"]`);
  await page.click('button:has-text("Gerar Áudio")');
  
  await expect(page.locator('text=Áudio gerado com sucesso')).toBeVisible({
    timeout: 30000,
  });
}

export async function generateTTSForAllSlides(page: Page) {
  await page.click('button:has-text("Gerar para Todos os Slides")');
  await page.click('button:has-text("Confirmar")');
  
  await expect(page.locator('text=Todos os áudios gerados')).toBeVisible({
    timeout: 120000,
  });
}

export async function hasAudioForSlide(page: Page, slideNumber: number): Promise<boolean> {
  try {
    await expect(page.locator(`audio[data-slide="${slideNumber}"]`)).toBeAttached({ timeout: 2000 });
    return true;
  } catch {
    return false;
  }
}

// ==========================================
// RENDER HELPERS
// ==========================================

export async function configureRender(
  page: Page,
  options: {
    resolution?: '720p' | '1080p' | '2160p';
    quality?: 'low' | 'medium' | 'high';
    format?: 'mp4' | 'webm';
    transitions?: boolean;
    watermark?: boolean;
  } = {}
) {
  await page.click('button:has-text("Renderizar Vídeo")');
  
  // Aguardar painel abrir
  await expect(page.locator('h2:has-text("Configuração de Vídeo")')).toBeVisible();
  
  // Configurar resolução
  if (options.resolution) {
    await page.click(`label:has-text("${options.resolution}")`);
  }
  
  // Configurar qualidade
  if (options.quality) {
    const qualityLabels = {
      low: 'Baixa',
      medium: 'Média',
      high: 'Alta',
    };
    await page.click(`label:has-text("${qualityLabels[options.quality]}")`);
  }
  
  // Configurar formato
  if (options.format) {
    await page.click(`label:has-text("${options.format.toUpperCase()}")`);
  }
  
  // Configurar transições
  if (options.transitions !== undefined) {
    const checkbox = page.locator('input[type="checkbox"][name="transitions"]');
    const isChecked = await checkbox.isChecked();
    
    if ((options.transitions && !isChecked) || (!options.transitions && isChecked)) {
      await checkbox.click();
    }
  }
  
  // Configurar watermark
  if (options.watermark !== undefined) {
    const checkbox = page.locator('input[type="checkbox"][name="watermark"]');
    const isChecked = await checkbox.isChecked();
    
    if ((options.watermark && !isChecked) || (!options.watermark && isChecked)) {
      await checkbox.click();
    }
  }
}

export async function startRender(page: Page) {
  await page.click('button:has-text("Iniciar Renderização")');
  
  await expect(page.locator('text=Renderização iniciada')).toBeVisible();
  await expect(page.locator('h2:has-text("Renderizando Vídeo")')).toBeVisible({
    timeout: 5000,
  });
}

export async function waitForRenderCompletion(page: Page, timeout: number = 300000) {
  await expect(page.locator('text=Renderização concluída!')).toBeVisible({ timeout });
}

export async function cancelRender(page: Page) {
  await page.click('button:has-text("Cancelar Renderização")');
  await page.click('button:has-text("Sim, Cancelar")');
  
  await expect(page.locator('text=Renderização cancelada')).toBeVisible({
    timeout: 5000,
  });
}

// ==========================================
// WAIT HELPERS
// ==========================================

export async function waitForElement(page: Page, selector: string, timeout: number = 10000) {
  await page.waitForSelector(selector, { timeout, state: 'visible' });
}

export async function waitForText(page: Page, text: string, timeout: number = 10000) {
  await expect(page.locator(`text=${text}`)).toBeVisible({ timeout });
}

export async function waitForUrl(page: Page, urlPattern: string | RegExp, timeout: number = 10000) {
  await page.waitForURL(urlPattern, { timeout });
}

// ==========================================
// DOWNLOAD HELPERS
// ==========================================

export async function downloadFile(page: Page, buttonText: string) {
  const downloadPromise = page.waitForEvent('download');
  await page.click(`button:has-text("${buttonText}")`);
  const download = await downloadPromise;
  return download;
}

export async function downloadAndSave(page: Page, buttonText: string, savePath: string) {
  const download = await downloadFile(page, buttonText);
  await download.saveAs(savePath);
  return download.suggestedFilename();
}

// ==========================================
// ASSERTION HELPERS
// ==========================================

export async function assertTextVisible(page: Page, text: string) {
  await expect(page.locator(`text=${text}`)).toBeVisible();
}

export async function assertElementVisible(page: Page, selector: string) {
  await expect(page.locator(selector)).toBeVisible();
}

export async function assertUrlContains(page: Page, pattern: string) {
  await expect(page).toHaveURL(new RegExp(pattern));
}

export async function assertElementCount(page: Page, selector: string, count: number) {
  await expect(page.locator(selector)).toHaveCount(count);
}

// ==========================================
// MOCK HELPERS
// ==========================================

export async function mockApiResponse(
  page: Page,
  endpoint: string,
  response: any,
  status: number = 200
) {
  await page.route(`**${endpoint}`, (route) => {
    route.fulfill({
      status,
      body: JSON.stringify(response),
    });
  });
}

export async function mockApiError(page: Page, endpoint: string, errorMessage: string = 'Error') {
  await page.route(`**${endpoint}`, (route) => {
    route.fulfill({
      status: 500,
      body: JSON.stringify({ error: errorMessage }),
    });
  });
}

export async function mockNetworkError(page: Page, endpoint: string) {
  await page.route(`**${endpoint}`, (route) => {
    route.abort('failed');
  });
}

export async function clearMocks(page: Page) {
  await page.unrouteAll();
}

// ==========================================
// SCREENSHOT HELPERS
// ==========================================

export async function takeScreenshot(page: Page, name: string) {
  await page.screenshot({ path: `screenshots/${name}.png`, fullPage: true });
}

export async function takeScreenshotOnError(page: Page, testName: string) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  await page.screenshot({
    path: `screenshots/error-${testName}-${timestamp}.png`,
    fullPage: true,
  });
}

// ==========================================
// UTILITY HELPERS
// ==========================================

export function generateUniqueEmail(): string {
  const timestamp = Date.now();
  return `test-${timestamp}@example.com`;
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function scrollToElement(page: Page, selector: string) {
  await page.locator(selector).scrollIntoViewIfNeeded();
}

export async function hoverElement(page: Page, selector: string) {
  await page.hover(selector);
}

// ==========================================
// ANALYTICS HELPERS
// ==========================================

export async function getMetricValue(page: Page, metricName: string): Promise<string> {
  await page.goto('/dashboard/metrics');
  const element = page.locator(`text=${metricName}`).locator('..').locator('[data-testid="metric-value"]');
  return await element.textContent() || '0';
}

export async function verifyAnalytics(page: Page, expectedMetrics: Record<string, number>) {
  await page.goto('/dashboard/metrics');
  
  for (const [metric, expectedValue] of Object.entries(expectedMetrics)) {
    const value = await getMetricValue(page, metric);
    const numericValue = parseInt(value.replace(/[^0-9]/g, ''));
    expect(numericValue).toBeGreaterThanOrEqual(expectedValue);
  }
}

// ==========================================
// PROJECT HELPERS
// ==========================================

export async function createProject(page: Page, pptxPath: string): Promise<string> {
  const projectUrl = await uploadFile(page, pptxPath);
  return getProjectIdFromUrl(projectUrl);
}

export async function deleteProject(page: Page, projectId: string) {
  await page.goto(`/dashboard/projects/${projectId}`);
  await page.click('button[aria-label="Menu do projeto"]');
  await page.click('text=Excluir Projeto');
  await page.click('button:has-text("Confirmar Exclusão")');
  
  await expect(page.locator('text=Projeto excluído')).toBeVisible();
}

export async function getProjectList(page: Page): Promise<string[]> {
  await page.goto('/dashboard/projects');
  
  const projectElements = page.locator('[data-testid^="project-"]');
  const count = await projectElements.count();
  
  const projectIds: string[] = [];
  for (let i = 0; i < count; i++) {
    const id = await projectElements.nth(i).getAttribute('data-testid');
    if (id) {
      projectIds.push(id.replace('project-', ''));
    }
  }
  
  return projectIds;
}
