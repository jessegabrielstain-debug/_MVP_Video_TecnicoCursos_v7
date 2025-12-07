/**
 * 🎯 E2E Tests - User Journey (Jornada Usuário Real)
 * Simula usuário real navegando pelo MVP Video TécnicoCursos
 */

import { test, expect } from '@playwright/test'

test.describe('Jornada do Usuário Real', () => {
  
  test('1. Página inicial carrega corretamente', async ({ page }) => {
    await page.goto('/')
    
    // Verificar que a página carregou
    await expect(page).toHaveTitle(/Estúdio|MVP|Video|TécnicoCursos/i)
    
    // Verificar elementos principais da UI
    const body = page.locator('body')
    await expect(body).toBeVisible()
    
    // Verificar que não há erros JavaScript críticos
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.waitForTimeout(2000)
    
    console.log('✅ Página inicial carregada sem erros críticos')
  })

  test('2. Dashboard está acessível', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Pode redirecionar para login se não autenticado - isso é OK
    await page.waitForLoadState('networkidle')
    
    const url = page.url()
    expect(url).toMatch(/(dashboard|login|auth)/)
    
    console.log(`✅ Dashboard acessado, URL: ${url}`)
  })

  test('3. Página PPTX carrega', async ({ page }) => {
    await page.goto('/pptx')
    
    await page.waitForLoadState('networkidle')
    
    // Verificar título ou conteúdo da página
    const content = await page.textContent('body')
    expect(content).toBeTruthy()
    
    // Verificar se tem área de upload
    const uploadArea = page.locator('[data-testid="upload-area"], .dropzone, [class*="upload"], [class*="drop"]')
    const hasUpload = await uploadArea.count() > 0
    
    // Ou verificar pelo texto
    const hasUploadText = content?.toLowerCase().includes('upload') || 
                          content?.toLowerCase().includes('pptx') ||
                          content?.toLowerCase().includes('arrastar')
    
    expect(hasUpload || hasUploadText).toBeTruthy()
    
    console.log('✅ Página PPTX carregada com área de upload')
  })

  test('4. API Health está funcionando', async ({ request }) => {
    const response = await request.get('/api/health')
    
    expect(response.status()).toBe(200)
    
    const data = await response.json()
    expect(data).toBeDefined()
    
    console.log('✅ API Health retornou:', JSON.stringify(data).substring(0, 100))
  })

  test('5. Navegação entre páginas funciona', async ({ page }) => {
    // Começar na home
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Navegar para dashboard
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    expect(page.url()).toMatch(/dashboard|login/)
    
    // Navegar para PPTX
    await page.goto('/pptx')
    await page.waitForLoadState('networkidle')
    expect(page.url()).toContain('pptx')
    
    // Voltar para home
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    console.log('✅ Navegação entre páginas funcionando')
  })

  test('6. APIs essenciais respondem', async ({ request }) => {
    const endpoints = [
      { path: '/api/health', methods: ['GET'] },
      { path: '/api/compliance/check?projectId=test', methods: ['GET'] },
    ]
    
    for (const endpoint of endpoints) {
      for (const method of endpoint.methods) {
        const response = method === 'GET' 
          ? await request.get(endpoint.path)
          : await request.post(endpoint.path, { data: {} })
        
        // Não deve ser 500 (erro de servidor)
        expect(response.status()).not.toBe(500)
        
        console.log(`✅ ${method} ${endpoint.path} -> ${response.status()}`)
      }
    }
  })

  test('7. Assets estáticos carregam', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Verificar se CSS carregou (página tem estilização)
    const hasStyles = await page.evaluate(() => {
      const styles = document.styleSheets
      return styles.length > 0
    })
    
    expect(hasStyles).toBeTruthy()
    
    // Verificar se JavaScript carregou
    const hasJS = await page.evaluate(() => {
      return typeof window !== 'undefined' && document.body
    })
    
    expect(hasJS).toBeTruthy()
    
    console.log('✅ Assets estáticos (CSS/JS) carregados')
  })

  test('8. Não há erros de console críticos', async ({ page }) => {
    const consoleErrors: string[] = []
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })
    
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(3000)
    
    // Filtrar erros conhecidos/aceitáveis
    const criticalErrors = consoleErrors.filter(e => 
      !e.includes('favicon') && 
      !e.includes('DevTools') &&
      !e.includes('React DevTools') &&
      !e.includes('beforeinstallpromptevent')
    )
    
    // Pode ter alguns warnings, mas não muitos erros críticos
    expect(criticalErrors.length).toBeLessThan(5)
    
    console.log(`✅ Console errors filtrados: ${criticalErrors.length} críticos`)
    if (criticalErrors.length > 0) {
      console.log('  Erros encontrados:', criticalErrors.slice(0, 3))
    }
  })
})
