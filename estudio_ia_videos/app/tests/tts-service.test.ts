/**
 * 🧪 Testes TTS Service - Validação Funcional
 * 
 * Testes para serviço de Text-to-Speech com fallback
 */

import { synthesizeToFile, listVoices } from '@/lib/tts/tts-service';

describe('TTS Service Tests', () => {
  describe('Basic Functionality', () => {
    test('should synthesize text to file', async () => {
      const result = await synthesizeToFile({
        text: 'Teste de síntese de voz',
        voiceId: 'pt-BR-Neural2-A'
      });

      expect(result).toHaveProperty('fileUrl');
      expect(result).toHaveProperty('duration');
      expect(result).toHaveProperty('voiceId');
      expect(result.duration).toBeGreaterThan(0);
    });

    test('should handle empty text', async () => {
      await expect(
        synthesizeToFile({ text: '' })
      ).rejects.toThrow('Text is required and must be a string');
    });

    test('should handle long text', async () => {
      const longText = 'Este é um texto longo para testar a funcionalidade de TTS com múltiplas palavras e frases '.repeat(10);
      const result = await synthesizeToFile({
        text: longText,
        voiceId: 'pt-BR-Neural2-A'
      });

      expect(result).toHaveProperty('fileUrl');
      expect(result.duration).toBeGreaterThan(1);
    });

    test('should use fallback when API key missing', async () => {
      // Este teste funciona se GOOGLE_TTS_API_KEY não estiver configurada
      const result = await synthesizeToFile({
        text: 'Teste fallback',
        voiceId: 'pt-BR-Neural2-A'
      });

      expect(result).toHaveProperty('fileUrl');
      expect(result.fileUrl).toMatch(/\/tts\/.*\.mp3$/);
    });
  });

  describe('Voice Management', () => {
    test('should list available voices', async () => {
      const voices = await listVoices();
      
      expect(Array.isArray(voices)).toBe(true);
      expect(voices.length).toBeGreaterThan(0);
      
      voices.forEach((voice: any) => {
        expect(voice).toHaveProperty('name');
        expect(voice).toHaveProperty('language');
      });
    });

    test('should handle different voice options', async () => {
      const voices = ['pt-BR-Neural2-A', 'pt-BR-Neural2-B'];
      
      for (const voiceId of voices) {
        const result = await synthesizeToFile({
          text: 'Teste de voz',
          voiceId
        });
        
        expect(result.voiceId).toBe(voiceId);
      }
    });
  });

  describe('File Generation', () => {
    test('should generate unique filenames', async () => {
      const results = await Promise.all([
        synthesizeToFile({ text: 'Texto 1' }),
        synthesizeToFile({ text: 'Texto 2' }),
        synthesizeToFile({ text: 'Texto 3' })
      ]);

      const urls = results.map((r: { fileUrl: string }) => r.fileUrl);
      const uniqueUrls = [...new Set(urls)];
      
      expect(uniqueUrls.length).toBe(3);
    });

    test('should estimate duration correctly', async () => {
      const longText = 'Este é um texto mais longo para testar a estimativa de duração do áudio gerado pelo sistema de TTS.';
      const shortText = 'Curto.';

      const [longResult, shortResult] = await Promise.all([
        synthesizeToFile({ text: longText }),
        synthesizeToFile({ text: shortText })
      ]);

      expect(longResult.duration).toBeGreaterThan(shortResult.duration);
    });
  });

  describe('Error Handling', () => {
    test('should handle network errors gracefully', async () => {
      // Simular erro de rede mockando fetch
      const originalFetch = global.fetch;
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      const result = await synthesizeToFile({
        text: 'Teste erro de rede',
        voiceId: 'pt-BR-Neural2-A'
      });

      // Deve usar fallback
      expect(result).toHaveProperty('fileUrl');
      
      global.fetch = originalFetch;
    });

    test('should validate input parameters', async () => {
      await expect(
        synthesizeToFile({ text: 'A'.repeat(10000) })
      ).rejects.toThrow();
    });
  });
});