import { test, expect } from '@playwright/test';

test.describe('Avatar Studio - E2E', () => {
  
  test.beforeEach(async ({ page }) => {
    // Mock authentication if necessary, or just navigate if public/dev
    // Assuming dev environment where we might not need strict auth for this test or we can bypass
    // For now, we'll just navigate. If auth is needed, we'd use a helper.
    await page.goto('/editor/avatars');
  });

  test('should display all main UI components', async ({ page }) => {
    await expect(page.getByText('Avatar Studio (Real)')).toBeVisible();
    await expect(page.getByText('Configuração')).toBeVisible();
    await expect(page.getByText('Resultado')).toBeVisible();
    
    // Check inputs
    await expect(page.getByText('Avatar (D-ID)')).toBeVisible();
    await expect(page.getByText('Voz (ElevenLabs)')).toBeVisible();
    await expect(page.getByPlaceholder('Digite o texto que o avatar deve falar...')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Gerar Vídeo' })).toBeVisible();
  });

  test('should generate video successfully (mocked)', async ({ page }) => {
    // Mock the API response
    await page.route('/api/lip-sync', async route => {
      const json = { url: 'https://example.com/video.mp4' };
      await route.fulfill({ json });
    });

    // Fill inputs
    // Note: Select components in Shadcn UI are tricky to test with standard HTML selects
    // We might need to click the trigger and then the item.
    
    // Select Avatar (Default is Matt, let's change to Amy)
    // await page.getByRole('combobox').first().click(); // This might be ambiguous
    // Let's just use the text input for now as it's reliable
    
    await page.getByPlaceholder('Digite o texto que o avatar deve falar...').fill('Olá, este é um teste de automação.');

    // Click Generate
    await page.getByRole('button', { name: 'Gerar Vídeo' }).click();

    // Verify Loading State
    await expect(page.getByText('Processando...')).toBeVisible();
    await expect(page.getByText('Iniciando processo...')).toBeVisible();

    // Verify Success State
    await expect(page.getByText('Concluído!')).toBeVisible();
    
    // Verify Video Player
    const video = page.locator('video');
    await expect(video).toBeVisible();
    await expect(video).toHaveAttribute('src', 'https://example.com/video.mp4');
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock error response
    await page.route('/api/lip-sync', async route => {
      await route.fulfill({ 
        status: 500, 
        json: { error: 'Falha na API externa' } 
      });
    });

    await page.getByPlaceholder('Digite o texto que o avatar deve falar...').fill('Texto para erro.');
    await page.getByRole('button', { name: 'Gerar Vídeo' }).click();

    // Verify Error Message
    await expect(page.getByText('Erro', { exact: true })).toBeVisible(); // Status badge
    await expect(page.getByText('Falha na API externa')).toBeVisible(); // Alert description
  });

  test('should validate empty input', async ({ page }) => {
    // Button should be disabled or show error if text is empty
    // The component has `disabled={isLoading || !text}`
    const button = page.getByRole('button', { name: 'Gerar Vídeo' });
    await expect(button).toBeDisabled();

    // Type something
    await page.getByPlaceholder('Digite o texto que o avatar deve falar...').fill('A');
    await expect(button).toBeEnabled();
  });
});
