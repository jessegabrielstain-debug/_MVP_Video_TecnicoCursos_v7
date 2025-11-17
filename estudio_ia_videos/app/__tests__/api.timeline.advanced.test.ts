/**
 * Testes das novas rotas de timeline multi-track (DELETE, PATCH)
 */
// @jest-environment node
/// <reference types="jest" />
import { NextRequest } from 'next/server'
import * as timelineRoute from '../api/v1/timeline/multi-track/route'

jest.mock('@/lib/prisma', () => ({
  prisma: {
    project: { 
      findFirst: jest.fn().mockResolvedValue({ id: 'p1', userId: 'u1', name: 'Projeto' }) 
    },
    timeline: {
      upsert: jest.fn().mockImplementation(async ({ create, update }) => ({ 
        id: 't1', 
        projectId: 'p1', 
        version: 2, 
        totalDuration: update?.totalDuration ?? create?.totalDuration ?? 300, 
        tracks: update?.tracks ?? create?.tracks ?? [], 
        settings: update?.settings ?? create?.settings ?? {}, 
        updatedAt: new Date() 
      })),
      findUnique: jest.fn().mockResolvedValue({ 
        id: 't1', 
        projectId: 'p1', 
        version: 2, 
        totalDuration: 300, 
        tracks: [], 
        settings: { fps: 30, resolution: '1920x1080', quality: 'hd' }, 
        createdAt: new Date(), 
        updatedAt: new Date(), 
        project: { id: 'p1', name: 'Projeto', status: 'DRAFT', userId: 'u1' } 
      }),
      delete: jest.fn().mockImplementation(async ({ where }) => ({
        id: 't1',
        projectId: where.projectId,
        version: 2,
        tracks: [],
        settings: {},
        totalDuration: 300,
        createdAt: new Date(),
        updatedAt: new Date()
      })),
      update: jest.fn().mockImplementation(async ({ where, data }) => ({
        id: 't1',
        projectId: where.projectId,
        version: (data.version?.increment ? 3 : 2),
        tracks: data.tracks ?? [],
        settings: data.settings ?? { fps: 30, resolution: '1920x1080' },
        totalDuration: data.totalDuration ?? 300,
        createdAt: new Date(),
        updatedAt: data.updatedAt ?? new Date()
      }))
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

// Test helper types
interface RequestInit {
  method: string;
  headers: Record<string, string>;
  body?: string;
}

interface RequestBody {
  projectId?: string;
  tracks?: Array<{ id: string; type: string; clips?: unknown[] }>;
  settings?: { fps?: number; resolution?: string };
  totalDuration?: number;
}

function makeRequest(method: string, url: string, body?: RequestBody): NextRequest {
  const init: RequestInit = { method, headers: { 'content-type': 'application/json' } };
  if (body) init.body = JSON.stringify(body);
  return new NextRequest(new URL(url, 'http://localhost').toString(), init);
}

describe('API timeline multi-track (DELETE, PATCH)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('DELETE', () => {
    it('retorna 400 sem projectId', async () => {
      const req = makeRequest('DELETE', '/api/v1/timeline/multi-track');
      const res = await timelineRoute.DELETE(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.message).toContain('projectId');
    });

    it('deleta timeline com sucesso', async () => {
      const req = makeRequest('DELETE', '/api/v1/timeline/multi-track?projectId=p1');
      const res = await timelineRoute.DELETE(req);
      const json = await res.json();
      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.projectId).toBe('p1');
      expect(json.message).toContain('deletada');
    });

    it('retorna 404 para timeline inexistente', async () => {
      const { prisma } = require('@/lib/prisma');
      prisma.timeline.delete.mockRejectedValueOnce({ code: 'P2025' });
      
      const req = makeRequest('DELETE', '/api/v1/timeline/multi-track?projectId=p999');
      const res = await timelineRoute.DELETE(req);
      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.message).toContain('não encontrada');
    });
  });

  describe('PATCH', () => {
    it('retorna 400 sem projectId', async () => {
      const req = makeRequest('PATCH', '/api/v1/timeline/multi-track', { 
        tracks: [{ id: 'track1', type: 'video' }] 
      });
      const res = await timelineRoute.PATCH(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.message).toContain('projectId');
    });

    it('atualiza apenas tracks', async () => {
      const req = makeRequest('PATCH', '/api/v1/timeline/multi-track', {
        projectId: 'p1',
        tracks: [{ id: 'track1', type: 'video', clips: [] }]
      });
      const res = await timelineRoute.PATCH(req);
      const json = await res.json();
      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.version).toBeGreaterThan(2);
      expect(json.message).toContain('parcialmente');
    });

    it('atualiza apenas settings', async () => {
      const req = makeRequest('PATCH', '/api/v1/timeline/multi-track', {
        projectId: 'p1',
        settings: { fps: 60, resolution: '3840x2160' }
      });
      const res = await timelineRoute.PATCH(req);
      const json = await res.json();
      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.settings.fps).toBe(60);
    });

    it('atualiza apenas totalDuration', async () => {
      const req = makeRequest('PATCH', '/api/v1/timeline/multi-track', {
        projectId: 'p1',
        totalDuration: 500
      });
      const res = await timelineRoute.PATCH(req);
      const json = await res.json();
      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.totalDuration).toBe(500);
    });

    it('atualiza múltiplos campos simultaneamente', async () => {
      const req = makeRequest('PATCH', '/api/v1/timeline/multi-track', {
        projectId: 'p1',
        tracks: [{ id: 'track1', type: 'audio', clips: [] }],
        settings: { fps: 24 },
        totalDuration: 600
      });
      const res = await timelineRoute.PATCH(req);
      const json = await res.json();
      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.totalDuration).toBe(600);
    });

    it('retorna 404 para timeline inexistente', async () => {
      const { prisma } = require('@/lib/prisma');
      prisma.timeline.update.mockRejectedValueOnce({ code: 'P2025' });
      
      const req = makeRequest('PATCH', '/api/v1/timeline/multi-track', {
        projectId: 'p999',
        totalDuration: 100
      });
      const res = await timelineRoute.PATCH(req);
      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.success).toBe(false);
    });
  });
});
