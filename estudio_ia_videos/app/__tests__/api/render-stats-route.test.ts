jest.mock('next/server', () => ({
  NextResponse: {
    json: (data: any, init?: { status?: number }) => {
      const headers = new Map<string, string>()
      return {
        status: init?.status ?? 200,
        json: async () => data,
        headers: {
          set: (k: string, v: string) => headers.set(k, v),
          get: (k: string) => headers.get(k)
        }
      }
    }
  }
}))

// Mock cache control to test HIT/MISS deterministically
jest.mock('@/lib/in-memory-cache', () => {
  return () => {
    const store = new Map<string, any>()
    return {
      get: (k: string) => store.get(k) || null,
      set: (k: string, v: any) => store.set(k, v)
    }
  }
})

// Mocks
jest.mock('next-auth', () => ({
  getServerSession: jest.fn()
}))
jest.mock('@/lib/supabase/admin', () => ({
  supabaseAdmin: () => {
    const sampleJobs = [
      {
        id: '1',
        status: 'completed',
        created_at: new Date(Date.now() - 60000).toISOString(),
        started_at: new Date(Date.now() - 50000).toISOString(),
        completed_at: new Date(Date.now() - 40000).toISOString(),
        error_message: null,
        render_settings: { resolution: '1080p', format: 'mp4' }
      },
      {
        id: '2',
        status: 'failed',
        created_at: new Date(Date.now() - 50000).toISOString(),
        started_at: new Date(Date.now() - 40000).toISOString(),
        completed_at: new Date(Date.now() - 30000).toISOString(),
        error_message: 'FFmpegError: codec not found',
        render_settings: { resolution: '720p', format: 'webm' }
      }
    ]
    // Minimal chainable builder with promise semantics
    const builder: any = {
      select: () => builder,
      gte: () => builder,
      order: () => builder,
      limit: () => builder,
      eq: () => builder,
      then: (resolve: any) => resolve({ data: sampleJobs, error: null, count: sampleJobs.length })
    }
    return {
      from: () => builder
    }
  }
}))

const { GET: routeGET } = require('../../api/analytics/render-stats/route')

describe('GET /api/analytics/render-stats', () => {
  const { getServerSession } = require('next-auth')

  function makeReq(query: string = ''): any {
    const url = `http://localhost/api/analytics/render-stats${query ? '?' + query : ''}`
    return {
      url,
      nextUrl: new URL(url)
    }
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('retorna 401 quando não autenticado', async () => {
    getServerSession.mockResolvedValueOnce(null)
    const resp = await routeGET(makeReq('timeRange=1h'))
    expect(resp.status).toBe(401)
  })

  it('retorna métricas básicas e X-Cache MISS na primeira chamada', async () => {
    getServerSession.mockResolvedValue({ user: { id: 'u1' } })
    const resp: any = await routeGET(makeReq('timeRange=1h&includeErrors=true&includePerformance=true'))
    expect(resp.status).toBe(200)
    const json = await resp.json()
    expect(json.metadata).toBeDefined()
    expect(json.basic_stats).toBeDefined()
    expect(json.queue_stats).toBeDefined()
    expect(json.performance_metrics).toBeDefined()
    expect(json.error_categories).toBeDefined()
    expect(resp.headers.get('X-Cache')).toBe('MISS')
  })

  it('segunda chamada mesma URL retorna X-Cache HIT', async () => {
    getServerSession.mockResolvedValue({ user: { id: 'u1' } })
    const req = makeReq('timeRange=1h&includeErrors=true&includePerformance=true&userId=testUser')
    const first: any = await routeGET(req)
    expect(first.headers.get('X-Cache')).toBe('MISS')
    const second: any = await routeGET(req)
    expect(second.headers.get('X-Cache')).toBe('HIT')
  })
})
