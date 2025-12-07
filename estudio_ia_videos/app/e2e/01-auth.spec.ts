import { test, expect } from '@playwright/test';

/**
 * E2E Tests - Authentication Flow
 * 
 * Testes de autenticação: login, signup, logout
 */

// Credenciais de teste
const TEST_USER = {
  email: 'test@example.com',
  password: 'Test@12345',
  name: 'Test User',
};

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Limpar cookies e storage antes de cada teste
    await page.context().clearCookies();
    await page.goto('/');
  });

  // ==========================================
  // LOGIN
  // ==========================================

  test('should display login page', async ({ page }) => {
    await page.goto('/login');
    
    // Verificar elementos da página
    await expect(page.locator('h1')).toContainText('Login');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should show validation errors for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    
    // Tentar login sem preencher campos
    await page.click('button[type="submit"]');
    
    // Verificar mensagens de erro
    await expect(page.locator('text=Email é obrigatório')).toBeVisible();
    await expect(page.locator('text=Senha é obrigatória')).toBeVisible();
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    await page.goto('/login');
    
    // Preencher formulário
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);
    
    // Submeter
    await page.click('button[type="submit"]');
    
    // Aguardar redirecionamento para dashboard
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    
    // Verificar que está logado
    await expect(page).toHaveURL(/dashboard/);
    await expect(page.locator('text=Dashboard')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    
    // Preencher com credenciais inválidas
    await page.fill('input[type="email"]', 'wrong@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    
    // Submeter
    await page.click('button[type="submit"]');
    
    // Verificar mensagem de erro
    await expect(page.locator('text=Credenciais inválidas')).toBeVisible({
      timeout: 5000,
    });
  });

  // ==========================================
  // SIGNUP
  // ==========================================

  test('should display signup page', async ({ page }) => {
    await page.goto('/signup');
    
    // Verificar elementos
    await expect(page.locator('h1')).toContainText('Criar Conta');
    await expect(page.locator('input[name="name"]')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('should validate password strength', async ({ page }) => {
    await page.goto('/signup');
    
    // Senha fraca
    await page.fill('input[type="password"]', '123');
    await page.locator('input[type="password"]').blur();
    
    // Verificar erro
    await expect(page.locator('text=Senha muito fraca')).toBeVisible();
  });

  test('should signup successfully with valid data', async ({ page }) => {
    await page.goto('/signup');
    
    // Gerar email único para evitar conflitos
    const uniqueEmail = `test-${Date.now()}@example.com`;
    
    // Preencher formulário
    await page.fill('input[name="name"]', TEST_USER.name);
    await page.fill('input[type="email"]', uniqueEmail);
    await page.fill('input[type="password"]', TEST_USER.password);
    
    // Submeter
    await page.click('button[type="submit"]');
    
    // Aguardar confirmação ou redirecionamento
    await expect(
      page.locator('text=Conta criada com sucesso')
    ).toBeVisible({ timeout: 10000 });
  });

  // ==========================================
  // LOGOUT
  // ==========================================

  test('should logout successfully', async ({ page }) => {
    // Fazer login primeiro
    await page.goto('/login');
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    
    // Aguardar dashboard
    await page.waitForURL('**/dashboard');
    
    // Clicar em logout
    await page.click('button[aria-label="Menu de usuário"]');
    await page.click('text=Sair');
    
    // Verificar redirecionamento para login
    await page.waitForURL('**/login');
    await expect(page).toHaveURL(/login/);
  });

  // ==========================================
  // OAUTH (Mock)
  // ==========================================

  test('should display OAuth buttons', async ({ page }) => {
    await page.goto('/login');
    
    // Verificar botões OAuth
    await expect(page.locator('text=Continuar com Google')).toBeVisible();
    await expect(page.locator('text=Continuar com GitHub')).toBeVisible();
  });

  // ==========================================
  // PROTECTED ROUTES
  // ==========================================

  test('should redirect to login when accessing protected route', async ({ page }) => {
    // Tentar acessar dashboard sem login
    await page.goto('/dashboard');
    
    // Deve redirecionar para login
    await page.waitForURL('**/login');
    await expect(page).toHaveURL(/login/);
  });

  test('should persist session after page reload', async ({ page }) => {
    // Fazer login
    await page.goto('/login');
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    
    // Aguardar dashboard
    await page.waitForURL('**/dashboard');
    
    // Recarregar página
    await page.reload();
    
    // Verificar que ainda está logado
    await expect(page).toHaveURL(/dashboard/);
    await expect(page.locator('text=Dashboard')).toBeVisible();
  });

  // ==========================================
  // PASSWORD RECOVERY
  // ==========================================

  test('should display forgot password link', async ({ page }) => {
    await page.goto('/login');
    
    // Verificar link
    await expect(page.locator('text=Esqueceu a senha?')).toBeVisible();
  });

  test('should navigate to password recovery page', async ({ page }) => {
    await page.goto('/login');
    
    // Clicar no link
    await page.click('text=Esqueceu a senha?');
    
    // Verificar navegação
    await page.waitForURL('**/forgot-password');
    await expect(page.locator('h1')).toContainText('Recuperar Senha');
  });

  test('should send password recovery email', async ({ page }) => {
    await page.goto('/forgot-password');
    
    // Preencher email
    await page.fill('input[type="email"]', TEST_USER.email);
    
    // Submeter
    await page.click('button[type="submit"]');
    
    // Verificar mensagem de sucesso
    await expect(
      page.locator('text=Email de recuperação enviado')
    ).toBeVisible({ timeout: 5000 });
  });
});
