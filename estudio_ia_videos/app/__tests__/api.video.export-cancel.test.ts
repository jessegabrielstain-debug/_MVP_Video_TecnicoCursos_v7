/**
 * Teste da rota /api/v1/video/export-real (DELETE cancel)
 */
// @jest-environment node
/// <reference types="jest" />
import { NextRequest } from 'next/server'
import * as exportRoute from '@/api/v1/video/export-real/route'

function makeRequest(method: string, url: string): NextRequest {
  const init: RequestInit = { method }
  return new NextRequest(new URL(url, 'http://localhost').toString(), init)
}

describe('API video export-real (cancel)', () => {
  it('DELETE cancela job com sucesso quando jobId é fornecido', async () => {
    const req = makeRequest('DELETE', '/api/v1/video/export-real?jobId=job-cancel-1')
    const res = await exportRoute.DELETE(req)
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.jobId).toBe('job-cancel-1')
  })

  it('DELETE retorna 400 sem jobId', async () => {
    const req = makeRequest('DELETE', '/api/v1/video/export-real')
    const res = await exportRoute.DELETE(req)
    expect(res.status).toBe(400)
  })
})
