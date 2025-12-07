/**
 * 🧪 Smoke Tests - Testes Automatizados Pós-Deploy
 * 
 * Valida funcionalidades críticas em produção
 */

import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const SMOKE_TEST_EMAIL = process.env.SMOKE_TEST_EMAIL || 'demo@estudio-ia.com'
const SMOKE_TEST_PASSWORD = process.env.SMOKE_TEST_PASSWORD || 'demo123'

const supabase = SUPABASE_URL && SUPABASE_ANON_KEY
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null

// 1. Health Check
test('Health endpoint should respond', async ({ page }) => {
  const response = await page.goto(`${BASE_URL}/api/health`)
  expect(response?.status()).toBe(200)
  
  const data = await response?.json()
  expect(data.status).toBe('healthy')
  expect(data.checks.redis.healthy).toBe(true)
})

// 2. Metrics endpoint
test('Metrics endpoint should respond', async ({ page }) => {
  const response = await page.goto(`${BASE_URL}/api/metrics`)
  expect(response?.status()).toBe(200)
  
  const data = await response?.json()
  expect(data.memory).toBeDefined()
  expect(data.process).toBeDefined()
})

// 3. Homepage loads
test('Homepage should load successfully', async ({ page }) => {
  await page.goto(BASE_URL)
  await expect(page).toHaveTitle(/Estúdio IA/i)
  
  // Verificar elementos principais
  const mainContent = page.locator('main')
  await expect(mainContent).toBeVisible()
})

// 4. Login page loads
test('Login page should be accessible', async ({ page }) => {
  await page.goto(`${BASE_URL}/login`)
  
  // Verificar campos de login
  const emailInput = page.locator('input[type="email"], input[name="email"]')
  const passwordInput = page.locator('input[type="password"]')
  
  await expect(emailInput).toBeVisible()
  await expect(passwordInput).toBeVisible()
})

// 5. Dashboard (authenticated)
test('Dashboard should load for authenticated users', async ({ page }) => {
  if (!supabase) {
    test.skip(true, 'Supabase client não configurado para smoke tests')
  }

  const { hostname } = new URL(BASE_URL)

  const { data, error } = await supabase!.auth.signInWithPassword({
    email: SMOKE_TEST_EMAIL,
    password: SMOKE_TEST_PASSWORD
  })

  if (error || !data.session) {
    test.skip(true, `Falha ao autenticar usuário de smoke test: ${error?.message ?? 'sessão indisponível'}`)
    return
  }

  const { access_token: accessToken, refresh_token: refreshToken } = data.session

  await page.context().addCookies(
    [
      {
        name: 'sb-access-token',
        value: accessToken,
        domain: hostname,
        path: '/',
        httpOnly: true,
        secure: false,
        sameSite: 'Lax'
      },
      {
        name: 'sb-refresh-token',
        value: refreshToken,
        domain: hostname,
        path: '/',
        httpOnly: true,
        secure: false,
        sameSite: 'Lax'
      }
    ]
  )
  
  await page.goto(`${BASE_URL}/dashboard`)
  
  // Verificar que não redirecionou para login
  expect(page.url()).not.toContain('/login')
})

// 6. PPTX Upload interface
test('PPTX upload interface should be accessible', async ({ page }) => {
  await page.goto(`${BASE_URL}/dashboard/pptx-upload`)
  
  // Verificar área de upload
  const uploadArea = page.locator('input[type="file"], [role="button"]:has-text("Upload")')
  await expect(uploadArea.first()).toBeVisible()
})

// 7. Canvas Editor
test('Canvas editor should load', async ({ page }) => {
  await page.goto(`${BASE_URL}/dashboard/canvas-editor`)
  
  // Verificar canvas ou área de edição
  const editor = page.locator('canvas, [data-testid="canvas-editor"]')
  await expect(editor.first()).toBeVisible({ timeout: 10000 })
})

// 8. TTS Panel
test('TTS panel should be accessible', async ({ page }) => {
  await page.goto(`${BASE_URL}/dashboard/tts`)
  
  // Verificar elementos de TTS
  const ttsPanel = page.locator('text=/voz|voice|tts/i')
  await expect(ttsPanel.first()).toBeVisible()
})

// 9. Templates NR
test('NR templates should load', async ({ page }) => {
  const response = await page.goto(`${BASE_URL}/api/templates/nr`)
  expect(response?.status()).toBe(200)
  
  const data = await response?.json()
  expect(data.templates).toBeDefined()
  expect(data.templates.length).toBeGreaterThan(0)
})

// 10. AI Recommendations
test('AI recommendations endpoint should respond', async ({ page }) => {
  const response = await page.goto(`${BASE_URL}/api/ai/recommendations`)
  expect(response?.status()).toBe(200)
  
  const data = await response?.json()
  expect(data.recommendations).toBeDefined()
})

// 11. Static assets (CSS, JS)
test('Static assets should load', async ({ page }) => {
  const response = await page.goto(BASE_URL)
  
  // Aguardar todas as requisições de rede
  await page.waitForLoadState('networkidle')
  
  // Verificar que não há erros 404 críticos
  const failedRequests: string[] = []
  page.on('requestfailed', request => {
    failedRequests.push(request.url())
  })
  
  await page.reload()
  await page.waitForLoadState('networkidle')
  
  // Falhas em assets _next/ são críticas
  const criticalFailures = failedRequests.filter(url => url.includes('/_next/'))
  expect(criticalFailures).toHaveLength(0)
})

// 12. Error handling (404)
test('404 page should render correctly', async ({ page }) => {
  const response = await page.goto(`${BASE_URL}/this-page-does-not-exist`)
  expect(response?.status()).toBe(404)
  
  // Verificar que não é erro 500
  await expect(page.locator('text=/404|not found/i')).toBeVisible()
})

// Performance: FCP < 2s
test('First Contentful Paint should be fast', async ({ page }) => {
  await page.goto(BASE_URL)
  
  const performanceMetrics = await page.evaluate(() => {
    const perfData = performance.getEntriesByType('paint')
    const fcp = perfData.find(entry => entry.name === 'first-contentful-paint')
    return fcp ? fcp.startTime : null
  })
  
  if (performanceMetrics) {
    expect(performanceMetrics).toBeLessThan(2000) // < 2 segundos
  }
})

// Security: Headers
test('Security headers should be present', async ({ page }) => {
  const response = await page.goto(BASE_URL)
  const headers = response?.headers()
  
  // Verificar headers de segurança importantes
  expect(headers?.['x-frame-options'] || headers?.['x-frame-options']?.toLowerCase()).toBeDefined()
  expect(headers?.['x-content-type-options']).toBe('nosniff')
})
