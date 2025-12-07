// TODO: Test file - fix types
/**
 * 🧪 Testes unitários para processamento PPTX real
 * FASE 1: PPTX Processing Real
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import fs from 'fs'
import path from 'path'
import { processPPTXFile, validatePPTXFile } from '@/lib/pptx-processor';
import { extractTextFromSlide } from '@/lib/pptx/parsers/text-parser';
import { PPTXImageParser } from '@/lib/pptx/parsers/image-parser';
import { detectSlideLayout } from '@/lib/pptx/parsers/layout-parser';
import { type ProgressStage, type ProgressUpdate } from '@/lib/definitions';
import { createFileObject, cleanupTestFiles } from './test-helpers';
import JSZip from 'jszip'

describe('PPTX Processing Real - Fase 1', () => {
  let testPptxBuffer: Buffer
  let testPptxFile: File
  let testZip: JSZip
  const projectId = 'test-project-pptx'
  const testDir = path.resolve(__dirname, 'fixtures');
  const testPptxPath = path.join(testDir, 'test-presentation-processing.pptx');

  beforeAll(async () => {
    fs.mkdirSync(testDir, { recursive: true })
    await createTestPPTXForProcessing(testPptxPath);
    if (!fs.existsSync(testPptxPath)) {
      throw new Error('Test PPTX file could not be created or read.');
    }

    testPptxBuffer = fs.readFileSync(testPptxPath);
    testZip = await JSZip.loadAsync(testPptxBuffer);
    testPptxFile = await createFileObject(testPptxPath);
  });

  afterAll(() => {
    cleanupTestFiles([testPptxPath]);
  });

  describe('PPTXProcessor', () => {
    test('deve validar arquivo PPTX corretamente', async () => {
      const file = await createFileObject(testPptxPath);
      const validation = await validatePPTXFile(file);
      
      expect(validation.valid).toBe(true);
      expect(validation.error).toBeUndefined();
    });

    test('deve rejeitar arquivo inválido', async () => {
      const invalidPath = path.join(__dirname, '..', 'fixtures', 'invalid.txt');
      fs.writeFileSync(invalidPath, 'invalid content');
      const file = await createFileObject(invalidPath);
      const validation = await validatePPTXFile(file);

      expect(validation.valid).toBe(false);
      expect(validation.error).toBeDefined();
      fs.unlinkSync(invalidPath);
    });

    test('deve processar PPTX completo com sucesso', async () => {
      const result = await processPPTXFile(testPptxFile, projectId);

      expect(result.success).toBe(true);
      expect(result.metadata).toBeDefined();
      expect(result.metadata?.slideCount).toBe(5);
      expect(result.metadata?.title).toBe('Apresentação de Teste - PPTX Processing');
      expect(result.metadata?.author).toBe('Sistema de Teste');
      expect(result.slides).toHaveLength(5);
    });

    test('deve gerar timeline corretamente', async () => {
      const result = await processPPTXFile(testPptxFile, projectId);

      expect(result.success).toBe(true);
      expect(result.thumbnails).toBeDefined();
      expect(result.thumbnails?.length).toBe(5)
    })

    test('deve calcular estatísticas corretamente', async () => {
      const result = await processPPTXFile(testPptxFile, projectId, { defaultDuration: 6 });

      expect(result.success).toBe(true)
      expect(result.slides).toBeDefined()
      expect(result.slides?.every((slide) => slide.duration === 6)).toBe(true)
    })
  })

  describe('PPTXTextParser', () => {
    it('deve extrair texto do slide 1', async () => {
      const textResult = await extractTextFromSlide(testZip, 1)

      expect(textResult.success).toBe(true)
      expect(textResult.plainText).toBeDefined()
      expect(textResult.plainText!).toContain('Slide 1 Title')
      expect(textResult.wordCount).toBeGreaterThan(0)
      expect(textResult.characterCount).toBeGreaterThan(0)
    })

    it('deve extrair texto do slide 2 com bullets', async () => {
      const textResult = await extractTextFromSlide(testZip, 2)
      
      expect(textResult.success).toBe(true)
      expect(textResult.plainText).toBeDefined()
      expect(Array.isArray(textResult.bulletPoints)).toBe(true)
    })

    it('deve extrair texto de todos os slides', async () => {
      for (let i = 1; i <= 5; i++) {
        const textResult = await extractTextFromSlide(testZip, i)
        
        expect(textResult.success).toBe(true)
        expect(textResult.plainText).toBeDefined()
        expect(textResult.plainText!.length).toBeGreaterThan(0)
      }
    })

    it('deve retornar erro para slide inexistente', async () => {
      const textResult = await extractTextFromSlide(testZip, 99)
      
      expect(textResult.success).toBe(false)
      expect(textResult.error).toContain('não encontrado')
    })

    it('deve extrair textboxes com formatação', async () => {
      const textResult = await extractTextFromSlide(testZip, 1)
      
      expect(textResult.success).toBe(true)
      expect(Array.isArray(textResult.textBoxes)).toBe(true)
      
      if (textResult.textBoxes && textResult.textBoxes.length > 0) {
        const firstTextBox = textResult.textBoxes[0]
        expect(firstTextBox.id).toBeDefined()
        expect(firstTextBox.text).toBeDefined()
        expect(firstTextBox.position).toBeDefined()
      }
    })
  })

  describe('PPTXImageParser', () => {
    it('deve processar extração de imagens sem erro', async () => {
      const imageResult = await PPTXImageParser.extractImages(
        testZip,
        'test-project-images',
        {
          uploadToS3: false,
          generateThumbnails: false
        }
      )

      expect(imageResult.success).toBe(true)
      expect(imageResult.totalImages).toBe(0) // PPTX de teste não tem imagens
      expect(imageResult.errors).toHaveLength(0)
    })

    it('deve gerar thumbnail corretamente', async () => {
      // Usar sharp para criar uma imagem válida para teste
      const sharp = require('sharp')
      const testImageBuffer = await sharp({
        create: {
          width: 100,
          height: 100,
          channels: 3,
          background: { r: 255, g: 0, b: 0 }
        }
      }).png().toBuffer()
      
      const thumbnail = await PPTXImageParser.generateThumbnail(testImageBuffer, 150, 150)
      
      expect(thumbnail).toBeDefined()
      expect(Buffer.isBuffer(thumbnail)).toBe(true)
    })
  })

  describe('PPTXLayoutParser', () => {
    it('deve detectar layout do slide 1', async () => {
      const layoutResult = await detectSlideLayout(testZip, 1)
      
      expect(layoutResult.success).toBe(true)
      expect(layoutResult.layout).toBeDefined()
      expect(layoutResult.layout?.name).toBeDefined()
      expect(layoutResult.layout?.type).toBeDefined()
    })

    it('deve detectar layouts de todos os slides', async () => {
      for (let i = 1; i <= 5; i++) {
        const layoutResult = await detectSlideLayout(testZip, i)
        
        expect(layoutResult.success).toBe(true)
        expect(layoutResult.layout).toBeDefined()
        expect(layoutResult.layout?.name).toBeDefined()
      }
    })

    it('deve extrair elementos do slide', async () => {
      const layoutResult = await detectSlideLayout(testZip, 1)
      
      expect(layoutResult.success).toBe(true)
      expect(layoutResult.elements).toBeDefined()
      expect(Array.isArray(layoutResult.elements)).toBe(true)
    })

    it('deve retornar erro para slide inexistente', async () => {
      const layoutResult = await detectSlideLayout(testZip, 99)
      
      expect(layoutResult.success).toBe(false)
      expect(layoutResult.error).toContain('não encontrado')
    })
  })

  describe('Integração completa', () => {
    it('deve processar PPTX com todas as opções habilitadas', async () => {
      const result = await processPPTXFile(testPptxFile, projectId, {
        defaultDuration: 4,
        transition: { type: 'fade', duration: 0.5 },
      });

      expect(result.success).toBe(true)
      expect(result.metadata?.slideCount).toBe(5)
      expect(result.slides).toHaveLength(5)
      expect(result.thumbnails).toHaveLength(5)
    })

    it('deve manter consistência entre metadados e slides', async () => {
      const result = await processPPTXFile(testPptxFile, projectId)

      expect(result.success).toBe(true)
      expect(result.metadata?.slideCount).toBe(result.slides?.length)
    })

    it('deve processar com callback de progresso', async () => {
      const progressUpdates: ProgressStage[] = []
      
      const result = await processPPTXFile(
        testPptxFile,
        projectId,
        {},
        (progress: ProgressUpdate) => {
          progressUpdates.push(progress.stage)
        }
      )

      expect(result.success).toBe(true)
      expect(progressUpdates.length).toBeGreaterThan(0)
      expect(progressUpdates).toContain('initializing')
      expect(progressUpdates).toContain('parsing')
      expect(progressUpdates).toContain('processing-slides')
      expect(progressUpdates).toContain('finalizing')
    })
  })

  // Helper function para criar um PPTX de teste para a suíte de processing
  async function createTestPPTXForProcessing(filePath: string) {
    const zip = new JSZip();
    const slideCount = 5;

    // --- Arquivos Estruturais ---
    zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
    <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
    <Default Extension="xml" ContentType="application/xml"/>
    <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
    ${Array.from({ length: slideCount }, (_, i) => `<Override PartName="/ppt/slides/slide${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`).join('\n')}
    <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
</Types>`);

    zip.file('_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
    <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>
    <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
</Relationships>`);

    zip.file('docProps/core.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/">
    <dc:title>Apresentação de Teste - PPTX Processing</dc:title>
    <dc:creator>Sistema de Teste</dc:creator>
    <dcterms:created>${new Date().toISOString()}</dcterms:created>
</cp:coreProperties>`);

    // --- Apresentação e Relações ---
    zip.file('ppt/presentation.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
    <p:sldIdLst>
        ${Array.from({ length: slideCount }, (_, i) => `<p:sldId id="${256 + i}" r:id="rId${i + 2}"/>`).join('\n')}
    </p:sldIdLst>
</p:presentation>`);

    zip.file('ppt/_rels/presentation.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
    ${Array.from({ length: slideCount }, (_, i) => `<Relationship Id="rId${i + 2}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide${i + 1}.xml"/>`).join('\n')}
</Relationships>`);

    // --- Slides ---
    for (let i = 1; i <= slideCount; i++) {
        zip.file(`ppt/slides/slide${i}.xml`, `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
    <p:cSld>
        <p:spTree>
            <p:sp>
                <p:spPr>
                    <a:xfrm>
                        <a:off x="0" y="0"/>
                        <a:ext cx="1000000" cy="1000000"/>
                    </a:xfrm>
                </p:spPr>
                <p:txBody>
                    <a:p><a:r><a:t>Slide ${i} Title</a:t></a:r></a:p>
                    <a:p><a:r><a:t>Content for slide ${i}.</a:t></a:r></a:p>
                    ${i === 2 ? `<a:p><a:r><a:t>• Bullet point 1</a:t></a:r></a:p><a:p><a:r><a:t>• Bullet point 2</a:t></a:r></a:p>` : ''}
                </p:txBody>
            </p:sp>
        </p:spTree>
    </p:cSld>
</p:sld>`);
    }

    const content = await zip.generateAsync({ type: 'nodebuffer' });
    fs.writeFileSync(filePath, content);
  }
})