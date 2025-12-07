import { GET, POST } from '../../api/nr-templates/route';
import * as service from '@/lib/services/nr-templates-service';
import { NextRequest } from 'next/server';

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

// Mock do serviço
jest.mock('@/lib/services/nr-templates-service', () => ({
  listNRTemplates: jest.fn(),
  getNRTemplate: jest.fn(),
  searchNRTemplates: jest.fn(),
  createNRTemplate: jest.fn(),
  updateNRTemplate: jest.fn(),
  deleteNRTemplate: jest.fn(),
}));

// Mock do Supabase
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

function createMockRequest(url: string, options: { method?: string, headers?: Record<string, string>, body?: unknown } = {}) {
  return {
    url,
    method: options.method || 'GET',
    headers: {
      get: (key: string) => options.headers?.[key] || options.headers?.[key.toLowerCase()] || null
    },
    json: async () => options.body || {}
  } as unknown as NextRequest;
}

describe('NR Templates API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('should list all templates when no params provided', async () => {
      const mockTemplates = [{ id: '1', nr_number: 'NR-01' }];
      (service.listNRTemplates as jest.Mock).mockResolvedValue(mockTemplates);

      const req = createMockRequest('http://localhost:3000/api/nr-templates');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data).toEqual(mockTemplates);
      expect(service.listNRTemplates).toHaveBeenCalled();
    });

    it('should get specific template by NR number', async () => {
      const mockTemplate = { id: '1', nr_number: 'NR-01' };
      (service.getNRTemplate as jest.Mock).mockResolvedValue(mockTemplate);

      const req = createMockRequest('http://localhost:3000/api/nr-templates?nr=NR-01');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data).toEqual(mockTemplate);
      expect(service.getNRTemplate).toHaveBeenCalledWith('NR-01');
    });

    it('should return 404 when template not found', async () => {
      (service.getNRTemplate as jest.Mock).mockResolvedValue(null);

      const req = createMockRequest('http://localhost:3000/api/nr-templates?nr=NR-99');
      const res = await GET(req);

      expect(res.status).toBe(404);
    });

    it('should search templates by query', async () => {
      const mockResults = [{ id: '1', title: 'Segurança' }];
      (service.searchNRTemplates as jest.Mock).mockResolvedValue(mockResults);

      const req = createMockRequest('http://localhost:3000/api/nr-templates?q=Segurança');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data).toEqual(mockResults);
      expect(service.searchNRTemplates).toHaveBeenCalledWith('Segurança');
    });
  });

  describe('POST', () => {
    it('should return 401 if no authorization header', async () => {
      const req = createMockRequest('http://localhost:3000/api/nr-templates', {
        method: 'POST',
        body: {}
      });
      const res = await POST(req);
      expect(res.status).toBe(401);
    });

    it('should return 403 if user is not admin', async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: { role: 'user' } })
          })
        })
      });

      const req = createMockRequest('http://localhost:3000/api/nr-templates', {
        method: 'POST',
        headers: { 'authorization': 'Bearer token' },
        body: {}
      });

      const res = await POST(req);
      expect(res.status).toBe(403);
    });

    it('should create template if user is admin', async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: 'admin-1' } }, error: null });
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: { role: 'admin' } })
          })
        })
      });

      const newTemplate = { nr_number: 'NR-20', title: 'Inflamáveis' };
      (service.createNRTemplate as jest.Mock).mockResolvedValue({ id: 'new-id', ...newTemplate });

      const req = createMockRequest('http://localhost:3000/api/nr-templates', {
        method: 'POST',
        headers: { 'authorization': 'Bearer token' },
        body: newTemplate
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(201);
      expect(data).toEqual({ id: 'new-id', ...newTemplate });
      expect(service.createNRTemplate).toHaveBeenCalledWith(newTemplate);
    });
  });
});
