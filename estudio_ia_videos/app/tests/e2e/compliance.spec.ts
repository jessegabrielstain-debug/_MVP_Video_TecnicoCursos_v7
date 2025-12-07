/**
 * E2E Tests: Compliance Flow
 * Sprint 44
 */

import { test, expect } from '@playwright/test'

test.describe('Compliance NR - Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login primeiro
    await page.goto('/api/auth/signin')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/')
  })

  test('01 - Verificar compliance de projeto conforme', async ({ page }) => {
    // Navegar para projeto de teste
    await page.goto('/projects/test-project-ok')
    
    // Abrir aba Compliance
    await page.click('button:has-text("Compliance")')
    
    // Executar verificação
    await page.click('button:has-text("Verificar")')
    
    // Aguardar resultado
    await page.waitForSelector('text=100% Conforme', { timeout: 10000 })
    
    // Verificar que não há issues
    await expect(page.locator('text=Nenhum problema de conformidade')).toBeVisible()
  })

  test('02 - Verificar compliance de projeto não-conforme', async ({ page }) => {
    await page.goto('/projects/test-project-nok')
    
    await page.click('button:has-text("Compliance")')
    await page.click('button:has-text("Verificar")')
    
    // Aguardar resultado com issues
    await page.waitForSelector('.compliance-issue', { timeout: 10000 })
    
    // Verificar que há pelo menos 1 issue
    const issueCount = await page.locator('.compliance-issue').count()
    expect(issueCount).toBeGreaterThan(0)
    
    // Verificar severidades
    await expect(page.locator('text=CRITICAL, HIGH, MEDIUM, LOW').first()).toBeVisible()
  })

  test('03 - Gerar relatório PDF de compliance', async ({ page }) => {
    await page.goto('/projects/test-project-ok')
    
    await page.click('button:has-text("Compliance")')
    
    // Download do relatório
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('button:has-text("Gerar Relatório PDF")')
    ])
    
    expect(download.suggestedFilename()).toContain('compliance-report')
    expect(download.suggestedFilename()).toContain('.pdf')
  })

  test('04 - Bloquear publicação se reprovar', async ({ page }) => {
    await page.goto('/projects/test-project-nok')
    
    await page.click('button:has-text("Compliance")')
    await page.click('button:has-text("Verificar")')
    
    // Ativar toggle de bloqueio
    await page.click('input[id="block-publish"]')
    
    // Tentar publicar
    await page.click('button:has-text("Publicar")')
    
    // Verificar mensagem de bloqueio
    await expect(page.locator('text=bloqueado devido à conformidade')).toBeVisible()
  })

  test('05 - Desbloquear publicação (override)', async ({ page }) => {
    await page.goto('/projects/test-project-nok')
    
    await page.click('button:has-text("Compliance")')
    
    // Desativar toggle de bloqueio
    await page.click('input[id="block-publish"]')
    
    // Publicar deve funcionar agora
    await page.click('button:has-text("Publicar")')
    
    // Verificar sucesso (ou modal de confirmação)
    await expect(
      page.locator('text=Publicado com sucesso, text=Confirmar publicação')
    ).toBeVisible()
  })
})
