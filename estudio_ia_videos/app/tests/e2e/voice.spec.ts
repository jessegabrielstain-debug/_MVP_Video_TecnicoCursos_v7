/**
 * E2E Tests: Voice Cloning Flow
 * Sprint 44
 */

import { test, expect } from '@playwright/test'
import path from 'path'

test.describe('Voice Cloning - Wizard Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/api/auth/signin')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/')
  })

  test('01 - Criar voz customizada (mock)', async ({ page }) => {
    await page.goto('/voice-cloning')
    
    // Passo 1: Nome da voz
    await page.fill('input[placeholder*="Ex: Voz do Instrutor"]', 'Voz Teste E2E')
    
    // Upload de samples (mock files)
    const fileInput = page.locator('input[type="file"]')
    
    // Simular upload de 3 arquivos
    // Note: em CI, precisará de arquivos de teste reais
    await fileInput.setInputFiles([
      path.join(__dirname, '../fixtures/sample1.mp3'),
      path.join(__dirname, '../fixtures/sample2.mp3'),
      path.join(__dirname, '../fixtures/sample3.mp3')
    ])
    
    // Verificar que 3 samples foram adicionados
    await expect(page.locator('text=Amostras (3/5)')).toBeVisible()
    
    // Iniciar treinamento
    await page.click('button:has-text("Iniciar Treinamento")')
    
    // Aguardar processamento (progress bar)
    await page.waitForSelector('text=Treinando Voz Customizada', { timeout: 5000 })
    
    // Aguardar conclusão (pode demorar em produção, mas mock é rápido)
    await page.waitForSelector('text=Voz Treinada com Sucesso', { timeout: 30000 })
  })

  test('02 - Preview de voz customizada', async ({ page }) => {
    // Assumir que já existe uma voz criada
    await page.goto('/voice-cloning?voiceId=test-voice-123')
    
    // Gerar preview
    await page.click('button:has-text("Gerar Prévia")')
    
    // Aguardar áudio player
    await page.waitForSelector('audio[controls]', { timeout: 10000 })
    
    // Verificar que o áudio tem source
    const audioSrc = await page.locator('audio').getAttribute('src')
    expect(audioSrc).toBeTruthy()
  })

  test('03 - Aplicar voz customizada em projeto', async ({ page }) => {
    await page.goto('/projects/test-project/editor')
    
    // Abrir menu de TTS
    await page.click('button:has-text("TTS")')
    
    // Selecionar voz customizada
    await page.click('select[name="voice"]')
    await page.selectOption('select[name="voice"]', { label: 'Voz Teste E2E' })
    
    // Aplicar
    await page.click('button:has-text("Aplicar Voz")')
    
    // Verificar feedback
    await expect(page.locator('text=Voz aplicada com sucesso')).toBeVisible()
  })

  test('04 - Listar vozes disponíveis', async ({ page }) => {
    await page.goto('/voice-cloning/list')
    
    // Verificar que há pelo menos 1 voz
    const voiceCards = page.locator('[data-testid="voice-card"]')
    await expect(voiceCards.first()).toBeVisible()
  })

  test('05 - Deletar voz customizada', async ({ page }) => {
    await page.goto('/voice-cloning/list')
    
    // Clicar em delete da primeira voz
    await page.click('[data-testid="delete-voice-btn"]')
    
    // Confirmar modal
    await page.click('button:has-text("Confirmar")')
    
    // Verificar sucesso
    await expect(page.locator('text=Voz deletada com sucesso')).toBeVisible()
  })
})
