/**
 * 🧪 E2E Tests - PPTX Processing Real
 * 
 * Testa o fluxo completo de processamento PPTX:
 * 1. Upload de arquivo PPTX
 * 2. Extração de metadados
 * 3. Extração de slides
 * 4. Extração de imagens
 * 5. Geração de thumbnails
 */

import path from 'path'
import fs from 'fs'
import { PPTXProcessorReal } from '@/lib/pptx/pptx-processor-real'

describe('E2E: PPTX Processing Real', () => {
  const fixturesDir = path.join(__dirname, '../pptx/fixtures')
  let processor: PPTXProcessorReal

  beforeAll(() => {
    processor = new PPTXProcessorReal()
  })

  describe('Fluxo Completo: Upload → Parsing → Extração', () => {
    it('deve processar PPTX válido do início ao fim', async () => {
      // ARRANGE: Carregar arquivo PPTX real
      const pptxPath = path.join(fixturesDir, 'with-metadata.pptx')
      const buffer = fs.readFileSync(pptxPath)

      // ACT: Processar PPTX completo
      const result = await processor.process(buffer)

      // ASSERT: Validar resultado completo
      expect(result).toBeDefined()
      expect(result.metadata).toBeDefined()
      expect(result.slides).toBeDefined()
      expect(result.slides.length).toBeGreaterThan(0)
      
      // Validar metadados extraídos
      expect(result.metadata.title).toBeTruthy()
      expect(result.metadata.slideCount).toBe(result.slides.length)
      
      // Validar primeiro slide
      const firstSlide = result.slides[0]
      expect(firstSlide.id).toBeTruthy()
      expect(firstSlide.elements).toBeDefined()
      
      // Validar estatísticas
      expect(result.stats).toBeDefined()
      expect(result.stats.totalSlides).toBe(result.slides.length)
      expect(result.stats.totalImages).toBeGreaterThanOrEqual(0)
      
      console.log('✅ Fluxo completo de PPTX processing validado')
    }, 30000) // 30s timeout

    it('deve extrair imagens reais e gerar thumbnails', async () => {
      // ARRANGE
      const pptxPath = path.join(fixturesDir, 'with-images.pptx')
      const buffer = fs.readFileSync(pptxPath)

      // ACT
      const result = await processor.process(buffer)

      // ASSERT: Validar extração de imagens
      const slidesWithImages = result.slides.filter(s => s.images && s.images.length > 0)
      expect(slidesWithImages.length).toBeGreaterThan(0)

      // Validar estrutura de imagem
      const firstSlideWithImage = slidesWithImages[0]
      const firstImage = firstSlideWithImage.images![0]
      expect(firstImage).toHaveProperty('path')
      expect(firstImage).toHaveProperty('type')

      // Validar thumbnail
      expect(result.thumbnail).toBeDefined()
      expect(result.thumbnail).toMatch(/^data:image\/(png|jpeg);base64,/)
      
      console.log('✅ Extração de imagens e thumbnails validada')
    }, 30000)

    it('deve detectar layouts de slides corretamente', async () => {
      // ARRANGE
      const pptxPath = path.join(fixturesDir, 'various-layouts.pptx')
      const buffer = fs.readFileSync(pptxPath)

      // ACT
      const result = await processor.process(buffer)

      // ASSERT: Validar detecção de layouts
      const layouts = result.slides.map(s => s.layout).filter(Boolean)
      expect(layouts.length).toBeGreaterThan(0)

      // Verificar variedade de layouts
      const uniqueLayouts = new Set(layouts)
      expect(uniqueLayouts.size).toBeGreaterThan(1)

      // Layouts comuns: title, title-content, two-column, image-only, blank
      const validLayouts = ['title', 'title-content', 'two-column', 'image-only', 'blank', 'section-header']
      layouts.forEach(layout => {
        expect(validLayouts).toContain(layout)
      })

      console.log('✅ Detecção de layouts validada')
    }, 30000)

    it('deve extrair animações quando presentes', async () => {
      // ARRANGE
      const pptxPath = path.join(fixturesDir, 'with-metadata.pptx')
      const buffer = fs.readFileSync(pptxPath)

      // ACT
      const result = await processor.process(buffer)

      // ASSERT: Validar extração de animações (se houver)
      const slidesWithAnimations = result.slides.filter(s => s.animations && s.animations.length > 0)
      
      if (slidesWithAnimations.length > 0) {
        const firstAnimation = slidesWithAnimations[0].animations![0]
        expect(firstAnimation).toHaveProperty('type')
        expect(firstAnimation).toHaveProperty('target')
        console.log('✅ Animações detectadas e extraídas')
      } else {
        console.log('⚠️ Nenhuma animação encontrada neste PPTX (esperado)')
      }
    }, 30000)

    it('deve calcular estatísticas corretas', async () => {
      // ARRANGE
      const pptxPath = path.join(fixturesDir, 'multi-slide.pptx')
      const buffer = fs.readFileSync(pptxPath)

      // ACT
      const result = await processor.process(buffer)

      // ASSERT: Validar estatísticas calculadas
      expect(result.stats.totalSlides).toBe(result.slides.length)
      expect(result.stats.totalImages).toBeGreaterThanOrEqual(0)
      expect(result.stats.totalCharts).toBeGreaterThanOrEqual(0)
      expect(result.stats.totalTables).toBeGreaterThanOrEqual(0)
      expect(result.stats.hasAnimations).toBeDefined()

      // Validar duração estimada
      expect(result.stats.estimatedDuration).toBeGreaterThan(0)
      expect(result.stats.estimatedDuration).toBe(result.slides.length * 5) // 5s por slide

      console.log('✅ Estatísticas validadas')
    }, 30000)
  })

  describe('Casos de Erro e Edge Cases', () => {
    it('deve lidar com PPTX sem metadados', async () => {
      // ARRANGE
      const pptxPath = path.join(fixturesDir, 'no-metadata.pptx')
      const buffer = fs.readFileSync(pptxPath)

      // ACT
      const result = await processor.process(buffer)

      // ASSERT: Deve processar mesmo sem metadados
      expect(result).toBeDefined()
      expect(result.slides.length).toBeGreaterThan(0)
      
      // Metadados podem estar vazios mas estrutura deve existir
      expect(result.metadata).toBeDefined()
      
      console.log('✅ PPTX sem metadados processado com sucesso')
    }, 30000)

    it('deve lidar com PPTX sem imagens', async () => {
      // ARRANGE
      const pptxPath = path.join(fixturesDir, 'text-content.pptx')
      const buffer = fs.readFileSync(pptxPath)

      // ACT
      const result = await processor.process(buffer)

      // ASSERT: Deve processar slides apenas com texto
      expect(result).toBeDefined()
      expect(result.slides.length).toBeGreaterThan(0)
      expect(result.stats.totalImages).toBe(0)

      // Thumbnail deve ser gerado mesmo sem imagens (SVG baseado em texto)
      expect(result.thumbnail).toBeDefined()
      
      console.log('✅ PPTX sem imagens processado com sucesso')
    }, 30000)

    it('deve rejeitar buffer vazio', async () => {
      // ARRANGE
      const emptyBuffer = Buffer.from([])

      // ACT & ASSERT
      await expect(processor.process(emptyBuffer)).rejects.toThrow()
      
      console.log('✅ Buffer vazio rejeitado corretamente')
    })

    it('deve rejeitar arquivo corrompido', async () => {
      // ARRANGE
      const corruptedBuffer = Buffer.from('not a valid pptx file')

      // ACT & ASSERT
      await expect(processor.process(corruptedBuffer)).rejects.toThrow()
      
      console.log('✅ Arquivo corrompido rejeitado corretamente')
    })
  })

  describe('Performance e Limites', () => {
    it('deve processar PPTX grande em tempo aceitável', async () => {
      // ARRANGE
      const pptxPath = path.join(fixturesDir, 'multi-slide.pptx')
      const buffer = fs.readFileSync(pptxPath)

      // ACT: Medir tempo de processamento
      const startTime = Date.now()
      const result = await processor.process(buffer)
      const duration = Date.now() - startTime

      // ASSERT: Deve processar em menos de 10 segundos
      expect(duration).toBeLessThan(10000)
      expect(result).toBeDefined()
      
      console.log(`✅ PPTX processado em ${duration}ms`)
    }, 15000)
  })
})

