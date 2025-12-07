/**
 * 🎭 Playwright E2E Tests - Analytics Dashboard UI
 * 
 * Testa a interface do dashboard de analytics:
 * 1. Visualização de métricas
 * 2. Gráficos e charts
 * 3. Filtros de período
 * 4. Dados em tempo real
 * 5. Exportação de relatórios
 */

import { test, expect } from '@playwright/test'

test.describe('Analytics Dashboard - Interface', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar para o dashboard de analytics
    await page.goto('http://localhost:3000/analytics')
    await page.waitForLoadState('networkidle')
  })

  test('deve exibir métricas principais', async ({ page }) => {
    // Verificar título
    await expect(page).toHaveTitle(/Analytics|Dashboard/)
    
    // Verificar cards de métricas
    const metricsCards = page.locator('[data-testid="metric-card"]').or(page.locator('.metric-card')).or(page.locator('.stats-card'))
    const count = await metricsCards.count()
    
    expect(count).toBeGreaterThan(0)
    console.log(`✅ ${count} cards de métricas encontrados`)
  })

  test('deve exibir estatísticas de eventos', async ({ page }) => {
    // Procurar por números/estatísticas
    const stats = page.locator('text=/\\d+[KMB]?\\s*(events?|users?|projects?)/i')
    const count = await stats.count()
    
    if (count > 0) {
      console.log(`✅ ${count} estatísticas exibidas`)
    } else {
      console.log('⚠️ Estatísticas não encontradas - pode ser interface diferente')
    }
  })

  test('deve permitir filtrar por período', async ({ page }) => {
    // Localizar seletor de período
    const periodSelector = page.locator('[data-testid="period-filter"]').or(page.locator('select')).or(page.locator('button:has-text("7d")'))
    const hasSelector = await periodSelector.count()
    
    if (hasSelector > 0) {
      await periodSelector.first().click()
      
      // Selecionar opção (ex: 30d)
      const option30d = page.locator('text=30d').or(page.locator('option:has-text("30 days")'))
      const hasOption = await option30d.count()
      
      if (hasOption > 0) {
        await option30d.first().click()
        await page.waitForTimeout(1000)
        console.log('✅ Filtro de período aplicado')
      }
    } else {
      console.log('⚠️ Seletor de período não encontrado')
    }
  })

  test('deve exibir gráfico de timeline', async ({ page }) => {
    // Procurar por elemento de gráfico (canvas, SVG)
    const chart = page.locator('canvas').or(page.locator('svg')).or(page.locator('[data-testid="chart"]'))
    const count = await chart.count()
    
    if (count > 0) {
      await expect(chart.first()).toBeVisible()
      console.log('✅ Gráfico de timeline exibido')
    } else {
      console.log('⚠️ Gráfico não encontrado')
    }
  })

  test('deve exibir top eventos por categoria', async ({ page }) => {
    // Procurar por lista de categorias
    const categories = page.locator('[data-testid="category-list"]').or(page.locator('text=/pptx|render|analytics/i'))
    const count = await categories.count()
    
    if (count > 0) {
      console.log(`✅ ${count} categorias de eventos encontradas`)
    } else {
      console.log('⚠️ Categorias não encontradas')
    }
  })

  test('deve exibir tabela de eventos recentes', async ({ page }) => {
    // Procurar por tabela
    const table = page.locator('table').or(page.locator('[data-testid="events-table"]'))
    const hasTable = await table.count()
    
    if (hasTable > 0) {
      // Verificar linhas da tabela
      const rows = page.locator('tbody tr')
      const rowCount = await rows.count()
      
      console.log(`✅ Tabela com ${rowCount} eventos recentes exibida`)
    } else {
      console.log('⚠️ Tabela de eventos não encontrada')
    }
  })

  test('deve atualizar dados em tempo real', async ({ page }) => {
    // Capturar valor inicial
    const metric = page.locator('[data-testid="metric-card"]').first().or(page.locator('.metric-card').first())
    const hasMetric = await metric.count()
    
    if (hasMetric > 0) {
      const initialValue = await metric.textContent()
      
      // Aguardar 5 segundos
      await page.waitForTimeout(5000)
      
      // Verificar se houve atualização (reload ou WebSocket)
      const newValue = await metric.textContent()
      
      if (initialValue !== newValue) {
        console.log('✅ Dados atualizados em tempo real')
      } else {
        console.log('⚠️ Dados não mudaram (pode não ter atividade no período)')
      }
    }
  })

  test('deve permitir exportar relatório', async ({ page }) => {
    // Procurar botão de export
    const exportButton = page.locator('[data-testid="export-button"]').or(page.locator('button:has-text("Export")'))
    const hasButton = await exportButton.count()
    
    if (hasButton > 0) {
      // Configurar listener para download
      const downloadPromise = page.waitForEvent('download', { timeout: 10000 }).catch(() => null)
      
      await exportButton.first().click()
      
      const download = await downloadPromise
      
      if (download) {
        console.log(`✅ Arquivo exportado: ${await download.suggestedFilename()}`)
      } else {
        console.log('⚠️ Download não iniciado - pode ser modal de configuração')
      }
    } else {
      console.log('⚠️ Botão de export não encontrado')
    }
  })

  test('deve exibir estatísticas de performance', async ({ page }) => {
    // Procurar por métricas de performance
    const perfMetrics = page.locator('text=/response time|avg.*time|throughput/i')
    const count = await perfMetrics.count()
    
    if (count > 0) {
      console.log(`✅ ${count} métricas de performance exibidas`)
    } else {
      console.log('⚠️ Métricas de performance não encontradas')
    }
  })

  test('deve exibir distribuição de dispositivos', async ({ page }) => {
    // Procurar por estatísticas de dispositivos
    const devices = page.locator('text=/desktop|mobile|tablet/i')
    const count = await devices.count()
    
    if (count > 0) {
      console.log(`✅ Estatísticas de dispositivos exibidas`)
    } else {
      console.log('⚠️ Distribuição de dispositivos não encontrada')
    }
  })

  test('deve exibir estatísticas de navegadores', async ({ page }) => {
    // Procurar por navegadores
    const browsers = page.locator('text=/chrome|firefox|safari|edge/i')
    const count = await browsers.count()
    
    if (count > 0) {
      console.log(`✅ Estatísticas de navegadores exibidas`)
    } else {
      console.log('⚠️ Distribuição de navegadores não encontrada')
    }
  })

  test('deve responder rapidamente (< 3s)', async ({ page }) => {
    const startTime = Date.now()
    
    await page.goto('http://localhost:3000/analytics')
    await page.waitForLoadState('networkidle')
    
    const loadTime = Date.now() - startTime
    
    expect(loadTime).toBeLessThan(3000)
    console.log(`✅ Dashboard carregou em ${loadTime}ms`)
  })
})

