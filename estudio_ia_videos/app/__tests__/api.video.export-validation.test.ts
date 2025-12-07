/**
 * Testes de validação de combinações formato/codec/qualidade na rota POST export-real
 */
// @jest-environment node
/// <reference types="jest" />
import * as exportRoute from '@/api/v1/video/export-real/route'

jest.mock('@/lib/video-export-real', () => ({
  exportProjectVideo: jest.fn().mockResolvedValue({ success: true, jobId: 'job-valid-1' }),
}))

class NextRequest {
  url: string;
  method: string;
  constructor(url: string, init?: any) {
    this.url = url;
    this.method = init?.method || 'GET';
  }
  async json() {
    const body = (this as any)._body;
    return typeof body === 'string' ? JSON.parse(body) : body;
  }
}

function makeRequest(method: string, url: string, body?: any) {
  const req = new NextRequest(new URL(url, 'http://localhost').toString(), { method });
  if (body) (req as any)._body = body;
  return req;
}

describe('API video export-real (validações)', () => {
  it('retorna 400 para webm + h264', async () => {
    const req = makeRequest('POST', '/api/v1/video/export-real', { projectId: 'p1', options: { format: 'webm', codec: 'h264', quality: 'hd', fps: 30 } })
    const res = await exportRoute.POST(req)
    const json = await res.json()
    
    // Log for debugging if test fails
    if (res.status !== 400) {
      console.log('Unexpected status:', res.status);
      console.log('Response:', json);
    }
    
    expect(res.status).toBe(400)
    expect(json.error).toMatch(/webm.*vp9|av1/i)
  })

  it('aceita webm + vp9', async () => {
    const req = makeRequest('POST', '/api/v1/video/export-real', { projectId: 'p1', options: { format: 'webm', codec: 'vp9', quality: 'hd', fps: 30 } })
    const res = await exportRoute.POST(req)
    const json = await res.json()
    
    // Log for debugging if test fails
    if (res.status !== 200) {
      console.log('Unexpected status:', res.status);
      console.log('Response:', json);
    }
    
    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.jobId).toBeDefined()
  })
})
