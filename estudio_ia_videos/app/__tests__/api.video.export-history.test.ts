// @jest-environment node
import * as exportRoute from '@/api/v1/video/export-real/route'

jest.mock('@/lib/prisma', () => ({
  prisma: {
    videoExport: {
      count: jest.fn().mockResolvedValue(2),
      findMany: jest.fn().mockResolvedValue([
        { id: 'j1', status: 'completed', progress: 100, videoUrl: 's3://videos/j1.mp4', errorMessage: null, createdAt: new Date('2025-01-01'), updatedAt: new Date('2025-01-01') },
        { id: 'j2', status: 'processing', progress: 50, videoUrl: null, errorMessage: null, createdAt: new Date('2025-01-02'), updatedAt: new Date('2025-01-02') },
      ])
    }
  }
}))

class NextRequest {
  url: string;
  method: string;
  constructor(url: string, init?: any) {
    this.url = url;
    this.method = init?.method || 'GET';
  }
}

function makeRequest(url: string): NextRequest {
  return new NextRequest(new URL(url, 'http://localhost').toString(), { method: 'GET' });
}

describe('API video export-real (histórico)', () => {
  it('GET retorna histórico quando projectId informado', async () => {
    const req = makeRequest('/api/v1/video/export-real?projectId=p1');
    const res = await exportRoute.GET(req);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(Array.isArray(json.history)).toBe(true);
    expect(json.history.length).toBeGreaterThan(0);
    expect(json.history[0]).toHaveProperty('id');
    expect(json.history[0]).toHaveProperty('status');
  });
});
