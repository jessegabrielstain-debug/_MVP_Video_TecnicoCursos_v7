/**
 * 🧪 Testes PPTX Processor - Validação Completa
 * 
 * Testes unitários e de integração para o processador PPTX
 * Validação de parsing, extração e processamento real
 */

import { processPPTXFile, validatePPTXFile, ProcessingResult } from '@/lib/pptx-processor';
import { createFileObject, createTestPPTX, cleanupTestFiles, createEmptyPPTX } from './test-helpers';
import path from 'path';
import fs from 'fs';
import { Slide } from '@/lib/definitions';

describe('PPTX Processor Tests', () => {
  const testDir = path.join(__dirname, 'fixtures');
  const testPPTXPath = path.join(testDir, 'test-presentation.pptx');

  beforeAll(async () => {
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    await createTestPPTX(testPPTXPath);
  });

  afterAll(() => {
    cleanupTestFiles([testPPTXPath]);
  });

  describe('validatePPTXFile', () => {
    test('should validate a valid PPTX file', async () => {
      const file = await createFileObject(testPPTXPath);
      const result = await validatePPTXFile(file);
      
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    test('should reject non-existent file', async () => {
      const file = await createFileObject('/path/to/nonexistent.pptx');
      const result = await validatePPTXFile(file);
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('não encontrado ou vazio');
    });

    test('should reject files that are too large', async () => {
      const largePath = path.join(testDir, 'large.pptx');
      const largeBuffer = Buffer.alloc(101 * 1024 * 1024); // 101MB
      fs.writeFileSync(largePath, largeBuffer);

      const file = await createFileObject(largePath);
      const result = await validatePPTXFile(file);
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('muito grande');

      fs.unlinkSync(largePath);
    });

    test('should reject invalid file format', async () => {
      const invalidPath = path.join(testDir, 'invalid.pptx');
      fs.writeFileSync(invalidPath, 'This is not a valid PPTX file');

      const file = await createFileObject(invalidPath);
      const result = await validatePPTXFile(file);
      
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('Assinatura ZIP não encontrada');
    });
  });

  describe('processPPTXFile', () => {
    test('should process a valid PPTX file', async () => {
      const file = await createFileObject(testPPTXPath);
      const result = await processPPTXFile(file, 'test-project-id');
      
      expect(result.success).toBe(true);
      expect(result.metadata).toBeDefined();
      expect(result.slides).toBeDefined();
      expect(result.thumbnails).toBeDefined();
      expect(result.slides!.length).toBeGreaterThan(0);
    });

    test('should extract metadata correctly', async () => {
      const file = await createFileObject(testPPTXPath);
      const result = await processPPTXFile(file, 'test-project-id');
      
      expect(result.metadata!.title).toBeDefined();
      expect(result.metadata!.author).toBeDefined();
      expect(result.metadata!.slideCount).toBe(result.slides!.length);
      expect(result.metadata!.createdAt).toBeInstanceOf(Date);
      expect(result.metadata!.fileSize).toBeGreaterThan(0);
    });

    test('should extract slides with correct structure', async () => {
      const file = await createFileObject(testPPTXPath);
      const result = await processPPTXFile(file, 'test-project-id');
      
      expect(result.slides!.length).toBeGreaterThan(0);
      
      result.slides!.forEach((slide: Slide, index: number) => {
        expect(slide.id).toBe(`slide-${index + 1}`);
        expect(slide.slideNumber).toBe(index + 1);
        expect(slide.title).toBeDefined();
        expect(slide.content).toBeDefined();
        expect(slide.duration).toBeGreaterThan(0);
        expect(slide.transition).toBeDefined();
      });
    });

    test('should generate thumbnails for slides', async () => {
      const file = await createFileObject(testPPTXPath);
      const result = await processPPTXFile(file, 'test-project-id');
      
      expect(result.thumbnails).toBeDefined();
      expect(result.thumbnails!.length).toBe(result.slides!.length);
      
      result.thumbnails!.forEach((thumbnail: string) => {
        expect(thumbnail).toMatch(/^\/thumbnails\/.+\.png$/);
      });
    });

    test('should handle processing errors gracefully', async () => {
      const file = await createFileObject('nonexistent.pptx');
      const result = await processPPTXFile(file, 'test-project-id');
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.slides).toEqual([]);
      expect(result.thumbnails).toEqual([]);
    });
  });

  describe('Performance Tests', () => {
    test('should process PPTX within reasonable time', async () => {
      const startTime = Date.now();
      const file = await createFileObject(testPPTXPath);
      const result = await processPPTXFile(file, 'test-project-id');
      const processingTime = Date.now() - startTime;
      
      expect(result.success).toBe(true);
      expect(processingTime).toBeLessThan(10000); // Menos de 10 segundos
    });

    test('should handle concurrent processing', async () => {
      const file = await createFileObject(testPPTXPath);
      const promises = Array(3).fill(null).map(() => 
        processPPTXFile(file, 'test-project-id')
      );

      const results = await Promise.all(promises);
      
      results.forEach((result: ProcessingResult) => {
        expect(result.success).toBe(true);
        expect(result.slides!.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Edge Cases', () => {
    test('should handle PPTX with no slides', async () => {
      const emptyPPTXPath = path.join(testDir, 'empty.pptx');
      await createEmptyPPTX(emptyPPTXPath);

      const file = await createFileObject(emptyPPTXPath);
      const result = await processPPTXFile(file, 'test-project-id');
      
      expect(result.success).toBe(true);
      expect(result.slides!.length).toBe(0);
      expect(result.metadata!.slideCount).toBe(0);
    });

    test('should handle PPTX with special characters in name', async () => {
      const specialCharPath = path.join(testDir, 'tëst-präsëntatiön.pptx');
      await createTestPPTX(specialCharPath); // Criar com nome especial

      const file = await createFileObject(specialCharPath);
      const result = await processPPTXFile(file, 'test-project-id');
      
      expect(result.success).toBe(true);
      expect(result.metadata!.title).toBeDefined();
    });

    test('should handle PPTX with only images', async () => {
      const imageOnlyPath = path.join(testDir, 'image-only.pptx');
      await createTestPPTX(imageOnlyPath); // Usar o mesmo criador por enquanto

      const file = await createFileObject(imageOnlyPath);
      const result = await processPPTXFile(file, 'test-project-id');
      
      expect(result.success).toBe(true);
      expect(result.slides!.length).toBeGreaterThan(0); // Deve processar a estrutura do slide
    });
  });
});
