/**
 * 🧪 Testes E2E - Editor Flow
 * Testes automatizados para validar o fluxo completo do editor
 */

import { test, expect, Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';

// Configurações
const DEMO_PPTX_PATH = path.join(process.cwd(), 'public/test-assets/demo.pptx');
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Editor Flow - Completo', () => {
  test.beforeEach(async ({ page }) => {
    // Configurar interceptors para APIs
    await page.route('**/api/v1/pptx/**', async route => {
      const request = route.request();
      console.log(`🌐 API Call: ${request.method()} ${request.url()}`);
      route.continue();
    });
  });

  test('TestUploadPPTX → JSON estruturado', async ({ page }) => {
    console.log('🧪 [Test 1] Testando upload PPTX e geração de JSON...');

    // 1. Navegar para o editor
    await page.goto(`${BASE_URL}/editor-animaker`);
    await expect(page).toHaveTitle(/Estúdio IA/);

    // 2. Verificar se área de upload está visível
    await expect(page.locator('[data-testid="pptx-uploader"]')).toBeVisible();

    // 3. Upload do arquivo PPTX
    const fileInput = page.locator('input[type="file"]');
    
    // Criar arquivo PPTX de teste se não existir
    if (!fs.existsSync(DEMO_PPTX_PATH)) {
      await createDemoPPTX();
    }

    await fileInput.setInputFiles(DEMO_PPTX_PATH);

    // 4. Aguardar processamento
    await page.waitForSelector('[data-testid="analysis-complete"]', { timeout: 30000 });

    // 5. Verificar estatísticas de processamento
    const stats = page.locator('[data-testid="processing-stats"]');
    await expect(stats).toBeVisible();

    const slidesCount = await stats.locator('[data-stat="slides"]').textContent();
    const elementsCount = await stats.locator('[data-stat="elements"]').textContent();

    console.log(`✅ Upload processado: ${slidesCount} slides, ${elementsCount} elementos`);

    // 6. Validar que temos elementos editáveis (não apenas imagens)
    const editableElements = await stats.locator('[data-stat="editable-elements"]').textContent();
    const editableCount = parseInt(editableElements || '0');

    expect(editableCount).toBeGreaterThan(0);
    console.log(`✅ Elementos editáveis encontrados: ${editableCount}`);

    // 7. Continuar para o editor
    await page.click('[data-testid="open-editor-btn"]');
    await page.waitForURL('**/editor-animaker**');
    
    console.log('✅ [Test 1] Upload PPTX e JSON estruturado - PASSOU');
  });

  test('TestEditorCanvas → Objetos editáveis', async ({ page }) => {
    console.log('🧪 [Test 2] Testando canvas editor e objetos editáveis...');

    // Partir do estado após upload (pode usar mock data)
    await page.goto(`${BASE_URL}/editor-animaker`);
    
    // Simular dados de teste carregados
    await page.evaluate(() => {
      (window as any).testData = {
        slides: [
          {
            id: 'slide-1',
            index: 1,
            title: 'Slide Teste',
            layout: 'blank',
            duration: 5,
            elements: [
              {
                id: 'text-1',
                type: 'text',
                content: 'Texto de Teste',
                x: 100,
                y: 100,
                width: 200,
                height: 50,
                zIndex: 1,
                visible: true,
                locked: false,
                style: {
                  position: { x: 100, y: 100, width: 200, height: 50 }
                },
                animations: [],
                properties: {}
              },
              {
                id: 'shape-1',
                type: 'shape',
                content: null,
                x: 300,
                y: 200,
                width: 100,
                height: 100,
                zIndex: 1,
                visible: true,
                locked: false,
                style: {
                  position: { x: 300, y: 200, width: 100, height: 100 }
                },
                animations: [],
                properties: { shape: 'rectangle' }
              }
            ]
          }
        ]
      };
    });

    // Carregar editor com dados de teste
    await page.click('[data-testid="load-test-data"]');
    
    // 1. Verificar se canvas está visível
    await expect(page.locator('[data-testid="canvas-editor"]')).toBeVisible();

    // 2. Verificar se elementos aparecem no canvas
    const textElement = page.locator('[data-element-id="text-1"]');
    const shapeElement = page.locator('[data-element-id="shape-1"]');

    await expect(textElement).toBeVisible();
    await expect(shapeElement).toBeVisible();

    console.log('✅ Elementos visíveis no canvas');

    // 3. Testar seleção de elemento
    await textElement.click();
    await expect(textElement).toHaveClass(/selected/);

    console.log('✅ Seleção de elemento funcionando');

    // 4. Testar drag & drop
    const textBounds = await textElement.boundingBox();
    if (textBounds) {
      await page.mouse.move(textBounds.x + textBounds.width/2, textBounds.y + textBounds.height/2);
      await page.mouse.down();
      await page.mouse.move(textBounds.x + 50, textBounds.y + 30);
      await page.mouse.up();
      
      // Verificar se posição mudou
      const newBounds = await textElement.boundingBox();
      expect(newBounds?.x).not.toBe(textBounds.x);
      
      console.log('✅ Drag & drop funcionando');
    }

    // 5. Testar edição inline de texto
    await textElement.dblclick();
    const textInput = page.locator('input[data-editing="text-1"]');
    await expect(textInput).toBeVisible();
    
    await textInput.fill('Texto Editado');
    await textInput.press('Enter');
    
    await expect(textElement).toContainText('Texto Editado');
    console.log('✅ Edição inline de texto funcionando');

    console.log('✅ [Test 2] Canvas editor e objetos editáveis - PASSOU');
  });

  test('TestTimeline → Camadas e keyframes', async ({ page }) => {
    console.log('🧪 [Test 3] Testando timeline com camadas independentes...');

    await page.goto(`${BASE_URL}/editor-animaker`);
    
    // Carregar dados de teste com animações
    await page.evaluate(() => {
      (window as any).testData = {
        slides: [
          {
            id: 'slide-1',
            index: 1,
            title: 'Slide com Animações',
            layout: 'blank',
            duration: 5,
            elements: [
              {
                id: 'text-1',
                type: 'text',
                content: 'Texto Animado',
                x: 100,
                y: 100,
                width: 200,
                height: 50,
                zIndex: 1,
                visible: true,
                locked: false,
                style: {
                  position: { x: 100, y: 100, width: 200, height: 50 }
                },
                animations: [
                  { id: 'anim-1', type: 'fadeIn', duration: 2, delay: 0, easing: 'ease-in-out' }
                ],
                properties: {}
              },
              {
                id: 'shape-1',
                type: 'shape',
                content: null,
                x: 300,
                y: 200,
                width: 100,
                height: 100,
                zIndex: 1,
                visible: true,
                locked: false,
                style: {
                  position: { x: 300, y: 200, width: 100, height: 100 }
                },
                animations: [
                  { id: 'anim-2', type: 'slideIn', duration: 1.5, delay: 1, easing: 'ease-in-out' }
                ],
                properties: {}
              }
            ]
          }
        ]
      };
    });

    await page.click('[data-testid="load-test-data"]');

    // 1. Verificar se timeline está visível
    await expect(page.locator('[data-testid="timeline-editor"]')).toBeVisible();

    // 2. Verificar tracks independentes
    const scenesTrack = page.locator('[data-track-type="scene"]');
    const textTrack = page.locator('[data-track-element="text-1"]');
    const shapeTrack = page.locator('[data-track-element="shape-1"]');

    await expect(scenesTrack).toBeVisible();
    await expect(textTrack).toBeVisible();
    await expect(shapeTrack).toBeVisible();

    console.log('✅ Tracks independentes visíveis');

    // 3. Verificar keyframes
    const textKeyframes = page.locator('[data-keyframe-element="text-1"]');
    const shapeKeyframes = page.locator('[data-keyframe-element="shape-1"]');

    const textKeyframeCount = await textKeyframes.count();
    const shapeKeyframeCount = await shapeKeyframes.count();

    expect(textKeyframeCount).toBeGreaterThan(0);
    expect(shapeKeyframeCount).toBeGreaterThan(0);

    console.log(`✅ Keyframes detectados: texto=${textKeyframeCount}, shape=${shapeKeyframeCount}`);

    // 4. Testar controles de reprodução
    const playButton = page.locator('[data-testid="timeline-play"]');
    await playButton.click();
    
    await page.waitForTimeout(1000);
    
    const pauseButton = page.locator('[data-testid="timeline-pause"]');
    await expect(pauseButton).toBeVisible();
    
    console.log('✅ Controles de reprodução funcionando');

    // 5. Testar scrub na timeline
    const timelineRuler = page.locator('[data-testid="timeline-ruler"]');
    const rulerBounds = await timelineRuler.boundingBox();
    
    if (rulerBounds) {
      // Clicar na metade da timeline
      await page.mouse.click(rulerBounds.x + rulerBounds.width / 2, rulerBounds.y + rulerBounds.height / 2);
      
      // Verificar se tempo mudou
      const currentTime = await page.locator('[data-testid="current-time"]').textContent();
      expect(currentTime).not.toBe('00:00.00');
      
      console.log(`✅ Scrub timeline funcionando: ${currentTime}`);
    }

    console.log('✅ [Test 3] Timeline com camadas e keyframes - PASSOU');
  });

  test('TestPreview → Player funcional', async ({ page }) => {
    console.log('🧪 [Test 4] Testando preview player...');

    await page.goto(`${BASE_URL}/editor-animaker`);
    await page.click('[data-testid="load-test-data"]');

    // 1. Iniciar preview
    const previewButton = page.locator('[data-testid="preview-button"]');
    await previewButton.click();

    // 2. Verificar se player de preview abre
    await expect(page.locator('[data-testid="preview-player"]')).toBeVisible();

    // 3. Verificar controles do player
    const playBtn = page.locator('[data-testid="preview-play"]');
    const pauseBtn = page.locator('[data-testid="preview-pause"]');
    const progressBar = page.locator('[data-testid="preview-progress"]');

    await expect(playBtn).toBeVisible();
    await expect(progressBar).toBeVisible();

    // 4. Testar reprodução
    await playBtn.click();
    await page.waitForTimeout(2000);
    
    // Verificar se barra de progresso mudou
    const progress = await progressBar.getAttribute('value');
    expect(parseFloat(progress || '0')).toBeGreaterThan(0);

    console.log(`✅ Preview funcionando: progresso=${progress}`);

    // 5. Testar scrub no player
    const progressBounds = await progressBar.boundingBox();
    if (progressBounds) {
      await page.mouse.click(progressBounds.x + progressBounds.width * 0.7, progressBounds.y + progressBounds.height / 2);
      
      await page.waitForTimeout(500);
      const newProgress = await progressBar.getAttribute('value');
      expect(parseFloat(newProgress || '0')).toBeGreaterThan(50);
      
      console.log(`✅ Scrub player funcionando: ${newProgress}%`);
    }

    console.log('✅ [Test 4] Preview player funcional - PASSOU');
  });

  test('TestExport → Renderização real', async ({ page }) => {
    console.log('🧪 [Test 5] Testando export/renderização...');

    await page.goto(`${BASE_URL}/editor-animaker`);
    await page.click('[data-testid="load-test-data"]');

    // 1. Iniciar export
    const exportButton = page.locator('[data-testid="export-button"]');
    await exportButton.click();

    // 2. Verificar modal de configurações
    await expect(page.locator('[data-testid="export-settings"]')).toBeVisible();

    // 3. Configurar export
    await page.selectOption('[data-testid="export-quality"]', 'medium');
    await page.selectOption('[data-testid="export-format"]', 'mp4');

    // 4. Confirmar export
    await page.click('[data-testid="confirm-export"]');

    // 5. Aguardar início da renderização
    await expect(page.locator('[data-testid="render-progress"]')).toBeVisible({ timeout: 10000 });

    // 6. Verificar progresso
    const progressText = page.locator('[data-testid="render-progress-text"]');
    await expect(progressText).toContainText('Renderizando');

    console.log('✅ Renderização iniciada');

    // 7. Aguardar conclusão (com timeout)
    await page.waitForSelector('[data-testid="render-complete"]', { timeout: 60000 });

    // 8. Verificar se arquivo foi gerado
    const downloadLink = page.locator('[data-testid="download-link"]');
    await expect(downloadLink).toBeVisible();

    const href = await downloadLink.getAttribute('href');
    expect(href).toBeTruthy();
    expect(href).toContain('.mp4');

    console.log(`✅ Arquivo renderizado: ${href}`);

    // 9. Validar tamanho do arquivo
    const fileSize = await page.locator('[data-testid="file-size"]').textContent();
    expect(fileSize).toContain('MB');
    
    const sizeValue = parseFloat(fileSize?.match(/[\d.]+/)?.[0] || '0');
    expect(sizeValue).toBeGreaterThan(0);

    console.log(`✅ Arquivo válido: ${fileSize}`);

    console.log('✅ [Test 5] Export/renderização real - PASSOU');
  });
});

test.describe('Editor - Testes de Regressão', () => {
  test('Verificar que não há módulos em modo mock', async ({ page }) => {
    console.log('🧪 [Regression] Verificando módulos não-mock...');

    await page.goto(`${BASE_URL}/editor-animaker`);
    
    // Interceptar chamadas de API e verificar respostas reais
    const apiCalls: string[] = [];
    
    page.on('response', async (response) => {
      const url = response.url();
      if (url.includes('/api/')) {
        try {
          const body = await response.json();
          if (body.mock || body.demo || (body.message && body.message.includes('mock'))) {
            apiCalls.push(`MOCK: ${url}`);
          } else {
            apiCalls.push(`REAL: ${url}`);
          }
        } catch (e) {
          // Não é JSON, ignorar
        }
      }
    });

    // Fazer upload de teste
    await page.click('[data-testid="load-test-data"]');
    await page.waitForTimeout(3000);

    // Verificar se não há chamadas mock
    const mockCalls = apiCalls.filter(call => call.startsWith('MOCK:'));
    
    if (mockCalls.length > 0) {
      console.log('❌ APIs em modo mock encontradas:', mockCalls);
      throw new Error(`${mockCalls.length} APIs ainda em modo mock/demo`);
    }

    console.log('✅ Todas as APIs estão em modo real');
    console.log(`✅ [Regression] ${apiCalls.length} APIs verificadas - PASSOU`);
  });
});

// Função auxiliar para criar PPTX de teste
async function createDemoPPTX() {
  console.log('📄 Criando arquivo PPTX de demonstração...');
  
  // Criar um arquivo PPTX mínimo para testes
  const demoDir = path.dirname(DEMO_PPTX_PATH);
  await fs.promises.mkdir(demoDir, { recursive: true });
  
  // Por simplicidade, copiar um arquivo existente ou criar placeholder
  const placeholderContent = Buffer.from('PK\x03\x04'); // Início de arquivo ZIP (PPTX é baseado em ZIP)
  await fs.promises.writeFile(DEMO_PPTX_PATH, placeholderContent);
  
  console.log('✅ Arquivo PPTX de teste criado');
}
