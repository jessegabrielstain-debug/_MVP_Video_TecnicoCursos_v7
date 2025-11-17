/**
 * 🧪 Testes API PPTX - Validação Completa de Endpoints
 * 
 * Testes de integração para APIs de upload e conversão PPTX
 * Validação de fluxo completo do sistema
 */

import { POST as uploadPOST } from '@/app/api/pptx/upload/route';
import { POST as convertPOST } from '@/app/api/pptx/convert/route';
import { NextRequest } from 'next/server';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import path from 'path';
import JSZip from 'jszip';

// Mock do processador PPTX para testes
jest.mock('@/lib/pptx-processor', () => ({
  processPPTXFile: jest.fn(),
  validatePPTXFile: jest.fn()
}));

describe('PPTX API Tests', () => {
  const testDir = path.join(__dirname, 'fixtures');
  const testFile = 'test-presentation.pptx';

  beforeAll(() => {
    // Criar diretório de teste
    if (!existsSync(testDir)) {
      mkdirSync(testDir, { recursive: true });
    }

    // Configurar mocks
    const { processPPTXFile, validatePPTXFile } = require('@/lib/pptx-processor');
    
    validatePPTXFile.mockResolvedValue({ valid: true });
    processPPTXFile.mockResolvedValue({
      success: true,
      metadata: {
        title: 'Test Presentation',
        author: 'Test Author',
        slideCount: 3,
        createdAt: new Date(),
        modifiedAt: new Date(),
        fileSize: 12345,
        theme: 'Default'
      },
      slides: [
        {
          id: 'slide-1',
          slideNumber: 1,
          title: 'Test Slide 1',
          content: 'Test content 1',
          duration: 5,
          transition: 'fade'
        },
        {
          id: 'slide-2',
          slideNumber: 2,
          title: 'Test Slide 2',
          content: 'Test content 2',
          duration: 4,
          transition: 'slide'
        },
        {
          id: 'slide-3',
          slideNumber: 3,
          title: 'Test Slide 3',
          content: 'Test content 3',
          duration: 6,
          transition: 'fade'
        }
      ],
      thumbnails: [
        '/thumbnails/test_slide_1.png',
        '/thumbnails/test_slide_2.png',
        '/thumbnails/test_slide_3.png'
      ]
    });
  });

  describe('Upload API - POST /api/v1/pptx/upload', () => {
    test('should successfully upload and process PPTX', async () => {
      // Criar arquivo de teste
      const buffer = await createTestPPTXBuffer();
      const file = new File([buffer], testFile, {
        type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      });

      // Criar FormData
      const formData = new FormData();
      formData.append('file', file);
      formData.append('projectName', 'Test Project');

      // Criar request
      const request = new NextRequest('http://localhost:3000/api/v1/pptx/upload', {
        method: 'POST',
        body: formData
      });

      // Executar
      const response = await uploadPOST(request);
      const result = await response.json();

      // Validar
      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.projectId).toBeDefined();
      expect(result.projectName).toBe('Test Project');
      expect(result.totalSlides).toBe(3);
      expect(result.slides).toHaveLength(3);
    });

    test('should reject upload without file', async () => {
      const formData = new FormData();
      formData.append('projectName', 'Test Project');

      const request = new NextRequest('http://localhost:3000/api/v1/pptx/upload', {
        method: 'POST',
        body: formData
      });

      const response = await uploadPOST(request);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Nenhum arquivo enviado');
    });

    test('should reject non-PPTX files', async () => {
      const buffer = Buffer.from('Not a PPTX file');
      const file = new File([buffer], 'test.txt', { type: 'text/plain' });

      const formData = new FormData();
      formData.append('file', file);

      const request = new NextRequest('http://localhost:3000/api/v1/pptx/upload', {
        method: 'POST',
        body: formData
      });

      const response = await uploadPOST(request);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Apenas arquivos PPTX');
    });

    test('should reject files that are too large', async () => {
      // Criar arquivo grande simulado
      const largeBuffer = Buffer.alloc(51 * 1024 * 1024); // 51MB
      const file = new File([largeBuffer], 'large.pptx', {
        type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      });

      const formData = new FormData();
      formData.append('file', file);

      const request = new NextRequest('http://localhost:3000/api/v1/pptx/upload', {
        method: 'POST',
        body: formData
      });

      const response = await uploadPOST(request);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.success).toBe(false);
      expect(result.error).toContain('muito grande');
    });

    test('should handle processing errors gracefully', async () => {
      const { processPPTXFile } = require('@/lib/pptx-processor');
      processPPTXFile.mockResolvedValueOnce({
        success: false,
        error: 'Processing failed',
        slides: [],
        thumbnails: []
      });

      const buffer = await createTestPPTXBuffer();
      const file = new File([buffer], testFile, {
        type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      });

      const formData = new FormData();
      formData.append('file', file);

      const request = new NextRequest('http://localhost:3000/api/v1/pptx/upload', {
        method: 'POST',
        body: formData
      });

      const response = await uploadPOST(request);
      const result = await response.json();

      expect(response.status).toBe(500);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Processing failed');
    });
  });

  describe('Upload API - GET /api/v1/pptx/upload', () => {
    test('should return API status on test action', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/pptx/upload?action=test');

      const response = await uploadGET(request);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.message).toContain('funcionando');
      expect(result.features).toBeDefined();
      expect(result.maxFileSize).toBe('50MB');
    });

    test('should return method not supported for other actions', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/pptx/upload?action=invalid');

      const response = await uploadGET(request);
      const result = await response.json();

      expect(response.status).toBe(405);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Método não suportado');
    });
  });

  describe('Convert API - POST /api/v1/pptx/to-video', () => {
    test('should successfully convert PPTX to video timeline', async () => {
      const requestBody = {
        projectId: 'test-project-123',
        slides: [
          {
            id: 'slide-1',
            slideNumber: 1,
            title: 'Test Slide',
            content: 'Test content',
            duration: 5
          }
        ],
        options: {
          resolution: { width: 1920, height: 1080 },
          fps: 30,
          enableTTS: true,
          voice: 'pt-BR-Neural2-A'
        }
      };

      const request = new NextRequest('http://localhost:3000/api/v1/pptx/to-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      const response = await convertPOST(request);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.timeline).toBeDefined();
      expect(result.timeline.scenes).toHaveLength(1);
      expect(result.summary).toBeDefined();
    });

    test('should reject invalid request data', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/pptx/to-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });

      const response = await convertPOST(request);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Dados inválidos');
    });

    test('should handle multiple slides with different content', async () => {
      const slides = [
        { id: 'slide-1', slideNumber: 1, title: 'Slide 1', content: 'Content 1', duration: 5 },
        { id: 'slide-2', slideNumber: 2, title: 'Slide 2', content: 'Content 2', duration: 4 },
        { id: 'slide-3', slideNumber: 3, title: 'Slide 3', content: 'Content 3', duration: 6 }
      ];

      const requestBody = {
        projectId: 'multi-slide-test',
        slides,
        options: { enableTTS: false }
      };

      const request = new NextRequest('http://localhost:3000/api/v1/pptx/to-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      const response = await convertPOST(request);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.timeline.scenes).toHaveLength(3);
      
      // Verificar ordem dos slides
      result.timeline.scenes.forEach((scene: any, index: number) => {
        expect(scene.slideNumber).toBe(index + 1);
        expect(scene.title).toBe(`Slide ${index + 1}`);
      });
    });
  });

  describe('Convert API - GET /api/v1/pptx/to-video', () => {
    test('should return API status on test action', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/pptx/to-video?action=test');

      const response = await convertGET(request);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.message).toContain('funcionando');
      expect(result.supportedFeatures).toBeDefined();
      expect(result.defaultSettings).toBeDefined();
    });
  });

  describe('Integration Tests', () => {
    test('should handle complete upload-to-video workflow', async () => {
      // Step 1: Upload PPTX
      const buffer = await createTestPPTXBuffer();
      const file = new File([buffer], testFile, {
        type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      });

      const formData = new FormData();
      formData.append('file', file);
      formData.append('projectName', 'Integration Test');

      const uploadRequest = new NextRequest('http://localhost:3000/api/v1/pptx/upload', {
        method: 'POST',
        body: formData
      });

      const uploadResponse = await uploadPOST(uploadRequest);
      const uploadResult = await uploadResponse.json();

      expect(uploadResult.success).toBe(true);

      // Step 2: Convert to video
      const convertRequest = new NextRequest('http://localhost:3000/api/v1/pptx/to-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          projectId: uploadResult.projectId,
          slides: uploadResult.slides,
          options: {
            enableTTS: true,
            voice: 'pt-BR-Neural2-A'
          }
        })
      });

      const convertResponse = await convertPOST(convertRequest);
      const convertResult = await convertResponse.json();

      expect(convertResult.success).toBe(true);
      expect(convertResult.timeline.scenes).toHaveLength(uploadResult.slides.length);
    });
  });

  // Helper function para criar buffer PPTX de teste
  async function createTestPPTXBuffer(): Promise<ArrayBuffer> {
    const zip = new JSZip();

    // Estrutura mínima de PPTX
    zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
  <Override PartName="/ppt/slides/slide1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
</Types>`);

    zip.file('_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
</Relationships>`);

    zip.file('docProps/core.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>Test Presentation</dc:title>
  <dc:creator>Test Author</dc:creator>
  <dcterms:created xsi:type="dcterms:W3CDTF">${new Date().toISOString()}</dcterms:created>
  <dcterms:modified xsi:type="dcterms:W3CDTF">${new Date().toISOString()}</dcterms:modified>
</cp:coreProperties>`);

    zip.file('ppt/presentation.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:sldIdLst>
    <p:sldId id="256" r:id="rId2"/>
  </p:sldIdLst>
  <p:sldSz cx="9144000" cy="6858000"/>
</p:presentation>`);

    zip.file('ppt/slides/slide1.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
  <p:cSld>
    <p:spTree>
      <p:sp>
        <p:txBody>
          <a:p>
            <a:r>
              <a:t>Test Slide</a:t>
            </a:r>
          </a:p>
        </p:txBody>
      </p:sp>
    </p:spTree>
  </p:cSld>
</p:sld>`);

    return await zip.generateAsync({ type: 'arraybuffer' });
  }
});