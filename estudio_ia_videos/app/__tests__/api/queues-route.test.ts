import { GET } from '../../api/queues/route';
import { NextRequest } from 'next/server';
// RenderQueue is mocked below

// Mock NextResponse
jest.mock('next/server', () => ({
  NextResponse: {
    json: (data: unknown, init?: { status?: number }) => {
      return {
        status: init?.status ?? 200,
        json: async () => data,
      }
    }
  },
  NextRequest: jest.fn()
}));

// Mock RenderQueue
jest.mock('@/lib/queue/render-queue', () => {
  return {
    RenderQueue: jest.fn().mockImplementation(() => ({
      getWaitingCount: jest.fn().mockResolvedValue(1),
      getActiveCount: jest.fn().mockResolvedValue(2),
      getCompletedCount: jest.fn().mockResolvedValue(3),
      getFailedCount: jest.fn().mockResolvedValue(4),
      getDelayedCount: jest.fn().mockResolvedValue(5),
      getWaiting: jest.fn().mockResolvedValue([{ id: '1', name: 'job1' }]),
      getActive: jest.fn().mockResolvedValue([{ id: '2', name: 'job2' }]),
      getCompleted: jest.fn().mockResolvedValue([{ id: '3', name: 'job3' }]),
      getFailed: jest.fn().mockResolvedValue([{ id: '4', name: 'job4' }]),
    }))
  };
});

// Mock Supabase
const mockGetUser = jest.fn();
const mockFrom = jest.fn();
jest.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    auth: {
      getUser: mockGetUser
    },
    from: mockFrom
  })
}));

function createMockRequest(url: string, options: { method?: string, headers?: Record<string, string> } = {}) {
  return {
    url,
    method: options.method || 'GET',
    headers: {
      get: (key: string) => options.headers?.[key] || options.headers?.[key.toLowerCase()] || null
    }
  } as unknown as NextRequest;
}

describe('Queues API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 if no authorization header', async () => {
    const req = createMockRequest('http://localhost:3000/api/queues');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('should return 401 if user not found', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: 'No user' });
    const req = createMockRequest('http://localhost:3000/api/queues', {
      headers: { 'authorization': 'Bearer token' }
    });
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('should return 403 if user is not admin', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: { role: { name: 'user' } } })
        })
      })
    });

    const req = createMockRequest('http://localhost:3000/api/queues', {
      headers: { 'authorization': 'Bearer token' }
    });
    const res = await GET(req);
    expect(res.status).toBe(403);
  });

  it('should return queue stats if user is admin', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'admin-1' } }, error: null });
    
    mockFrom.mockImplementation((table: string) => {
      if (table === 'user_roles') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: { role: { name: 'admin' } } })
            })
          })
        }
      }
      if (table === 'render_jobs') {
        return {
          select: jest.fn(() => ({
            eq: jest.fn().mockResolvedValue({ count: 1 }),
            order: jest.fn().mockReturnThis(),
            limit: jest.fn().mockResolvedValue({ 
              data: [
                { id: '1', status: 'queued', created_at: new Date().toISOString() },
                { id: '2', status: 'processing', created_at: new Date().toISOString() },
                { id: '3', status: 'completed', created_at: new Date().toISOString() }
              ] 
            })
          }))
        }
      }
      return { select: jest.fn() }
    });

    const req = createMockRequest('http://localhost:3000/api/queues', {
      headers: { 'authorization': 'Bearer token' }
    });
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.stats).toEqual({
      waiting: 1,
      active: 1,
      completed: 1,
      failed: 1,
      delayed: 0,
      total: 4
    });
    expect(data.jobs.waiting).toHaveLength(1);
  });
});
