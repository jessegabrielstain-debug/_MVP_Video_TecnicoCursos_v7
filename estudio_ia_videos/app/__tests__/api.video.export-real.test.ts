/**
 * Teste da rota /api/v1/video/export-real (GET status)
 */
// @jest-environment node
/// <reference types="jest" />
import { NextRequest } from 'next/server'
import * as exportRoute from '@/api/v1/video/export-real/route'

jest.mock('@/lib/video-export-real', () => ({
  getExportJobStatus: jest.fn().mockResolvedValue({
    job: {
      id: 'job1', projectId: 'p1', status: 'processing', progress: 40,
      outputUrl: null, error: null, startedAt: new Date(), completedAt: null, metadata: {}
    }
  })
}))

function makeRequest(method: string, url: string): NextRequest {
  return new NextRequest(new URL(url, 'http://localhost').toString(), { method });
}

describe('API video export-real', () => {
  it('GET retorna status do job', async () => {
    const req = makeRequest('GET', '/api/v1/video/export-real?jobId=job1');
    const res = await exportRoute.GET(req);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.job?.id).toBe('job1');
    expect(['queued','processing','completed','error']).toContain(json.job?.status);
  });

  it('GET retorna outputUrl quando completed', async () => {
    const mod = require('@/lib/video-export-real');
    mod.getExportJobStatus.mockResolvedValueOnce({
      job: {
        id: 'job2', projectId: 'p1', status: 'completed', progress: 100,
        outputUrl: 'https://cdn.local/exports/job2.mp4', error: null,
        startedAt: new Date(), completedAt: new Date(), metadata: {}
      }
    });
    const req = makeRequest('GET', '/api/v1/video/export-real?jobId=job2');
    const res = await exportRoute.GET(req);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.job?.status).toBe('completed');
    expect(json.job?.outputUrl).toMatch(/\.mp4$/);
  });

  it('GET retorna metadata quando disponível', async () => {
    const mod = require('@/lib/video-export-real');
    mod.getExportJobStatus.mockResolvedValueOnce({
      job: {
        id: 'job3', projectId: 'p1', status: 'completed', progress: 100,
        outputUrl: 'https://cdn.local/exports/job3.webm', error: null,
        startedAt: new Date(), completedAt: new Date(), metadata: { codec: 'vp9', duration: 123.4, sizeBytes: 104857600 }
      }
    });
    const req = makeRequest('GET', '/api/v1/video/export-real?jobId=job3');
    const res = await exportRoute.GET(req)
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.job?.metadata?.codec).toBe('vp9')
    expect(json.job?.metadata?.duration).toBeGreaterThan(0)
    expect(json.job?.metadata?.sizeBytes).toBeGreaterThan(0)
  })
})
