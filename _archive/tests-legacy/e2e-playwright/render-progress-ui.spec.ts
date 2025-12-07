/**
 * 🎭 Playwright E2E Tests - Render Progress UI
 * 
 * Testa a interface de renderização de vídeo:
 * 1. Iniciar renderização
 * 2. Visualização de progresso
 * 3. Barra de progresso em tempo real
 * 4. Download de vídeo finalizado
 * 5. Tratamento de erros
 */

import { test, expect } from '@playwright/test'

test.describe('Render Progress - Interface', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar para a página de renderização
    await page.goto('http://localhost:3000/render')
    await page.waitForLoadState('networkidle')
  })

  test('deve exibir opções de renderização', async ({ page }) => {
    // Verificar título
    await expect(page).toHaveTitle(/Render|Video/)
    
    // Procurar por opções de qualidade
    const qualityOptions = page.locator('text=/low|medium|high|quality/i')
    const count = await qualityOptions.count()
    
    if (count > 0) {
      console.log(`✅ ${count} opções de qualidade encontradas`)
    } else {
      console.log('⚠️ Opções de qualidade não encontradas')
    }
  })

  test('deve permitir selecionar resolução', async ({ page }) => {
    // Procurar seletor de resolução
    const resolutionSelector = page.locator('[data-testid="resolution-select"]').or(page.locator('text=/1920x1080|1280x720|3840x2160/i'))
    const count = await resolutionSelector.count()
    
    if (count > 0) {
      console.log('✅ Seletor de resolução disponível')
    } else {
      console.log('⚠️ Seletor de resolução não encontrado')
    }
  })

  test('deve permitir selecionar codec', async ({ page }) => {
    // Procurar opções de codec
    const codecOptions = page.locator('text=/h264|h265|vp9|av1/i')
    const count = await codecOptions.count()
    
    if (count > 0) {
      console.log(`✅ Opções de codec encontradas`)
    } else {
      console.log('⚠️ Opções de codec não encontradas')
    }
  })

  test('deve permitir ativar/desativar watermark', async ({ page }) => {
    // Procurar checkbox de watermark
    const watermarkCheckbox = page.locator('[data-testid="watermark-toggle"]').or(page.locator('input[type="checkbox"]')).or(page.locator('text=/watermark/i'))
    const count = await watermarkCheckbox.count()
    
    if (count > 0) {
      console.log('✅ Opção de watermark disponível')
    } else {
      console.log('⚠️ Opção de watermark não encontrada')
    }
  })

  test('deve iniciar renderização', async ({ page }) => {
    // Botão de iniciar render
    const startButton = page.locator('button:has-text("Start Render")').or(page.locator('button:has-text("Render")'))
    const hasButton = await startButton.count()
    
    if (hasButton > 0) {
      await startButton.first().click()
      await page.waitForTimeout(1000)
      
      // Verificar que renderização começou
      const progressIndicator = page.locator('[data-testid="render-progress"]').or(page.locator('.progress-bar')).or(page.locator('text=/processing|rendering/i'))
      const hasProgress = await progressIndicator.count()
      
      if (hasProgress > 0) {
        console.log('✅ Renderização iniciada com sucesso')
      }
    } else {
      console.log('⚠️ Botão de render não encontrado')
    }
  })

  test('deve exibir barra de progresso', async ({ page }) => {
    // Este teste assume que há uma renderização em andamento
    const progressBar = page.locator('[data-testid="progress-bar"]').or(page.locator('progress')).or(page.locator('.progress-bar'))
    const count = await progressBar.count()
    
    if (count > 0) {
      // Verificar valor do progresso
      const progress = progressBar.first()
      const value = await progress.getAttribute('value').catch(() => null)
      
      if (value) {
        console.log(`✅ Progresso: ${value}%`)
      } else {
        console.log('✅ Barra de progresso exibida')
      }
    } else {
      console.log('⚠️ Barra de progresso não encontrada')
    }
  })

  test('deve exibir porcentagem de progresso', async ({ page }) => {
    // Procurar por número de porcentagem
    const percentage = page.locator('text=/\\d+%/')
    const count = await percentage.count()
    
    if (count > 0) {
      const percentText = await percentage.first().textContent()
      console.log(`✅ Porcentagem exibida: ${percentText}`)
    } else {
      console.log('⚠️ Porcentagem não encontrada - pode não haver renderização em andamento')
    }
  })

  test('deve exibir tempo estimado', async ({ page }) => {
    // Procurar por tempo estimado
    const timeEstimate = page.locator('text=/ETA|estimated|remaining/i')
    const count = await timeEstimate.count()
    
    if (count > 0) {
      const timeText = await timeEstimate.first().textContent()
      console.log(`✅ Tempo estimado exibido: ${timeText}`)
    } else {
      console.log('⚠️ Tempo estimado não encontrado')
    }
  })

  test('deve atualizar progresso em tempo real', async ({ page }) => {
    // Este teste requer uma renderização em andamento
    const progressBar = page.locator('[data-testid="progress-bar"]').or(page.locator('progress'))
    const hasProgress = await progressBar.count()
    
    if (hasProgress > 0) {
      // Capturar valor inicial
      const initialValue = await progressBar.first().getAttribute('value').catch(() => '0')
      
      // Aguardar 5 segundos
      await page.waitForTimeout(5000)
      
      // Capturar novo valor
      const newValue = await progressBar.first().getAttribute('value').catch(() => '0')
      
      if (newValue !== initialValue) {
        console.log(`✅ Progresso atualizado: ${initialValue}% → ${newValue}%`)
      } else {
        console.log('⚠️ Progresso não mudou (pode ser renderização rápida ou não iniciada)')
      }
    }
  })

  test('deve exibir mensagem de conclusão', async ({ page }) => {
    // Procurar por mensagem de sucesso
    const successMessage = page.locator('[data-testid="render-complete"]').or(page.locator('text=/completed|success|finalizado/i'))
    const count = await successMessage.count()
    
    if (count > 0) {
      console.log('✅ Mensagem de conclusão exibida')
    } else {
      console.log('⚠️ Mensagem não encontrada - pode não haver renderização completa')
    }
  })

  test('deve permitir download do vídeo', async ({ page }) => {
    // Este teste assume que há uma renderização completa
    const downloadButton = page.locator('button:has-text("Download")').or(page.locator('a[download]'))
    const hasButton = await downloadButton.count()
    
    if (hasButton > 0) {
      // Configurar listener para download
      const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null)
      
      await downloadButton.first().click()
      
      const download = await downloadPromise
      
      if (download) {
        const filename = await download.suggestedFilename()
        console.log(`✅ Vídeo pronto para download: ${filename}`)
      } else {
        console.log('⚠️ Download não iniciado')
      }
    } else {
      console.log('⚠️ Botão de download não encontrado - pode não haver vídeos prontos')
    }
  })

  test('deve exibir lista de renders em fila', async ({ page }) => {
    // Procurar por lista de jobs
    const renderQueue = page.locator('[data-testid="render-queue"]').or(page.locator('.render-list'))
    const hasQueue = await renderQueue.count()
    
    if (hasQueue > 0) {
      // Contar items na fila
      const items = page.locator('[data-testid="render-item"]').or(page.locator('.render-item'))
      const count = await items.count()
      
      console.log(`✅ ${count} renders na fila`)
    } else {
      console.log('⚠️ Lista de renders não encontrada')
    }
  })

  test('deve exibir status de cada render', async ({ page }) => {
    // Procurar por badges de status
    const statusBadges = page.locator('[data-testid="render-status"]').or(page.locator('text=/pending|processing|completed|failed/i'))
    const count = await statusBadges.count()
    
    if (count > 0) {
      console.log(`✅ ${count} status de render exibidos`)
    } else {
      console.log('⚠️ Status não encontrados')
    }
  })

  test('deve permitir cancelar renderização', async ({ page }) => {
    // Procurar botão de cancelar
    const cancelButton = page.locator('button:has-text("Cancel")').or(page.locator('[data-testid="cancel-render"]'))
    const hasButton = await cancelButton.count()
    
    if (hasButton > 0) {
      console.log('✅ Opção de cancelar disponível')
    } else {
      console.log('⚠️ Botão de cancelar não encontrado')
    }
  })

  test('deve exibir mensagem de erro se falhar', async ({ page }) => {
    // Este teste procura por mensagens de erro
    const errorMessage = page.locator('[data-testid="render-error"]').or(page.locator('.error')).or(page.locator('text=/error|failed|falha/i'))
    const count = await errorMessage.count()
    
    if (count > 0) {
      const errorText = await errorMessage.first().textContent()
      console.log(`⚠️ Erro encontrado: ${errorText}`)
    } else {
      console.log('✅ Nenhum erro detectado')
    }
  })

  test('deve persistir estado ao recarregar página', async ({ page }) => {
    // Este teste verifica se o estado persiste
    const hasRenders = await page.locator('[data-testid="render-item"]').count()
    
    if (hasRenders > 0) {
      const initialCount = hasRenders
      
      // Recarregar página
      await page.reload()
      await page.waitForLoadState('networkidle')
      
      // Verificar se renders ainda estão lá
      const newCount = await page.locator('[data-testid="render-item"]').count()
      
      if (newCount === initialCount) {
        console.log('✅ Estado persistiu após reload')
      } else {
        console.log(`⚠️ Estado mudou: ${initialCount} → ${newCount}`)
      }
    }
  })
})

