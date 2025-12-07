/**
 * 🧪 Testes da API de Upload
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { POST, GET, DELETE } from '@/app/api/upload/route'
import { NextRequest } from 'next/server'

// Mock do Supabase
jest.mock('@supabase/auth-helpers-nextjs', () => ({
  createRouteHandlerClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id', email: 'test@example.com' } },
        error: null,
      }),
    },
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn().mockResolvedValue({ data: { path: 'test-path' }, error: null }),
        getPublicUrl: jest.fn(() => ({ data: { publicUrl: 'https://test-url.com/file' } })),
        remove: jest.fn().mockResolvedValue({ error: null }),
      })),
    },
    from: jest.fn(() => ({
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({
            data: {
              id: 'file-id',
              name: 'test.pptx',
              url: 'https://test-url.com/file',
            },
            error: null,
          }),
        })),
      })),
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({
            data: { id: 'file-id', path: 'test-path' },
            error: null,
          }),
          order: jest.fn(() => ({
            range: jest.fn().mockResolvedValue({
              data: [],
              error: null,
              count: 0,
            }),
          })),
        })),
        order: jest.fn(() => ({
          range: jest.fn().mockResolvedValue({
            data: [],
            error: null,
            count: 0,
          }),
        })),
      })),
      delete: jest.fn(() => ({
        eq: jest.fn().mockResolvedValue({ error: null }),
      })),
    })),
  })),
}))

jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({})),
}))

jest.mock('sharp', () => {
  return jest.fn(() => ({
    resize: jest.fn(() => ({
      jpeg: jest.fn(() => ({
        toBuffer: jest.fn().mockResolvedValue(Buffer.from('fake-image')),
      })),
    })),
  }))
})

describe('API de Upload', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/upload', () => {
    it('deve fazer upload de arquivo PPTX com sucesso', async () => {
      const formData = new FormData()
      const file = new File(['test content'], 'test.pptx', {
        type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      })
      formData.append('file', file)
      formData.append('type', 'presentation')

      const request = new NextRequest('http://localhost:3000/api/upload', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.file).toBeDefined()
      expect(data.file.name).toBe('test.pptx')
    })

    it('deve rejeitar arquivo sem autenticação', async () => {
      const { createRouteHandlerClient } = require('@supabase/auth-helpers-nextjs')
      createRouteHandlerClient.mockReturnValueOnce({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: null },
            error: new Error('Not authenticated'),
          }),
        },
      })

      const formData = new FormData()
      const file = new File(['test'], 'test.pptx', {
        type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      })
      formData.append('file', file)

      const request = new NextRequest('http://localhost:3000/api/upload', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error).toContain('autorizado')
    })

    it('deve rejeitar tipo de arquivo não permitido', async () => {
      const formData = new FormData()
      const file = new File(['test'], 'test.exe', {
        type: 'application/x-msdownload',
      })
      formData.append('file', file)

      const request = new NextRequest('http://localhost:3000/api/upload', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('não permitido')
    })
  })

  describe('GET /api/upload', () => {
    it('deve listar arquivos do usuário', async () => {
      const request = new NextRequest('http://localhost:3000/api/upload', {
        method: 'GET',
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.files).toBeDefined()
      expect(Array.isArray(data.files)).toBe(true)
    })

    it('deve filtrar por tipo de arquivo', async () => {
      const request = new NextRequest('http://localhost:3000/api/upload?type=presentation', {
        method: 'GET',
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })
  })

  describe('DELETE /api/upload', () => {
    it('deve deletar arquivo com sucesso', async () => {
      const request = new NextRequest('http://localhost:3000/api/upload?id=file-id', {
        method: 'DELETE',
      })

      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('deve retornar erro se arquivo não existir', async () => {
      const { createRouteHandlerClient } = require('@supabase/auth-helpers-nextjs')
      const mockClient = createRouteHandlerClient()
      mockClient.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: new Error('Not found'),
            }),
          })),
        })),
      })

      const request = new NextRequest('http://localhost:3000/api/upload?id=nonexistent', {
        method: 'DELETE',
      })

      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
    })
  })
})
