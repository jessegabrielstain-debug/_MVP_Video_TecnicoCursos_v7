/**
 * E2E Tests: Real-Time Collaboration
 * Sprint 44
 */

import { test, expect } from '@playwright/test'

test.describe('Real-Time Collaboration', () => {
  test('01 - Múltiplos usuários veem presença', async ({ browser }) => {
    // Criar 3 contextos (usuários)
    const context1 = await browser.newContext()
    const context2 = await browser.newContext()
    const context3 = await browser.newContext()

    const page1 = await context1.newPage()
    const page2 = await context2.newPage()
    const page3 = await context3.newPage()

    // Login em todas as páginas
    for (const page of [page1, page2, page3]) {
      await page.goto('/api/auth/signin')
      await page.fill('input[name="email"]', 'test@example.com')
      await page.fill('input[name="password"]', 'password123')
      await page.click('button[type="submit"]')
      await page.waitForURL('/')
    }

    // Todos entram no mesmo projeto
    const projectId = 'test-collab-project'
    await Promise.all([
      page1.goto(`/collaboration/${projectId}`),
      page2.goto(`/collaboration/${projectId}`),
      page3.goto(`/collaboration/${projectId}`)
    ])

    // Aguardar Socket.IO conectar
    await page1.waitForTimeout(2000)

    // Verificar badge de presença no page1
    const badge1 = page1.locator('text=3 online')
    await expect(badge1).toBeVisible({ timeout: 5000 })

    // Cleanup
    await context1.close()
    await context2.close()
    await context3.close()
  })

  test('02 - Ver cursores remotos', async ({ browser }) => {
    const context1 = await browser.newContext()
    const context2 = await browser.newContext()

    const page1 = await context1.newPage()
    const page2 = await context2.newPage()

    // Login
    for (const page of [page1, page2]) {
      await page.goto('/api/auth/signin')
      await page.fill('input[name="email"]', 'test@example.com')
      await page.fill('input[name="password"]', 'password123')
      await page.click('button[type="submit"]')
      await page.waitForURL('/')
    }

    // Entrar no projeto
    const projectId = 'test-collab-project'
    await Promise.all([
      page1.goto(`/collaboration/${projectId}`),
      page2.goto(`/collaboration/${projectId}`)
    ])

    await page1.waitForTimeout(2000)

    // Mover mouse no page2
    await page2.mouse.move(500, 300)

    // Aguardar e verificar cursor remoto no page1
    await page1.waitForSelector('[data-remote-cursor]', { timeout: 5000 })

    await context1.close()
    await context2.close()
  })

  test('03 - Comentar com @menção', async ({ page }) => {
    await page.goto('/api/auth/signin')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')

    await page.goto('/collaboration/test-collab-project')

    // Abrir painel de comentários
    await page.click('button:has-text("Comentários")')

    // Adicionar comentário com @menção
    await page.fill('textarea[placeholder*="comentário"]', 'Revisar este slide @joao')
    await page.click('button:has-text("Enviar")')

    // Verificar que apareceu na lista
    await expect(page.locator('text=Revisar este slide @joao')).toBeVisible()
  })

  test('04 - Resolver thread de comentário', async ({ page }) => {
    await page.goto('/api/auth/signin')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')

    await page.goto('/collaboration/test-collab-project')

    await page.click('button:has-text("Comentários")')

    // Resolver o primeiro comentário
    await page.click('[data-testid="resolve-comment-btn"]')

    // Verificar que mudou status
    await expect(page.locator('text=Resolvido')).toBeVisible()
  })
})
