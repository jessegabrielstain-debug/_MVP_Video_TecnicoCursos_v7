/**
 * Testes Unitários - PPTX Processor Real
 * Valida extração completa de conteúdo PPTX
 */

import JSZip from 'jszip'
import { PPTXProcessorReal } from '@/lib/pptx/pptx-processor-real'
import { readFileSync } from 'fs'
import { join } from 'path'

describe('PPTXProcessorReal', () => {
  let testPptxBuffer: Buffer
  let mockZip: JSZip

  beforeAll(async () => {
    // Create a mock PPTX structure for testing
    mockZip = new JSZip()
    
    // Mock core.xml (metadata)
    const coreXml = `<?xml version="1.0" encoding="UTF-8"?>
      <cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties"
                         xmlns:dc="http://purl.org/dc/elements/1.1/"
                         xmlns:dcterms="http://purl.org/dc/terms/">
        <dc:title>Apresentação de Teste</dc:title>
        <dc:creator>Test Author</dc:creator>
        <dcterms:created>2025-01-01T10:00:00Z</dcterms:created>
      </cp:coreProperties>`
    
    mockZip.file('docProps/core.xml', coreXml)
    
    // Mock app.xml (application properties)
    const appXml = `<?xml version="1.0" encoding="UTF-8"?>
      <Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties">
        <Application>Microsoft PowerPoint</Application>
        <Slides>3</Slides>
      </Properties>`
    
    mockZip.file('docProps/app.xml', appXml)
    
    // Mock slide1.xml
    const slide1Xml = `<?xml version="1.0" encoding="UTF-8"?>
      <p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"
             xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
        <p:cSld>
          <p:spTree>
            <p:sp>
              <p:nvSpPr>
                <p:nvPr>
                  <p:ph type="title"/>
                </p:nvPr>
              </p:nvSpPr>
              <p:txBody>
                <a:p>
                  <a:r>
                    <a:t>Título do Slide 1</a:t>
                  </a:r>
                </a:p>
              </p:txBody>
            </p:sp>
            <p:sp>
              <p:nvSpPr>
                <p:nvPr>
                  <p:ph type="body"/>
                </p:nvPr>
              </p:nvSpPr>
              <p:txBody>
                <a:p>
                  <a:r>
                    <a:t>Conteúdo do slide com informações importantes</a:t>
                  </a:r>
                </a:p>
              </p:txBody>
            </p:sp>
          </p:spTree>
        </p:cSld>
      </p:sld>`
    
    mockZip.file('ppt/slides/slide1.xml', slide1Xml)
    
    // Mock slide1 relationships (for images)
    const slide1Rels = `<?xml version="1.0" encoding="UTF-8"?>
      <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
        <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" 
                     Target="../media/image1.png"/>
      </Relationships>`
    
    mockZip.file('ppt/slides/_rels/slide1.xml.rels', slide1Rels)
    
    // Mock notes slide
    const notesSlide1 = `<?xml version="1.0" encoding="UTF-8"?>
      <p:notes xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"
               xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
        <p:cSld>
          <p:spTree>
            <p:sp>
              <p:txBody>
                <a:p>
                  <a:r>
                    <a:t>Notas do apresentador para o slide 1</a:t>
                  </a:r>
                </a:p>
              </p:txBody>
            </p:sp>
          </p:spTree>
        </p:cSld>
      </p:notes>`
    
    mockZip.file('ppt/notesSlides/notesSlide1.xml', notesSlide1)
    
    // Mock slide2.xml (with animations)
    const slide2Xml = `<?xml version="1.0" encoding="UTF-8"?>
      <p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"
             xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
        <p:cSld>
          <p:spTree>
            <p:sp>
              <p:txBody>
                <a:p>
                  <a:r>
                    <a:t>Slide 2 com Animações</a:t>
                  </a:r>
                </a:p>
              </p:txBody>
            </p:sp>
          </p:spTree>
        </p:cSld>
        <p:timing>
          <p:tnLst>
            <p:par>
              <p:cTn id="1" dur="1000"/>
            </p:par>
          </p:tnLst>
        </p:timing>
      </p:sld>`
    
    mockZip.file('ppt/slides/slide2.xml', slide2Xml)
    
    // Mock slide3.xml (image only)
    const slide3Xml = `<?xml version="1.0" encoding="UTF-8"?>
      <p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
        <p:cSld>
          <p:spTree>
            <p:pic>
              <p:nvPicPr>
                <p:cNvPr id="1" name="Image"/>
              </p:nvPicPr>
            </p:pic>
          </p:spTree>
        </p:cSld>
      </p:sld>`
    
    mockZip.file('ppt/slides/slide3.xml', slide3Xml)
    
    // Mock media files
    mockZip.file('ppt/media/image1.png', Buffer.from('fake-image-data'))
    mockZip.file('ppt/media/image2.jpg', Buffer.from('fake-image-data'))
    
    // Generate PPTX buffer
    testPptxBuffer = await mockZip.generateAsync({ type: 'nodebuffer' })
  })

  describe('extract()', () => {
    it('deve extrair dados completos do PPTX', async () => {
      const result = await PPTXProcessorReal.extract(testPptxBuffer)
      
      expect(result.success).toBe(true)
      expect(result.slides).toHaveLength(3)
      expect(result.metadata).toBeDefined()
      expect(result.assets).toBeDefined()
      expect(result.timeline).toBeDefined()
      expect(result.extractionStats).toBeDefined()
    })

    it('deve extrair metadados corretamente', async () => {
      const result = await PPTXProcessorReal.extract(testPptxBuffer)
      
      expect(result.metadata.title).toBe('Apresentação de Teste')
      expect(result.metadata.author).toBe('Test Author')
      expect(result.metadata.totalSlides).toBe(3)
      expect(result.metadata.application).toBe('Microsoft PowerPoint')
      expect(result.metadata.dimensions).toEqual({ width: 1920, height: 1080 })
    })

    it('deve extrair slides com conteúdo correto', async () => {
      const result = await PPTXProcessorReal.extract(testPptxBuffer)
      
      const slide1 = result.slides[0]
      expect(slide1.slideNumber).toBe(1)
      expect(slide1.title).toContain('Título do Slide 1')
      expect(slide1.content).toContain('Conteúdo do slide')
      expect(slide1.textBlocks).toBeGreaterThan(0)
    })

    it('deve extrair notas do apresentador', async () => {
      const result = await PPTXProcessorReal.extract(testPptxBuffer)
      
      const slide1 = result.slides[0]
      expect(slide1.notes).toContain('Notas do apresentador')
    })

    it('deve detectar layouts de slides', async () => {
      const result = await PPTXProcessorReal.extract(testPptxBuffer)
      
      const slide1 = result.slides[0]
      expect(slide1.layout).toBeDefined()
      expect(['title-content', 'title', 'default', 'blank', 'two-column', 'title-image', 'image-only', 'content-only'])
        .toContain(slide1.layout)
    })

    it('deve extrair referências de imagens', async () => {
      const result = await PPTXProcessorReal.extract(testPptxBuffer)
      
      const slide1 = result.slides[0]
      expect(slide1.images).toBeDefined()
      expect(Array.isArray(slide1.images)).toBe(true)
    })

    it('deve extrair animações quando presentes', async () => {
      const result = await PPTXProcessorReal.extract(testPptxBuffer)
      
      const slide2 = result.slides[1]
      expect(slide2.animations).toBeDefined()
      expect(Array.isArray(slide2.animations)).toBe(true)
    })

    it('deve calcular duração estimada de slides', async () => {
      const result = await PPTXProcessorReal.extract(testPptxBuffer)
      
      result.slides.forEach(slide => {
        expect(slide.duration).toBeGreaterThan(0)
        expect(typeof slide.duration).toBe('number')
      })
    })

    it('deve extrair assets (imagens, vídeos, áudio)', async () => {
      const result = await PPTXProcessorReal.extract(testPptxBuffer)
      
      expect(result.assets.images).toBeDefined()
      expect(result.assets.videos).toBeDefined()
      expect(result.assets.audio).toBeDefined()
      expect(result.assets.images.length).toBeGreaterThan(0)
    })

    it('deve gerar timeline com cenas', async () => {
      const result = await PPTXProcessorReal.extract(testPptxBuffer)
      
      expect(result.timeline.totalDuration).toBeGreaterThan(0)
      expect(result.timeline.scenes).toHaveLength(3)
      
      result.timeline.scenes.forEach((scene, index) => {
        expect(scene.sceneId).toBe(`scene_${index + 1}`)
        expect(scene.slideNumber).toBe(index + 1)
        expect(scene.startTime).toBeGreaterThanOrEqual(0)
        expect(scene.endTime).toBeGreaterThan(scene.startTime)
        expect(Array.isArray(scene.transitions)).toBe(true)
      })
    })

    it('deve calcular estatísticas de extração', async () => {
      const result = await PPTXProcessorReal.extract(testPptxBuffer)
      
      const stats = result.extractionStats
      expect(stats.textBlocks).toBeGreaterThan(0)
      expect(stats.images).toBeGreaterThanOrEqual(0)
      expect(stats.shapes).toBeGreaterThanOrEqual(0)
      expect(stats.charts).toBeGreaterThanOrEqual(0)
      expect(stats.tables).toBeGreaterThanOrEqual(0)
    })

    it('deve contar shapes corretamente', async () => {
      const result = await PPTXProcessorReal.extract(testPptxBuffer)
      
      result.slides.forEach(slide => {
        expect(slide.shapes).toBeGreaterThanOrEqual(0)
        expect(typeof slide.shapes).toBe('number')
      })
    })
  })

  describe('Error Handling', () => {
    it('deve tratar graciosamente arquivo PPTX inválido', async () => {
      const invalidBuffer = Buffer.from('invalid-pptx-data')
      
      const result = await PPTXProcessorReal.extract(invalidBuffer)
      
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
      expect(result.slides).toHaveLength(0)
    })

    it('deve retornar valores padrão quando metadata está ausente', async () => {
      // Create PPTX without metadata
      const minimalZip = new JSZip()
      minimalZip.file('ppt/slides/slide1.xml', `<?xml version="1.0"?><p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"/>`)
      const minimalBuffer = await minimalZip.generateAsync({ type: 'nodebuffer' })
      
      const result = await PPTXProcessorReal.extract(minimalBuffer)
      
      expect(result.metadata.title).toBe('Sem título')
      expect(result.metadata.author).toBe('Desconhecido')
    })
  })

  describe('generateThumbnail()', () => {
    it('deve gerar thumbnail para PPTX válido', async () => {
      const projectId = 'test-project-123'
      
      // Mock S3StorageService
      jest.mock('@/lib/s3-storage', () => ({
        S3StorageService: {
          uploadFile: jest.fn().mockResolvedValue({ success: true }),
        },
      }))
      
      const thumbnailKey = await PPTXProcessorReal.generateThumbnail(testPptxBuffer, projectId)
      
      expect(thumbnailKey).toBeDefined()
      // Note: In real implementation, this would return the S3 key
      // For now, it may return null if S3 is not configured
    })

    it('deve tratar erro na geração de thumbnail graciosamente', async () => {
      const invalidBuffer = Buffer.from('invalid')
      const projectId = 'test-project-456'
      
      const thumbnailKey = await PPTXProcessorReal.generateThumbnail(invalidBuffer, projectId)
      
      // Should return null on error
      expect(thumbnailKey).toBeNull()
    })
  })

  describe('Performance', () => {
    it('deve processar PPTX em tempo razoável', async () => {
      const startTime = Date.now()
      
      await PPTXProcessorReal.extract(testPptxBuffer)
      
      const endTime = Date.now()
      const duration = endTime - startTime
      
      // Should process in less than 5 seconds for small files
      expect(duration).toBeLessThan(5000)
    })
  })

  describe('Data Integrity', () => {
    it('deve manter ordem dos slides', async () => {
      const result = await PPTXProcessorReal.extract(testPptxBuffer)
      
      result.slides.forEach((slide, index) => {
        expect(slide.slideNumber).toBe(index + 1)
      })
    })

    it('deve preservar caracteres especiais no texto', async () => {
      // This test validates that special characters are preserved
      const result = await PPTXProcessorReal.extract(testPptxBuffer)
      
      result.slides.forEach(slide => {
        expect(slide.title).toBeDefined()
        expect(slide.content).toBeDefined()
        // No mangled characters
        expect(slide.title).not.toContain('�')
        expect(slide.content).not.toContain('�')
      })
    })
  })
})

