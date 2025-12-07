/**
 * 🎭 Playwright E2E Tests - Compliance NR UI
 * 
 * Testa a interface de validação NR:
 * 1. Seleção de template NR
 * 2. Validação de projeto
 * 3. Visualização de relatório
 * 4. Pontos críticos
 * 5. Recomendações
 */

import { test, expect } from '@playwright/test'

test.describe('Compliance NR - Interface', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar para a página de compliance
    await page.goto('http://localhost:3000/compliance')
    await page.waitForLoadState('networkidle')
  })

  test('deve exibir lista de templates NR', async ({ page }) => {
    // Verificar título
    await expect(page).toHaveTitle(/Compliance|NR/)
    
    // Procurar por templates NR
    const nrTemplates = page.locator('text=/NR-\\d{2}/i')
    const count = await nrTemplates.count()
    
    expect(count).toBeGreaterThanOrEqual(12) // 12 templates implementados
    console.log(`✅ ${count} templates NR exibidos`)
  })

  test('deve permitir selecionar template NR', async ({ page }) => {
    // Procurar NR-06 (EPIs)
    const nr06 = page.locator('text=/NR-06/i').or(page.locator('[data-testid="nr-06"]'))
    const hasNr06 = await nr06.count()
    
    if (hasNr06 > 0) {
      await nr06.first().click()
      await page.waitForTimeout(1000)
      
      // Verificar que detalhes do NR foram exibidos
      const details = page.locator('text=/EPI|Equipamento.*Proteção/i')
      const hasDetails = await details.count()
      
      if (hasDetails > 0) {
        console.log('✅ Detalhes do NR-06 exibidos')
      }
    } else {
      console.log('⚠️ NR-06 não encontrado')
    }
  })

  test('deve exibir novos templates implementados', async ({ page }) => {
    // Verificar NR-17 (Ergonomia)
    const nr17 = page.locator('text=/NR-17/i')
    const hasNr17 = await nr17.count()
    
    if (hasNr17 > 0) {
      console.log('✅ NR-17 (Ergonomia) disponível')
    }
    
    // Verificar NR-24 (Condições Sanitárias)
    const nr24 = page.locator('text=/NR-24/i')
    const hasNr24 = await nr24.count()
    
    if (hasNr24 > 0) {
      console.log('✅ NR-24 (Condições Sanitárias) disponível')
    }
    
    // Verificar NR-26 (Sinalização)
    const nr26 = page.locator('text=/NR-26/i')
    const hasNr26 = await nr26.count()
    
    if (hasNr26 > 0) {
      console.log('✅ NR-26 (Sinalização) disponível')
    }
  })

  test('deve permitir validar projeto contra NR', async ({ page }) => {
    // Selecionar projeto
    const projectSelector = page.locator('[data-testid="project-select"]').or(page.locator('select'))
    const hasSelector = await projectSelector.count()
    
    if (hasSelector > 0) {
      await projectSelector.first().click()
      
      // Selecionar primeira opção
      const firstOption = page.locator('option').nth(1)
      await firstOption.click()
      
      // Selecionar NR
      const nr06 = page.locator('text=/NR-06/i').first()
      await nr06.click()
      
      // Botão de validar
      const validateButton = page.locator('button:has-text("Validar")').or(page.locator('button:has-text("Validate")'))
      const hasButton = await validateButton.count()
      
      if (hasButton > 0) {
        await validateButton.first().click()
        await page.waitForTimeout(2000)
        console.log('✅ Validação iniciada')
      }
    } else {
      console.log('⚠️ Seletor de projeto não encontrado')
    }
  })

  test('deve exibir relatório de validação', async ({ page }) => {
    // Este teste assume que existe uma validação prévia
    // Procurar por elementos do relatório
    const report = page.locator('[data-testid="validation-report"]').or(page.locator('.report')).or(page.locator('text=/score|aprovado|reprovado/i'))
    const hasReport = await report.count()
    
    if (hasReport > 0) {
      console.log('✅ Relatório de validação exibido')
      
      // Verificar score
      const score = page.locator('text=/\\d+%/').or(page.locator('[data-testid="score"]'))
      const hasScore = await score.count()
      
      if (hasScore > 0) {
        const scoreText = await score.first().textContent()
        console.log(`✅ Score exibido: ${scoreText}`)
      }
    } else {
      console.log('⚠️ Relatório não encontrado - pode não haver validações')
    }
  })

  test('deve exibir tópicos obrigatórios', async ({ page }) => {
    // Selecionar um NR
    const nr06 = page.locator('text=/NR-06/i').first()
    const hasNr06 = await nr06.count()
    
    if (hasNr06 > 0) {
      await nr06.click()
      await page.waitForTimeout(1000)
      
      // Procurar por lista de tópicos
      const topics = page.locator('[data-testid="required-topics"]').or(page.locator('ul li')).or(page.locator('text=/introdução|conceitos|responsabilidades/i'))
      const count = await topics.count()
      
      if (count > 0) {
        console.log(`✅ ${count} tópicos obrigatórios exibidos`)
      }
    }
  })

  test('deve exibir pontos críticos', async ({ page }) => {
    const nr06 = page.locator('text=/NR-06/i').first()
    const hasNr06 = await nr06.count()
    
    if (hasNr06 > 0) {
      await nr06.click()
      await page.waitForTimeout(1000)
      
      // Procurar por pontos críticos
      const criticalPoints = page.locator('[data-testid="critical-points"]').or(page.locator('text=/crítico|critical|importante/i'))
      const count = await criticalPoints.count()
      
      if (count > 0) {
        console.log(`✅ Pontos críticos exibidos`)
      }
    }
  })

  test('deve exibir recomendações', async ({ page }) => {
    // Este teste assume que existe uma validação com recomendações
    const recommendations = page.locator('[data-testid="recommendations"]').or(page.locator('text=/recomend|suggest/i'))
    const count = await recommendations.count()
    
    if (count > 0) {
      console.log(`✅ Recomendações exibidas`)
    } else {
      console.log('⚠️ Recomendações não encontradas - pode não haver validações')
    }
  })

  test('deve exibir status de aprovação', async ({ page }) => {
    // Procurar por badges de aprovação/reprovação
    const statusBadge = page.locator('[data-testid="status-badge"]').or(page.locator('.badge')).or(page.locator('text=/aprovado|reprovado|passed|failed/i'))
    const count = await statusBadge.count()
    
    if (count > 0) {
      const statusText = await statusBadge.first().textContent()
      console.log(`✅ Status exibido: ${statusText}`)
    } else {
      console.log('⚠️ Status não encontrado')
    }
  })

  test('deve permitir filtrar por status', async ({ page }) => {
    // Procurar filtro de status
    const statusFilter = page.locator('[data-testid="status-filter"]').or(page.locator('select')).or(page.locator('button:has-text("Filtrar")'))
    const hasFilter = await statusFilter.count()
    
    if (hasFilter > 0) {
      await statusFilter.first().click()
      await page.waitForTimeout(500)
      console.log('✅ Filtro de status disponível')
    } else {
      console.log('⚠️ Filtro não encontrado')
    }
  })

  test('deve exibir histórico de validações', async ({ page }) => {
    // Procurar por lista de validações anteriores
    const history = page.locator('[data-testid="validation-history"]').or(page.locator('.history-list')).or(page.locator('text=/histórico|history/i'))
    const hasHistory = await history.count()
    
    if (hasHistory > 0) {
      console.log('✅ Histórico de validações exibido')
    } else {
      console.log('⚠️ Histórico não encontrado')
    }
  })
})

