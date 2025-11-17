/**
 * Testes para Collaboration, Templates, Bulk Ops e Analytics
 */
// @jest-environment node
/// <reference types="jest" />
import { NextRequest } from 'next/server'
import * as collaborateRoute from '../api/v1/timeline/multi-track/collaborate/route'
import * as templatesRoute from '../api/v1/timeline/multi-track/templates/route'
import * as bulkRoute from '../api/v1/timeline/multi-track/bulk/route'
import * as analyticsRoute from '../api/v1/timeline/multi-track/analytics/route'

jest.mock('@/lib/prisma', () => {
  const mockTimeline = {
    id: 't1',
    projectId: 'p1',
    version: 3,
    totalDuration: 300,
    tracks: [
      { id: 'track1', type: 'video', clips: [{ id: 'clip1', startTime: 0, duration: 10 }] },
      { id: 'track2', type: 'audio', clips: [{ id: 'clip2', startTime: 5, duration: 15 }] }
    ],
    settings: { fps: 30 },
    createdAt: new Date(),
    updatedAt: new Date()
  }
  
  return {
    prisma: {
      project: {
        findFirst: jest.fn().mockResolvedValue({ id: 'p1', userId: 'u1' })
      },
      timeline: {
        findUnique: jest.fn().mockResolvedValue(mockTimeline),
        update: jest.fn().mockImplementation(async ({ data }: any) => ({
          ...mockTimeline,
          ...data,
          version: data.version?.increment ? 4 : 3
        })),
        upsert: jest.fn().mockImplementation(async ({ create, update }: any) => ({
          ...mockTimeline,
          ...(update || create)
        }))
      },
      timelineTrackLock: {
        findFirst: jest.fn().mockResolvedValue(null),
        upsert: jest.fn().mockImplementation(async ({ create }: any) => ({
          id: 'lock1',
          ...create,
          createdAt: new Date()
        })),
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
        findMany: jest.fn().mockResolvedValue([])
      },
      timelinePresence: {
        upsert: jest.fn().mockImplementation(async ({ create }: any) => ({
          ...create,
          lastSeenAt: new Date()
        })),
        findMany: jest.fn().mockResolvedValue([])
      },
      timelineTemplate: {
        create: jest.fn().mockImplementation(async ({ data }: any) => ({
          id: 'tpl1',
          ...data,
          usageCount: 0,
          createdAt: new Date()
        })),
        findUnique: jest.fn().mockImplementation(async ({ where }: any) => 
          where.id === 'tpl1' ? {
            id: 'tpl1',
            name: 'Template Test',
            isPublic: true,
            createdBy: 'u1',
            tracks: mockTimeline.tracks,
            settings: mockTimeline.settings,
            totalDuration: 300,
            metadata: {},
            usageCount: 5,
            createdAt: new Date(),
            creator: { id: 'u1', name: 'User 1', image: null }
          } : null
        ),
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
        update: jest.fn().mockResolvedValue({}),
        delete: jest.fn().mockResolvedValue({})
      },
      timelineSnapshot: {
        count: jest.fn().mockResolvedValue(5),
        findMany: jest.fn().mockResolvedValue([])
      }
    }
  }
})

jest.mock('next-auth', () => ({
  getServerSession: jest.fn().mockResolvedValue({ user: { id: 'u1' } })
}))
jest.mock('@/lib/auth/auth-config', () => ({ authConfig: {} }))

function makeRequest(method: string, url: string, body?: unknown): NextRequest {
  const headers: HeadersInit = { 'content-type': 'application/json' }
  const init: RequestInit = { method, headers }

  if (body !== undefined) {
    init.body = JSON.stringify(body)
  }

  return new NextRequest(new URL(url, 'http://localhost').toString(), init)
}

describe('Timeline Advanced Features', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Collaboration', () => {
    it('bloqueia track com sucesso', async () => {
      const req = makeRequest('POST', '/api/v1/timeline/multi-track/collaborate', {
        projectId: 'p1',
        trackId: 'track1',
        action: 'lock'
      })
      const res = await collaborateRoute.POST(req)
      const json = await res.json()
      
      expect(res.status).toBe(200)
      expect(json.success).toBe(true)
      expect(json.data.trackId).toBe('track1')
    })

    it('retorna 409 se track já está bloqueada', async () => {
      const { prisma } = require('@/lib/prisma')
      prisma.timelineTrackLock.findFirst.mockResolvedValueOnce({
        id: 'lock1',
        userId: 'u2',
        createdAt: new Date()
      })

      const req = makeRequest('POST', '/api/v1/timeline/multi-track/collaborate', {
        projectId: 'p1',
        trackId: 'track1',
        action: 'lock'
      })
      const res = await collaborateRoute.POST(req)
      
      expect(res.status).toBe(409)
    })

    it('desbloqueia track', async () => {
      const req = makeRequest('POST', '/api/v1/timeline/multi-track/collaborate', {
        projectId: 'p1',
        trackId: 'track1',
        action: 'unlock'
      })
      const res = await collaborateRoute.POST(req)
      const json = await res.json()
      
      expect(res.status).toBe(200)
      expect(json.success).toBe(true)
    })

    it('retorna locks e presença ativa', async () => {
      const req = makeRequest('GET', '/api/v1/timeline/multi-track/collaborate?projectId=p1')
      const res = await collaborateRoute.GET(req)
      const json = await res.json()
      
      expect(res.status).toBe(200)
      expect(json.success).toBe(true)
      expect(json.data).toHaveProperty('locks')
      expect(json.data).toHaveProperty('activeUsers')
    })

    it('atualiza presença do usuário', async () => {
      const req = makeRequest('PUT', '/api/v1/timeline/multi-track/collaborate', {
        projectId: 'p1',
        currentTrackId: 'track1'
      })
      const res = await collaborateRoute.PUT(req)
      const json = await res.json()
      
      expect(res.status).toBe(200)
      expect(json.success).toBe(true)
    })
  })

  describe('Templates', () => {
    it('cria template de timeline', async () => {
      const req = makeRequest('POST', '/api/v1/timeline/multi-track/templates', {
        projectId: 'p1',
        name: 'Meu Template',
        description: 'Template de teste',
        category: 'custom'
      })
      const res = await templatesRoute.POST(req)
      const json = await res.json()
      
      expect(res.status).toBe(200)
      expect(json.success).toBe(true)
      expect(json.data.name).toBe('Meu Template')
    })

    it('lista templates disponíveis', async () => {
      const req = makeRequest('GET', '/api/v1/timeline/multi-track/templates')
      const res = await templatesRoute.GET(req)
      const json = await res.json()
      
      expect(res.status).toBe(200)
      expect(json.success).toBe(true)
      expect(json.data).toHaveProperty('templates')
      expect(json.data).toHaveProperty('pagination')
    })

    it('retorna template específico', async () => {
      const req = makeRequest('GET', '/api/v1/timeline/multi-track/templates?templateId=tpl1')
      const res = await templatesRoute.GET(req)
      const json = await res.json()
      
      expect(res.status).toBe(200)
      expect(json.success).toBe(true)
      expect(json.data.name).toBe('Template Test')
    })

    it('aplica template ao projeto', async () => {
      const req = makeRequest('PUT', '/api/v1/timeline/multi-track/templates', {
        templateId: 'tpl1',
        projectId: 'p1'
      })
      const res = await templatesRoute.PUT(req)
      const json = await res.json()
      
      expect(res.status).toBe(200)
      expect(json.success).toBe(true)
      expect(json.data.projectId).toBe('p1')
    })

    it('deleta template', async () => {
      const req = makeRequest('DELETE', '/api/v1/timeline/multi-track/templates?templateId=tpl1')
      const res = await templatesRoute.DELETE(req)
      const json = await res.json()
      
      expect(res.status).toBe(200)
      expect(json.success).toBe(true)
    })
  })

  describe('Bulk Operations', () => {
    it('deleta múltiplas tracks', async () => {
      const req = makeRequest('POST', '/api/v1/timeline/multi-track/bulk', {
        projectId: 'p1',
        operation: 'delete_tracks',
        targets: { trackIds: ['track1'] }
      })
      const res = await bulkRoute.POST(req)
      const json = await res.json()
      
      expect(res.status).toBe(200)
      expect(json.success).toBe(true)
      expect(json.data.result.deletedCount).toBe(1)
    })

    it('deleta múltiplos clips', async () => {
      const req = makeRequest('POST', '/api/v1/timeline/multi-track/bulk', {
        projectId: 'p1',
        operation: 'delete_clips',
        targets: { clipIds: ['clip1', 'clip2'] }
      })
      const res = await bulkRoute.POST(req)
      const json = await res.json()
      
      expect(res.status).toBe(200)
      expect(json.data.result.deletedCount).toBe(2)
    })

    it('duplica múltiplos clips', async () => {
      const req = makeRequest('POST', '/api/v1/timeline/multi-track/bulk', {
        projectId: 'p1',
        operation: 'duplicate_clips',
        targets: { clipIds: ['clip1'] },
        data: { timeOffset: 10 }
      })
      const res = await bulkRoute.POST(req)
      const json = await res.json()
      
      expect(res.status).toBe(200)
      expect(json.data.result.duplicatedCount).toBe(1)
    })

    it('move clips para outra track', async () => {
      const req = makeRequest('POST', '/api/v1/timeline/multi-track/bulk', {
        projectId: 'p1',
        operation: 'move_clips',
        targets: { clipIds: ['clip1'] },
        data: { targetTrackId: 'track2' }
      })
      const res = await bulkRoute.POST(req)
      const json = await res.json()
      
      expect(res.status).toBe(200)
      expect(json.data.result.movedCount).toBe(1)
    })

    it('aplica efeito em múltiplos clips', async () => {
      const req = makeRequest('POST', '/api/v1/timeline/multi-track/bulk', {
        projectId: 'p1',
        operation: 'apply_effect',
        targets: { clipIds: ['clip1', 'clip2'] },
        data: { effect: { type: 'fade', duration: 1 } }
      })
      const res = await bulkRoute.POST(req)
      const json = await res.json()
      
      expect(res.status).toBe(200)
      expect(json.data.result.affectedClips).toBe(2)
    })
  })

  describe('Analytics', () => {
    it('retorna sumário da timeline', async () => {
      const req = makeRequest('GET', '/api/v1/timeline/multi-track/analytics?projectId=p1&type=summary')
      const res = await analyticsRoute.GET(req)
      const json = await res.json()
      
      expect(res.status).toBe(200)
      expect(json.success).toBe(true)
      expect(json.data).toHaveProperty('overview')
      expect(json.data.overview.tracksCount).toBe(2)
    })

    it('retorna estatísticas de uso', async () => {
      const req = makeRequest('GET', '/api/v1/timeline/multi-track/analytics?projectId=p1&type=usage')
      const res = await analyticsRoute.GET(req)
      const json = await res.json()
      
      expect(res.status).toBe(200)
      expect(json.data).toHaveProperty('totalEdits')
    })

    it('retorna métricas de performance', async () => {
      const req = makeRequest('GET', '/api/v1/timeline/multi-track/analytics?projectId=p1&type=performance')
      const res = await analyticsRoute.GET(req)
      const json = await res.json()
      
      expect(res.status).toBe(200)
      expect(json.data).toHaveProperty('complexity')
      expect(json.data).toHaveProperty('performance')
    })

    it('retorna padrões de edição', async () => {
      const req = makeRequest('GET', '/api/v1/timeline/multi-track/analytics?projectId=p1&type=editing_patterns')
      const res = await analyticsRoute.GET(req)
      const json = await res.json()
      
      expect(res.status).toBe(200)
      expect(json.data).toHaveProperty('editingSessions')
    })
  })
})
