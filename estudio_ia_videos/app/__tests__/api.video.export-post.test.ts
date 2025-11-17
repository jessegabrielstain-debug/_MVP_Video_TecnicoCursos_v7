/**
 * Testes da rota /api/v1/video/export-real (POST)
 */
// @jest-environment node
/// <reference types="jest" />
import { NextRequest } from 'next/server'
import * as exportRoute from '@/api/v1/video/export-real/route'

jest.mock('@/lib/video-export-real', () => ({
  exportProjectVideo: jest.fn().mockResolvedValue({ success: true, jobId: 'job-post-1' }),
}))

function makeRequest(method: string, url: string, body?: unknown): NextRequest {
  const headers: HeadersInit = { 'content-type': 'application/json' }
  const init: RequestInit = { method, headers }

  if (body !== undefined) {
    init.body = JSON.stringify(body)
  }

  return new NextRequest(new URL(url, 'http://localhost').toString(), init)
}

describe('API video export-real (POST)', () => {
  it('retorna 400 quando projectId ausente', async () => {
    const req = makeRequest('POST', '/api/v1/video/export-real', { options: { format: 'mp4' } })
    const res = await exportRoute.POST(req)
    expect(res.status).toBe(400)
  })

  it('retorna 200 e jobId quando sucesso', async () => {
    const req = makeRequest('POST', '/api/v1/video/export-real', { projectId: 'p1', options: { format: 'mp4', fps: 30 } })
    const res = await exportRoute.POST(req)
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.jobId).toBe('job-post-1')
  })
})
