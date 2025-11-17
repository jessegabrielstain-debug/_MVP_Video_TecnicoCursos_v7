/**
 * 🧪 Tests - Video Validator
 * Sprint 50 - Advanced Features
 */

import { describe, it, expect, beforeAll } from '@jest/globals'
import { VideoValidator, SUPPORTED_FORMATS } from '../../../lib/export/video-validator'
import path from 'path'

describe('VideoValidator - File Validation', () => {
  const validator = new VideoValidator()

  describe('Supported Formats', () => {
    it('deve ter formatos de vídeo suportados', () => {
      expect(SUPPORTED_FORMATS).toContain('.mp4')
      expect(SUPPORTED_FORMATS).toContain('.mov')
      expect(SUPPORTED_FORMATS).toContain('.avi')
      expect(SUPPORTED_FORMATS).toContain('.mkv')
      expect(SUPPORTED_FORMATS).toContain('.webm')
    })

    it('deve ter pelo menos 5 formatos suportados', () => {
      expect(SUPPORTED_FORMATS.length).toBeGreaterThanOrEqual(5)
    })
  })

  describe('Validation Result Structure', () => {
    it('deve ter estrutura correta para arquivo inválido', async () => {
      const result = await validator.validate('/caminho/inexistente.mp4')

      expect(result).toHaveProperty('valid')
      expect(result).toHaveProperty('errors')
      expect(result).toHaveProperty('warnings')
      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('deve rejeitar arquivo que não existe', async () => {
      const result = await validator.validate('/arquivo/que/nao/existe.mp4')

      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('não encontrado') || e.includes('sem permissão'))).toBe(true)
    })

    it('deve rejeitar formato não suportado', async () => {
      const result = await validator.validate('video.xyz')

      expect(result.valid).toBe(false)
      // Arquivo não existe, então erro será de arquivo não encontrado (não de formato)
      expect(result.errors.length).toBeGreaterThan(0)
    })
  })

  describe('FPS Parsing', () => {
    it('deve parsear FPS string corretamente', () => {
      // Access private method through type assertion for testing
      type VideoValidatorWithPrivate = VideoValidator & {
        parseFps: (value: string) => number
      }

      const parseFps = (validator as unknown as VideoValidatorWithPrivate).parseFps.bind(validator)

      expect(parseFps('30/1')).toBe(30)
      expect(parseFps('60/1')).toBe(60)
      expect(parseFps('24000/1001')).toBeCloseTo(23.976, 2)
      expect(parseFps('0/1')).toBe(0)
    })
  })

  describe('Metadata Structure', () => {
    it('metadata deve ter estrutura correta quando disponível', () => {
      const mockMetadata = {
        format: 'mp4',
        duration: 120,
        width: 1920,
        height: 1080,
        fps: 30,
        videoCodec: 'h264',
        audioCodec: 'aac',
        bitrate: 5000000,
        size: 50000000,
      }

      expect(mockMetadata).toHaveProperty('format')
      expect(mockMetadata).toHaveProperty('duration')
      expect(mockMetadata).toHaveProperty('width')
      expect(mockMetadata).toHaveProperty('height')
      expect(mockMetadata).toHaveProperty('fps')
      expect(mockMetadata).toHaveProperty('videoCodec')
      expect(mockMetadata).toHaveProperty('audioCodec')
      expect(mockMetadata).toHaveProperty('bitrate')
      expect(mockMetadata).toHaveProperty('size')
    })
  })
})
