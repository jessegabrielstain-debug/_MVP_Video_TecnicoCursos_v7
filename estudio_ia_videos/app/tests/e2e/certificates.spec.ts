/**
 * E2E Tests: Blockchain Certificates
 * Sprint 44
 */

import { test, expect } from '@playwright/test'

test.describe('Blockchain Certificates', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/api/auth/signin')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/')
  })

  test('01 - Mintar certificado (testnet)', async ({ page }) => {
    // Ir para projeto concluído
    await page.goto('/projects/test-completed-project')

    // Abrir modal de certificado
    await page.click('button:has-text("Emitir Certificado")')

    // Confirmar mint
    await page.click('button:has-text("Confirmar Emissão")')

    // Aguardar transação (mock é rápido)
    await page.waitForSelector('text=Certificado emitido com sucesso', { timeout: 15000 })

    // Verificar que mostra tokenId
    await expect(page.locator('text=Token ID:')).toBeVisible()
  })

  test('02 - Verificar certificado existente', async ({ page }) => {
    await page.goto('/certificates/verify?tokenId=mock-12345')

    // Aguardar resultado da verificação
    await page.waitForSelector('text=Certificado Válido', { timeout: 10000 })

    // Verificar metadados
    await expect(page.locator('text=João Silva')).toBeVisible()
    await expect(page.locator('text=NR-12')).toBeVisible()
  })

  test('03 - Ver QR Code de verificação', async ({ page }) => {
    await page.goto('/projects/test-completed-project/certificate')

    // QR code deve estar visível
    const qrCode = page.locator('img[alt*="QR Code"]')
    await expect(qrCode).toBeVisible()

    // Verificar que tem src válido
    const src = await qrCode.getAttribute('src')
    expect(src).toContain('/api/certificates/verify')
  })

  test('04 - Verificar status on-chain', async ({ page }) => {
    await page.goto('/certificates/verify?tokenId=mock-12345')

    // Verificar detalhes
    await expect(page.locator('text=Blockchain: Polygon')).toBeVisible()
    await expect(page.locator('text=Status: Válido')).toBeVisible()
    await expect(page.locator('text=Owner:')).toBeVisible()
  })
})
