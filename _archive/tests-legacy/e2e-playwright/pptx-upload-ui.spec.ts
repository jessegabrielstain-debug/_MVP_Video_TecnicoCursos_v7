/**
 * 🎭 Playwright E2E Tests - PPTX Upload UI
 * 
 * Testa o fluxo completo de criação de projeto PPTX e upload:
 * 1. Login
 * 2. Criação de projeto via Dashboard
 * 3. Redirecionamento para Editor PPTX
 * 4. Upload de arquivo
 * 5. Processamento e Sucesso
 */

import { test, expect } from '@playwright/test';
import path from 'path';
import { loginAsAdmin } from '../e2e/helpers';

test.describe('PPTX Upload - Fluxo Completo', () => {
  test.beforeEach(async ({ page }) => {
    // Login como admin usando injeção de sessão (mais rápido e confiável)
    await loginAsAdmin(page);
    
    // Garantir que estamos no dashboard
    await page.goto('/dashboard');
    
    // Force prevent tour (just in case)
    await page.evaluate(() => {
      localStorage.setItem('hasSeenTour', 'true');
    });
    
    // Reload to apply the localStorage change
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test('deve criar projeto PPTX e fazer upload com sucesso', async ({ page }) => {
    // Listen to console logs
    page.on('console', msg => console.log(`Browser Console: ${msg.text()}`));

    // Verify localStorage
    const hasSeenTour = await page.evaluate(() => localStorage.getItem('hasSeenTour'));
    console.log('🔍 localStorage.hasSeenTour:', hasSeenTour);

    // Debug: Verificar se há overlays ou dialogs abertos
    const dialogs = page.locator('div[role="dialog"], div[data-state="open"]');
    if (await dialogs.count() > 0) {
      console.log('⚠️ Detectados dialogs/overlays abertos:', await dialogs.count());
    }

    // Handle Welcome Modal specifically
    const welcomeHeading = page.locator('text=Bem-vindo ao Estúdio IA! 👋');
    if (await welcomeHeading.isVisible()) {
      console.log('👋 Welcome modal detected, closing...');
      
      // Force remove via DOM manipulation
      await page.evaluate(() => {
        const headings = Array.from(document.querySelectorAll('h2'));
        const welcome = headings.find(h => h.textContent?.includes('Bem-vindo ao Estúdio IA!'));
        if (welcome) {
            // Find the dialog overlay/content and remove it
            const dialog = welcome.closest('[role="dialog"]') || welcome.closest('.fixed');
            if (dialog) dialog.remove();
        }
      });
      
      // Short wait
      await page.waitForTimeout(500);

      // Fallback: Try "Pular Tour" if still there
      const skipButton = page.locator('button:has-text("Pular Tour")');
      if (await skipButton.isVisible()) {
        await skipButton.click();
      } else {
        await page.keyboard.press('Escape');
      }
      await expect(welcomeHeading).toBeHidden({ timeout: 5000 });
      console.log('👋 Welcome modal closed');
    }

    // Verificar se há algum modal de boas-vindas ou erro e fechar se necessário
    const closeDialog = page.locator('button[aria-label="Close"], button:has-text("Fechar"), button:has-text("Close")');
    if (await closeDialog.isVisible()) {
      await closeDialog.first().click();
    }

    // 1. Identificar e clicar no botão de criar projeto (Dashboard ou Empty State)
    console.log('📍 Título da página:', await page.title());
    console.log('📍 Headings:', await page.locator('h1, h2').allInnerTexts());

    const createButton = page.locator('button:has-text("Create Project")')
      .or(page.locator('button:has-text("Criar Primeiro Projeto Agora")'))
      .or(page.locator('button:has-text("Criar Projeto")')); // Fallback
    
    await expect(createButton.first()).toBeVisible({ timeout: 10000 });
    console.log('✅ Botão "Create Project" encontrado, tentando clicar...');
    
    await createButton.first().click({ force: true });
    console.log('✅ Clique realizado (forçado)');

    // 2. Preencher modal de criação
    console.log('⏳ Aguardando modal "Novo Projeto"...');
    await expect(page.locator('text=Novo Projeto')).toBeVisible();
    console.log('✅ Modal aberto');
    
    const projectName = `Projeto PPTX Teste ${Date.now()}`;
    await page.fill('input[id="name"]', projectName);
    console.log('✅ Nome preenchido');
    
    // Selecionar tipo PPTX
    await page.click('text=Importar PPTX');
    console.log('✅ Tipo PPTX selecionado');
    
    // Confirmar criação
    const submitButton = page.locator('button:has-text("Criar Projeto")').last();
    await submitButton.click();
    console.log('✅ Botão Criar clicado');

    // Verificar estado de loading
    await expect(page.locator('text=Criando...')).toBeVisible({ timeout: 5000 }).catch(() => {
      console.log('⚠️ Aviso: Estado "Criando..." não detectado (pode ter sido muito rápido)');
    });

    // 3. Aguardar redirecionamento para editor PPTX
    console.log('⏳ Aguardando redirecionamento...');
    // Aumentar timeout para 30s
    await page.waitForURL(/\/editor\/pptx\/.*/, { timeout: 30000 });
    console.log('✅ Redirecionamento concluído para:', page.url());
    
    // Verificar que estamos na página correta
    await expect(page.locator('text=Upload')).toBeVisible();

    // 4. Fazer upload do arquivo
    console.log('📂 Iniciando upload do arquivo...');
    
    // Verificar se estamos na página correta antes do upload
    await expect(page.locator('text=PPTX Studio')).toBeVisible();
    await expect(page.locator('text=Faça upload do seu PPTX')).toBeVisible();

    const testFile = path.join(__dirname, '../__tests__/pptx/fixtures/with-metadata.pptx');
    const fileInput = page.locator('input[type="file"]');
    
    // React-dropzone cria um input hidden. setInputFiles funciona mesmo assim.
    // Garantir que o input existe no DOM
    await expect(fileInput).toBeAttached();
    
    await fileInput.setInputFiles(testFile);
    console.log('✅ Arquivo definido via setInputFiles');

    // 5. Verificar estados de progresso
    // O componente PPTXUploader simula o progresso visualmente
    console.log('⏳ Aguardando estado de upload...');
    await expect(page.locator('text=Fazendo Upload...')).toBeVisible({ timeout: 10000 });
    console.log('✅ Estado "Fazendo Upload..." detectado');
    
    await expect(page.locator('text=Processando PPTX...')).toBeVisible({ timeout: 15000 });
    console.log('✅ Estado "Processando PPTX..." detectado');
    
    // 6. Verificar conclusão e transição para o editor
    // Nota: O componente Uploader é desmontado quando o upload termina, 
    // então verificamos se a interface do editor foi carregada.
    console.log('⏳ Aguardando transição para o editor...');
    
    // Verificar título do projeto mockado
    const projectTitle = page.locator('text=Treinamento NR-35 - Trabalho em Altura');
    await expect(projectTitle).toBeVisible({ timeout: 30000 });
    console.log('✅ Projeto carregado e editor exibido!');
    
    // Verificar elementos do editor
    await expect(page.getByRole('heading', { name: 'Slides' })).toBeVisible();
    await expect(page.locator('button:has-text("Exportar para Timeline")')).toBeVisible();
    
    console.log('✅ Teste finalizado com sucesso!');
  });
});
