/**
 * 🧪 Testes PPTX Simplificados - Validação Funcional
 * 
 * Testes básicos para validar funcionalidade real do sistema PPTX
 */

import { processPPTXFile, validatePPTXFile, ProcessingResult } from '@/lib/pptx-processor';
import { createFileObject, createTestPPTX, cleanupTestFiles } from './test-helpers';
import path from 'path';
import fs from 'fs';
import { Slide } from '@/lib/definitions';

describe('PPTX System Tests', () => {
    const testDir = path.join(__dirname, 'fixtures');
    const validPPTXPath = path.join(testDir, 'system-test.pptx');

    beforeAll(async () => {
        if (!fs.existsSync(testDir)) {
            fs.mkdirSync(testDir, { recursive: true });
        }
        await createTestPPTX(validPPTXPath);
    });

    afterAll(() => {
        cleanupTestFiles([validPPTXPath]);
    });

    describe('File Validation', () => {
        test('should accept a valid PPTX file', async () => {
            const file = await createFileObject(validPPTXPath);
            const result = await validatePPTXFile(file);
            expect(result.valid).toBe(true);
            expect(result.error).toBeUndefined();
        });

        test('should reject invalid file format', async () => {
            const invalidPath = path.join(testDir, 'invalid.pptx');
            fs.writeFileSync(invalidPath, 'definitely not a pptx');
            const file = await createFileObject(invalidPath);
            const result = await validatePPTXFile(file);
            expect(result.valid).toBe(false);
            expect(result.error).toContain('Formato de arquivo inválido');
        });

        test('should reject empty files', async () => {
            const file = await createFileObject('non-existent-file.pptx');
            const result = await validatePPTXFile(file);
            expect(result.valid).toBe(false);
            expect(result.error).toContain('não encontrado ou vazio');
        });
    });

    describe('File Processing', () => {
        test('should fully process a valid PPTX file', async () => {
            const file = await createFileObject(validPPTXPath);
            const result = await processPPTXFile(file, 'system-test-project');

            expect(result.success).toBe(true);
            expect(result.error).toBeUndefined();
            expect(result.metadata).toBeDefined();
            expect(result.metadata.slideCount).toBeGreaterThan(0);
            expect(result.slides).toHaveLength(result.metadata.slideCount);
            expect(result.thumbnails).toHaveLength(result.metadata.slideCount);
        });

        test('should handle processing failure gracefully', async () => {
            const file = await createFileObject('non-existent-file.pptx');
            const result = await processPPTXFile(file, 'system-test-project-fail');

            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
            expect(result.slides).toEqual([]);
            expect(result.thumbnails).toEqual([]);
        });
    });
});