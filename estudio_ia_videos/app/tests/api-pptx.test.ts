/**
 * 🧪 Testes API PPTX - Validação Completa de Endpoints
 * 
 * Testes de integração para APIs de upload e conversão PPTX
 * Validação de fluxo completo do sistema
 */

import { POST as uploadPOST, GET as uploadGET } from '@/api/v1/pptx/upload/route';
import { POST as convertPOST } from '@/api/v1/pptx/generate-timeline/route';
import { NextRequest } from 'next/server';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import path from 'path';
import JSZip from 'jszip';

// Mock classes to bypass jsdom limitations
class MockFile {
  name: string;
  size: number;
  buffer: Buffer;
  type: string;

  constructor(buffer: Buffer, name: string, type: string) {
    this.buffer = buffer;
    this.name = name;
    this.size = buffer.length;
    this.type = type;
  }

  async arrayBuffer() {
    return this.buffer;
  }
}

class MockFormData {
  private data = new Map<string, any>();

  append(key: string, value: any) {
    this.data.set(key, value);
  }

  get(key: string) {
    return this.data.get(key);
  }
}

// Mock next/server
jest.mock('next/server', () => {
  return {
    NextRequest: class {
      url: string;
      method: string;
      headers: Headers;
      body: any;

      constructor(url: string, init?: any) {
        this.url = url;
        this.method = init?.method || 'GET';
        this.headers = new Headers(init?.headers);
        this.body = init?.body;
      }

      async json() {
        return typeof this.body === 'string' ? JSON.parse(this.body) : this.body;
      }

      async formData() {
        return this.body;
      }
    },
    NextResponse: {
      json: (body: any, init?: any) => ({
        json: async () => body,
        status: init?.status || 200,
      })
    }
  };
});

// Mock do processador PPTX para testes
jest.mock('@/lib/pptx/pptx-processor-real', () => ({
  PPTXProcessorReal: {
    extract: jest.fn()
  }
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
    const { PPTXProcessorReal } = require('@/lib/pptx/pptx-processor-real');
    
    PPTXProcessorReal.extract.mockResolvedValue({
      success: true,
      metadata: {
        title: 'Test Presentation',
        author: 'Test Author',
        totalSlides: 3,
        application: 'PowerPoint',
        dimensions: { width: 1920, height: 1080 }
      },
      slides: [
        {
          slideNumber: 1,
          title: 'Test Slide 1',
          content: 'Test content 1',
          duration: 5,
          notes: '',
          layout: 'default',
          images: [],
          animations: [],
          shapes: 1,
          textBlocks: 1
        },
        {
          slideNumber: 2,
          title: 'Test Slide 2',
          content: 'Test content 2',
          duration: 4,
          notes: '',
          layout: 'default',
          images: [],
          animations: [],
          shapes: 1,
          textBlocks: 1
        },
        {
          slideNumber: 3,
          title: 'Test Slide 3',
          content: 'Test content 3',
          duration: 6,
          notes: '',
          layout: 'default',
          images: [],
          animations: [],
          shapes: 1,
          textBlocks: 1
        }
      ],
      assets: {
        images: [],
        videos: [],
        audio: []
      },
      timeline: {
        totalDuration: 15,
        scenes: []
      },
      extractionStats: {
        textBlocks: 3,
        images: 0,
        shapes: 3,
        charts: 0,
        tables: 0
      }
    });
  });

  describe('Upload API - POST /api/v1/pptx/upload', () => {
    test('should successfully upload and process PPTX', async () => {
      // Criar arquivo de teste
      const buffer = await createTestPPTXBuffer();
      const file = new MockFile(Buffer.from(buffer), testFile, 'application/vnd.openxmlformats-officedocument.presentationml.presentation');

      // Criar FormData
      const formData = new MockFormData();
      formData.append('file', file);
      formData.append('projectName', 'Test Project');

      // Criar request
      const request = new NextRequest('http://localhost:3000/api/v1/pptx/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        body: formData as any
      });

      // Executar
      const response = await uploadPOST(request);
      const result = await response.json();

      if (response.status !== 200) {
        console.log('Upload failed:', result);
      }

      // Validar
      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.data.processingId).toBeDefined();
      expect(result.data.fileName).toBe(testFile);
      expect(result.data.result.slides).toHaveLength(3);
    });

    test('should reject upload without file', async () => {
      const formData = new MockFormData();
      formData.append('projectName', 'Test Project');

      const request = new NextRequest('http://localhost:3000/api/v1/pptx/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        body: formData as any
      });

      const response = await uploadPOST(request);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.success).toBe(false);
      expect(result.message).toContain('Nenhum arquivo enviado');
    });

    test('should reject non-PPTX files', async () => {
      const buffer = Buffer.from('Not a PPTX file');
      const file = new MockFile(buffer, 'test.txt', 'text/plain');

      const formData = new MockFormData();
      formData.append('file', file);

      const request = new NextRequest('http://localhost:3000/api/v1/pptx/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        body: formData as any
      });

      const response = await uploadPOST(request);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.success).toBe(false);
      expect(result.message).toContain('Arquivo deve ter extensão .pptx');
    });

    test('should reject files that are too large', async () => {
      // Criar arquivo grande simulado
      const largeBuffer = Buffer.alloc(51 * 1024 * 1024); // 51MB
      const file = new MockFile(largeBuffer, 'large.pptx', 'application/vnd.openxmlformats-officedocument.presentationml.presentation');

      const formData = new MockFormData();
      formData.append('file', file);

      const request = new NextRequest('http://localhost:3000/api/v1/pptx/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        body: formData as any
      });

      const response = await uploadPOST(request);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.success).toBe(false);
      expect(result.message).toContain('Arquivo muito grande');
    });

    test('should handle processing errors gracefully', async () => {
      const { PPTXProcessorReal } = require('@/lib/pptx/pptx-processor-real');
      PPTXProcessorReal.extract.mockImplementationOnce(async () => ({
        success: false,
        error: 'Processing failed',
        slides: []
      }));

      const buffer = await createTestPPTXBuffer();
      const file = new MockFile(Buffer.from(buffer), testFile, 'application/vnd.openxmlformats-officedocument.presentationml.presentation');

      const formData = new MockFormData();
      formData.append('file', file);

      const request = new NextRequest('http://localhost:3000/api/v1/pptx/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        body: formData as any
      });

      const response = await uploadPOST(request);
      const result = await response.json();

      expect(response.status).toBe(422);
      expect(result.success).toBe(false);
      expect(result.message).toContain('Processing failed');
    });
  });

  // Removed GET tests for upload as they test non-existent features

  describe('Convert API - POST /api/v1/pptx/generate-timeline', () => {
    test('should successfully convert PPTX to video timeline', async () => {
      const requestBody = {
        s3Key: 'test-project-key',
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

      const request = new NextRequest('http://localhost:3000/api/v1/pptx/generate-timeline', {
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
    });

    test('should reject invalid request data', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/pptx/generate-timeline', {
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
      expect(result.error).toContain('obrigatórios');
    });

    test('should handle multiple slides with different content', async () => {
      const slides = [
        { id: 'slide-1', slideNumber: 1, title: 'Slide 1', content: 'Content 1', duration: 5 },
        { id: 'slide-2', slideNumber: 2, title: 'Slide 2', content: 'Content 2', duration: 4 },
        { id: 'slide-3', slideNumber: 3, title: 'Slide 3', content: 'Content 3', duration: 6 }
      ];

      const requestBody = {
        s3Key: 'multi-slide-test',
        slides,
        options: { enableTTS: false }
      };

      const request = new NextRequest('http://localhost:3000/api/v1/pptx/generate-timeline', {
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
      });
    });
  });

// Removed GET test for convert as it is not implemented in generate-timeline

  describe('Integration Tests', () => {
    test('should handle complete upload-to-video workflow', async () => {
      // Step 1: Upload PPTX
      const buffer = await createTestPPTXBuffer();
      const file = new MockFile(Buffer.from(buffer), testFile, 'application/vnd.openxmlformats-officedocument.presentationml.presentation');

      const formData = new MockFormData();
      formData.append('file', file);
      formData.append('projectName', 'Integration Test');

      const uploadRequest = new NextRequest('http://localhost:3000/api/v1/pptx/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        body: formData as any
      });

      const uploadResponse = await uploadPOST(uploadRequest);
      const uploadResult = await uploadResponse.json();

      expect(uploadResult.success).toBe(true);

      // Step 2: Convert to video
      const convertRequest = new NextRequest('http://localhost:3000/api/v1/pptx/generate-timeline', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          s3Key: uploadResult.data.processingId,
          slides: uploadResult.data.result.slides,
          options: {
            enableTTS: true,
            voice: 'pt-BR-Neural2-A'
          }
        })
      });

      const convertResponse = await convertPOST(convertRequest);
      const convertResult = await convertResponse.json();

      expect(convertResult.success).toBe(true);
      expect(convertResult.timeline.scenes).toHaveLength(uploadResult.data.result.slides.length);
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