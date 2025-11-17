/**
 * Testes Funcionais para PPTXParser
 * Implementação completa de testes unitários e de integração
 */

import { PPTXParser } from '@/lib/pptx/pptx-parser';
import JSZip from 'jszip';

// Mock completo do JSZip
jest.mock('jszip');

const mockJszipInstance = {
  file: jest.fn(),
  generateAsync: jest.fn(),
};

const mockCoreXml = `
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <dc:title>Apresentação de Teste</dc:title>
  <dc:creator>João Silva</dc:creator>
  <dc:subject>Teste de Parser</dc:subject>
</cp:coreProperties>`;

const mockPresentationXml = `
<p:presentation xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <p:sldIdLst>
    <p:sldId id="256" r:id="rId2"/>
    <p:sldId id="257" r:id="rId3"/>
  </p:sldIdLst>
</p:presentation>`;

const mockSlide1Xml = `
<p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
  <p:cSld><p:spTree><p:sp><p:txBody>
    <a:p><a:r><a:t>Título do Slide 1</a:t></a:r></a:p>
    <a:p><a:r><a:t>Conteúdo do slide 1.</a:t></a:r></a:p>
  </p:txBody></p:sp></p:spTree></p:cSld>
</p:sld>`;

const mockSlide2Xml = `
<p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
  <p:cSld><p:spTree><p:sp><p:txBody>
    <a:p><a:r><a:t>Título do Slide 2</a:t></a:r></a:p>
  </p:txBody></p:sp></p:spTree></p:cSld>
</p:sld>`;


describe('PPTXParser', () => {
  let parser: PPTXParser;

  beforeEach(() => {
    // Reset mocks before each test
    (JSZip.loadAsync as jest.Mock).mockClear();
    mockJszipInstance.file.mockClear();
    mockJszipInstance.generateAsync.mockClear();
    
    // Default mock implementation
    (JSZip.loadAsync as jest.Mock).mockResolvedValue(mockJszipInstance);
    parser = new PPTXParser();
  });

  describe('Validação de Arquivo', () => {
    test('deve validar arquivo PPTX válido', async () => {
        mockJszipInstance.file.mockImplementation((name: string) => {
            const files: { [key: string]: any } = {
                '[Content_Types].xml': {},
                '_rels/.rels': {},
                'ppt/presentation.xml': {},
            };
            return files[name];
        });
        const isValid = await PPTXParser.validatePPTX(Buffer.from('qualquercoisa'));
        expect(isValid).toBe(true);
    });

    test('deve rejeitar arquivo PPTX inválido por falta de arquivos essenciais', async () => {
        mockJszipInstance.file.mockReturnValue(undefined); // Simula arquivo não encontrado
        const isValid = await PPTXParser.validatePPTX(Buffer.from('qualquercoisa'));
        expect(isValid).toBe(false);
    });

    test('deve rejeitar buffer corrompido', async () => {
        (JSZip.loadAsync as jest.Mock).mockRejectedValue(new Error('Corrupted zip'));
        await expect(PPTXParser.validatePPTX(Buffer.from('corrompido'))).resolves.toBe(false);
    });
  });

  describe('Extração de Metadados', () => {
    test('deve extrair metadados básicos', async () => {
        mockJszipInstance.file.mockImplementation((name: string) => {
            if (name === 'docProps/core.xml') return { async: () => Promise.resolve(mockCoreXml) };
            if (name === 'ppt/presentation.xml') return { async: () => Promise.resolve(mockPresentationXml) };
            return { async: () => Promise.resolve('') };
        });

        const result = await parser.parsePPTX(Buffer.from(''));
        expect(result.metadata.title).toBe('Apresentação de Teste');
        expect(result.metadata.author).toBe('João Silva');
        expect(result.metadata.subject).toBe('Teste de Parser');
        expect(result.metadata.slideCount).toBe(2);
    });

    test('deve usar valores padrão quando metadados estão ausentes', async () => {
        mockJszipInstance.file.mockImplementation((name: string) => {
             if (name === 'docProps/core.xml') return { async: () => Promise.resolve('<root />') }; // XML Vazio
             if (name === 'ppt/presentation.xml') return { async: () => Promise.resolve('<p:presentation><p:sldIdLst/></p:presentation>') };
             return undefined;
        });
        
        const result = await parser.parsePPTX(Buffer.from(''));
        expect(result.metadata.title).toBe('Untitled Presentation');
        expect(result.metadata.author).toBe('Unknown');
        expect(result.metadata.slideCount).toBe(0);
    });
  });

  describe('Extração de Slides', () => {
    test('deve extrair conteúdo de slides corretamente', async () => {
        mockJszipInstance.file.mockImplementation((name: string) => {
            const files: { [key: string]: any } = {
                'ppt/_rels/presentation.xml.rels': { async: () => Promise.resolve('<Relationships><Relationship Id="rId2" Target="slides/slide1.xml"/></Relationships>') },
                'ppt/slides/slide1.xml': { async: () => Promise.resolve(mockSlide1Xml) },
                'ppt/presentation.xml': { async: () => Promise.resolve('<p:presentation><p:sldIdLst><p:sldId id="256" r:id="rId2"/></p:sldIdLst></p:presentation>') },
            };
            return files[name];
        });

        const result = await parser.parsePPTX(Buffer.from(''));
        expect(result.slides).toHaveLength(1);
        expect(result.slides[0].title).toBe('Título do Slide 1');
        expect(result.slides[0].content).toContain('Conteúdo do slide 1');
    });
  });

  describe('Tratamento de Erros', () => {
    test('deve lançar erro para arquivo inválido', async () => {
        (JSZip.loadAsync as jest.Mock).mockRejectedValueOnce(new Error('Invalid ZIP'));
        await expect(parser.parsePPTX(Buffer.from('invalid'))).rejects.toThrow('Failed to parse PPTX: Invalid ZIP');
    });

    test('deve continuar processamento mesmo com slides corrompidos', async () => {
        mockJszipInstance.file.mockImplementation((name: string) => {
            const files: { [key: string]: any } = {
                'ppt/_rels/presentation.xml.rels': { async: () => Promise.resolve('<Relationships><Relationship Id="rId2" Target="slides/slide1.xml"/><Relationship Id="rId3" Target="slides/slide2.xml"/></Relationships>') },
                'ppt/slides/slide1.xml': { async: () => Promise.reject('corrupted slide') }, // Slide 1 corrompido
                'ppt/slides/slide2.xml': { async: () => Promise.resolve(mockSlide2Xml) }, // Slide 2 ok
                'ppt/presentation.xml': { async: () => Promise.resolve(mockPresentationXml) },
            };
            return files[name];
        });

        const result = await parser.parsePPTX(Buffer.from(''));
        expect(result.slides).toHaveLength(1); // Apenas o slide 2 deve ser processado
        expect(result.slides[0].title).toBe('Título do Slide 2');
    });
  });
});