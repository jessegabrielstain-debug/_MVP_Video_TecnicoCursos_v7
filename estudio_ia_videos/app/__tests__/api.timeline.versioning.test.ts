/**
 * Testes das rotas de histórico, snapshot e restore de timeline
 */
// @jest-environment node
/// <reference types="jest" />
import { NextRequest } from 'next/server'
import * as historyRoute from '../api/v1/timeline/multi-track/history/route'
import * as snapshotRoute from '../api/v1/timeline/multi-track/snapshot/route'
import * as restoreRoute from '../api/v1/timeline/multi-track/restore/route'

jest.mock('@/lib/prisma', () => ({
  prisma: {
    project: { 
      findFirst: jest.fn().mockResolvedValue({ id: 'p1', userId: 'u1', name: 'Projeto' }) 
    },
    timeline: {
      findUnique: jest.fn().mockResolvedValue({ 
        id: 't1', 
        projectId: 'p1', 
        version: 3, 
        totalDuration: 300, 
        tracks: [{ id: 'track1', type: 'video', clips: [] }], 
        settings: { fps: 30 }, 
        createdAt: new Date(), 
        updatedAt: new Date(),
        project: { id: 'p1', userId: 'u1' }
      }),
      update: jest.fn().mockImplementation(async ({ where, data }: any) => ({
        id: where.id,
        projectId: 'p1',
        version: (data.version?.increment ? 4 : 3),
        tracks: data.tracks ?? [],
        settings: data.settings ?? { fps: 30 },
        totalDuration: data.totalDuration ?? 300,
        createdAt: new Date(),
        updatedAt: data.updatedAt ?? new Date()
      }))
    },
    timelineSnapshot: {
      findMany: jest.fn().mockResolvedValue([
        { 
          id: 's1', 
          timelineId: 't1', 
          version: 2, 
          tracks: [{ id: 'track1', type: 'video', clips: [] }], 
          settings: { fps: 30 }, 
          totalDuration: 300, 
          createdBy: 'u1', 
          description: 'Snapshot v2', 
          createdAt: new Date('2025-01-01') 
        },
        { 
          id: 's2', 
          timelineId: 't1', 
          version: 1, 
          tracks: [], 
          settings: { fps: 30 }, 
          totalDuration: 100, 
          createdBy: 'u1', 
          description: 'Snapshot v1', 
          createdAt: new Date('2025-01-02') 
        }
      ]),
      count: jest.fn().mockResolvedValue(2),
      create: jest.fn().mockImplementation(async ({ data }: any) => ({
        id: `s${Date.now()}`,
        timelineId: data.timelineId,
        version: data.version,
        tracks: data.tracks,
        settings: data.settings,
        totalDuration: data.totalDuration,
        createdBy: data.createdBy,
        description: data.description,
        createdAt: new Date()
      })),
      findUnique: jest.fn().mockImplementation(async ({ where }: any) => {
        if (where.id === 's1') {
          return {
            id: 's1', 
            timelineId: 't1', 
            version: 2, 
            tracks: [{ id: 'track1', type: 'video', clips: [] }], 
            settings: { fps: 30 }, 
            totalDuration: 300, 
            createdBy: 'u1', 
            description: 'Snapshot v2', 
            createdAt: new Date('2025-01-01'),
            timeline: {
              id: 't1',
              projectId: 'p1',
              version: 3,
              tracks: [{ id: 'track1', type: 'video', clips: [] }],
              settings: { fps: 30 },
              totalDuration: 300,
              createdAt: new Date(),
              updatedAt: new Date(),
              project: { id: 'p1', userId: 'u1', name: 'Projeto' }
            }
          }
        }
        return null
      })
    }
  }
}))

jest.mock('next-auth', () => ({ 
  getServerSession: jest.fn().mockResolvedValue({ user: { id: 'u1' } }) 
}))
jest.mock('@/lib/auth/auth-config', () => ({ authConfig: {} }))
jest.mock('@/lib/analytics/analytics-tracker', () => ({ 
  AnalyticsTracker: { trackTimelineEdit: jest.fn().mockResolvedValue(true) } 
}))

function makeRequest(method: string, url: string, body?: unknown): NextRequest {
  const headers: HeadersInit = { 'content-type': 'application/json' }
  const init: RequestInit = { method, headers }

  if (body !== undefined) {
    init.body = JSON.stringify(body)
  }

  return new NextRequest(new URL(url, 'http://localhost').toString(), init)
}

describe('API timeline versioning', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('History', () => {
    it('retorna 400 sem projectId', async () => {
      const req = makeRequest('GET', '/api/v1/timeline/multi-track/history')
      const res = await historyRoute.GET(req)
      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json.success).toBe(false)
    })

    it('retorna histórico de versões', async () => {
      const req = makeRequest('GET', '/api/v1/timeline/multi-track/history?projectId=p1')
      const res = await historyRoute.GET(req)
      const json = await res.json()
      expect(res.status).toBe(200)
      expect(json.success).toBe(true)
      expect(json.data.currentVersion).toBe(3)
      expect(Array.isArray(json.data.history)).toBe(true)
      expect(json.data.history.length).toBe(2)
      expect(json.data.pagination.total).toBe(2)
    })

    it('suporta paginação', async () => {
      const { prisma } = require('@/lib/prisma')
      // Mock to return only 1 snapshot when limit=1
      prisma.timelineSnapshot.findMany.mockResolvedValueOnce([
        { 
          id: 's1', 
          timelineId: 't1', 
          version: 2, 
          tracks: [{ id: 'track1', type: 'video', clips: [] }], 
          settings: { fps: 30 }, 
          totalDuration: 300, 
          createdBy: 'u1', 
          description: 'Snapshot v2', 
          createdAt: new Date('2025-01-01') 
        }
      ])
      
      const req = makeRequest('GET', '/api/v1/timeline/multi-track/history?projectId=p1&limit=1&offset=0')
      const res = await historyRoute.GET(req)
      const json = await res.json()
      expect(res.status).toBe(200)
      expect(json.data.pagination.limit).toBe(1)
      expect(json.data.pagination.hasMore).toBe(true)
    })
  })

  describe('Snapshot', () => {
    it('retorna 400 sem projectId', async () => {
      const req = makeRequest('POST', '/api/v1/timeline/multi-track/snapshot', {
        description: 'Test snapshot'
      })
      const res = await snapshotRoute.POST(req)
      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json.success).toBe(false)
    })

    it('cria snapshot com sucesso', async () => {
      const req = makeRequest('POST', '/api/v1/timeline/multi-track/snapshot', {
        projectId: 'p1',
        description: 'Snapshot de teste'
      })
      const res = await snapshotRoute.POST(req)
      const json = await res.json()
      expect(res.status).toBe(200)
      expect(json.success).toBe(true)
      expect(json.data.version).toBe(3)
      expect(json.data.description).toBe('Snapshot de teste')
      expect(json.data).toHaveProperty('id')
      expect(json.data).toHaveProperty('createdAt')
    })

    it('cria snapshot com descrição padrão', async () => {
      const req = makeRequest('POST', '/api/v1/timeline/multi-track/snapshot', {
        projectId: 'p1'
      })
      const res = await snapshotRoute.POST(req)
      const json = await res.json()
      expect(res.status).toBe(200)
      expect(json.success).toBe(true)
      expect(json.data.description).toMatch(/Snapshot v\d+/)
    })
  })

  describe('Restore', () => {
    it('retorna 400 sem snapshotId', async () => {
      const req = makeRequest('POST', '/api/v1/timeline/multi-track/restore', {
        projectId: 'p1'
      })
      const res = await restoreRoute.POST(req)
      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json.success).toBe(false)
      expect(json.message).toContain('snapshotId')
    })

    it('restaura timeline de snapshot', async () => {
      const req = makeRequest('POST', '/api/v1/timeline/multi-track/restore', {
        snapshotId: 's1',
        projectId: 'p1'
      })
      const res = await restoreRoute.POST(req)
      const json = await res.json()
      expect(res.status).toBe(200)
      expect(json.success).toBe(true)
      expect(json.data.restoredFromVersion).toBe(2)
      expect(json.data.version).toBeGreaterThan(2)
      expect(json.data).toHaveProperty('backupSnapshotId')
    })

    it('cria backup automático antes de restaurar', async () => {
      const { prisma } = require('@/lib/prisma')
      const createSpy = jest.spyOn(prisma.timelineSnapshot, 'create')
      
      const req = makeRequest('POST', '/api/v1/timeline/multi-track/restore', {
        snapshotId: 's1'
      })
      const res = await restoreRoute.POST(req)
      const json = await res.json()
      
      expect(res.status).toBe(200)
      expect(createSpy).toHaveBeenCalledTimes(1)
      expect(createSpy.mock.calls[0][0].data.description).toContain('Auto-backup')
    })

    it('retorna 404 para snapshot inexistente', async () => {
      const req = makeRequest('POST', '/api/v1/timeline/multi-track/restore', {
        snapshotId: 's999'
      })
      const res = await restoreRoute.POST(req)
      expect(res.status).toBe(404)
      const json = await res.json()
      expect(json.success).toBe(false)
    })
  })
})
