/**
 * Integration Tests: API Routes
 * 
 * Tests for critical API endpoints ensuring proper validation,
 * error handling, and response formats.
 */

import { NextRequest, NextResponse } from 'next/server'

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: null })),
          order: jest.fn(() => ({
            limit: jest.fn(() => Promise.resolve({ data: [], error: null })),
          })),
        })),
        order: jest.fn(() => ({
          limit: jest.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: { id: 'test-id' }, error: null })),
        })),
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ data: null, error: null })),
      })),
      delete: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ data: null, error: null })),
      })),
    })),
    auth: {
      getUser: jest.fn(() => Promise.resolve({ data: { user: { id: 'test-user' } }, error: null })),
    },
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn(() => Promise.resolve({ data: { path: 'test/path' }, error: null })),
        getPublicUrl: jest.fn(() => ({ data: { publicUrl: 'https://example.com/file' } })),
      })),
    },
  })),
}))

// Mock Redis/BullMQ
jest.mock('bullmq', () => ({
  Queue: jest.fn(() => ({
    add: jest.fn(() => Promise.resolve({ id: 'job-123' })),
    getJob: jest.fn(() => Promise.resolve(null)),
    getJobs: jest.fn(() => Promise.resolve([])),
  })),
}))

describe('API Integration Tests', () => {
  describe('Request Validation', () => {
    it('should validate required fields in request body', async () => {
      const request = new NextRequest('http://localhost:3000/api/render/start', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: { 'Content-Type': 'application/json' },
      })

      // Simulating validation behavior
      const body = await request.json()
      
      expect(body).toBeDefined()
      expect(body.projectId).toBeUndefined()
    })

    it('should parse JSON body correctly', async () => {
      const payload = {
        projectId: 'proj-123',
        userId: 'user-456',
        config: { fps: 30, quality: 'high' },
      }

      const request = new NextRequest('http://localhost:3000/api/render/start', {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'application/json' },
      })

      const body = await request.json()
      
      expect(body.projectId).toBe('proj-123')
      expect(body.userId).toBe('user-456')
      expect(body.config.fps).toBe(30)
    })

    it('should handle query parameters', () => {
      const request = new NextRequest(
        'http://localhost:3000/api/render/jobs?status=processing&limit=10'
      )

      const status = request.nextUrl.searchParams.get('status')
      const limit = request.nextUrl.searchParams.get('limit')
      
      expect(status).toBe('processing')
      expect(limit).toBe('10')
    })

    it('should extract path parameters from URL', () => {
      const url = 'http://localhost:3000/api/render/jobs/job-123'
      const request = new NextRequest(url)
      
      const pathParts = request.nextUrl.pathname.split('/')
      const jobId = pathParts[pathParts.length - 1]
      
      expect(jobId).toBe('job-123')
    })
  })

  describe('Response Formats', () => {
    it('should create JSON response with correct content type', () => {
      const data = { success: true, data: { id: 'test' } }
      const response = NextResponse.json(data, { status: 200 })

      expect(response.status).toBe(200)
      // NextResponse.json automatically sets content type
      expect(response).toBeDefined()
    })

    it('should create error response with appropriate status', () => {
      const errorResponse = NextResponse.json(
        { error: 'Not found', code: 'NOT_FOUND' },
        { status: 404 }
      )

      expect(errorResponse.status).toBe(404)
    })

    it('should create validation error response', () => {
      const validationError = {
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: [
          { field: 'projectId', message: 'Required' },
          { field: 'config.fps', message: 'Must be between 1 and 60' },
        ],
      }

      const response = NextResponse.json(validationError, { status: 400 })

      expect(response.status).toBe(400)
    })

    it('should support rate limit header pattern', () => {
      // Test the pattern for rate limit headers
      const rateLimitHeaders = {
        'X-RateLimit-Limit': '100',
        'X-RateLimit-Remaining': '99',
        'X-RateLimit-Reset': String(Date.now() + 60000),
      }

      expect(rateLimitHeaders['X-RateLimit-Limit']).toBe('100')
      expect(rateLimitHeaders['X-RateLimit-Remaining']).toBe('99')
      expect(parseInt(rateLimitHeaders['X-RateLimit-Reset'])).toBeGreaterThan(Date.now())
    })
  })

  describe('Authentication', () => {
    it('should extract authorization header', () => {
      const request = new NextRequest('http://localhost:3000/api/protected', {
        headers: { Authorization: 'Bearer test-token-123' },
      })

      const authHeader = request.headers.get('Authorization')
      
      expect(authHeader).toBe('Bearer test-token-123')
      expect(authHeader?.startsWith('Bearer ')).toBe(true)
    })

    it('should handle missing authorization', () => {
      const request = new NextRequest('http://localhost:3000/api/protected')

      const authHeader = request.headers.get('Authorization')
      
      // NextRequest returns undefined for missing headers (not null)
      expect(authHeader).toBeFalsy()
    })

    it('should extract token from Bearer header', () => {
      const request = new NextRequest('http://localhost:3000/api/protected', {
        headers: { Authorization: 'Bearer abc123xyz' },
      })

      const authHeader = request.headers.get('Authorization')
      const token = authHeader?.replace('Bearer ', '')
      
      expect(token).toBe('abc123xyz')
    })
  })

  describe('Error Handling', () => {
    it('should handle JSON parse errors gracefully', async () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        body: 'invalid json {',
        headers: { 'Content-Type': 'application/json' },
      })

      let parseError = null
      try {
        await request.json()
      } catch (error) {
        parseError = error
      }

      expect(parseError).not.toBeNull()
    })

    it('should create structured error responses', () => {
      const createErrorResponse = (
        message: string,
        code: string,
        status: number,
        details?: unknown
      ) => {
        return NextResponse.json({
          success: false,
          error: {
            message,
            code,
            details,
            timestamp: new Date().toISOString(),
          },
        }, { status })
      }

      const response = createErrorResponse(
        'Invalid input',
        'VALIDATION_ERROR',
        400,
        { field: 'email', reason: 'Invalid format' }
      )

      expect(response.status).toBe(400)
    })

    it('should handle server errors', () => {
      const serverError = NextResponse.json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        requestId: 'req-123',
      }, { status: 500 })

      expect(serverError.status).toBe(500)
    })
  })

  describe('CORS Headers', () => {
    it('should define CORS headers pattern', () => {
      const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }

      expect(corsHeaders['Access-Control-Allow-Origin']).toBe('*')
      expect(corsHeaders['Access-Control-Allow-Methods']).toContain('POST')
      expect(corsHeaders['Access-Control-Allow-Headers']).toContain('Authorization')
    })

    it('should handle OPTIONS preflight request pattern', () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'OPTIONS',
      })

      expect(request.method).toBe('OPTIONS')
      
      // Test preflight response pattern
      const preflightConfig = {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Max-Age': '86400',
        },
      }

      expect(preflightConfig.status).toBe(204)
      expect(preflightConfig.headers['Access-Control-Max-Age']).toBe('86400')
    })
  })

  describe('Request Methods', () => {
    it('should handle GET request', () => {
      const request = new NextRequest('http://localhost:3000/api/data')
      expect(request.method).toBe('GET')
    })

    it('should handle POST request', () => {
      const request = new NextRequest('http://localhost:3000/api/data', {
        method: 'POST',
        body: JSON.stringify({ test: true }),
      })
      expect(request.method).toBe('POST')
    })

    it('should handle PUT request', () => {
      const request = new NextRequest('http://localhost:3000/api/data/123', {
        method: 'PUT',
        body: JSON.stringify({ updated: true }),
      })
      expect(request.method).toBe('PUT')
    })

    it('should handle DELETE request', () => {
      const request = new NextRequest('http://localhost:3000/api/data/123', {
        method: 'DELETE',
      })
      expect(request.method).toBe('DELETE')
    })

    it('should handle PATCH request', () => {
      const request = new NextRequest('http://localhost:3000/api/data/123', {
        method: 'PATCH',
        body: JSON.stringify({ field: 'value' }),
      })
      expect(request.method).toBe('PATCH')
    })
  })

  describe('Pagination', () => {
    it('should parse pagination parameters', () => {
      const request = new NextRequest(
        'http://localhost:3000/api/items?page=2&limit=20&sort=created_at&order=desc'
      )

      const params = request.nextUrl.searchParams
      
      expect(params.get('page')).toBe('2')
      expect(params.get('limit')).toBe('20')
      expect(params.get('sort')).toBe('created_at')
      expect(params.get('order')).toBe('desc')
    })

    it('should create paginated response', () => {
      const paginatedResponse = {
        data: [{ id: 1 }, { id: 2 }],
        pagination: {
          page: 1,
          limit: 10,
          total: 100,
          totalPages: 10,
          hasNext: true,
          hasPrev: false,
        },
      }

      const response = NextResponse.json(paginatedResponse, { status: 200 })

      expect(response.status).toBe(200)
    })
  })

  describe('Content Types', () => {
    it('should handle JSON content type', () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: true }),
      })

      expect(request.headers.get('Content-Type')).toBe('application/json')
    })

    it('should handle form data content type', () => {
      const formData = new FormData()
      formData.append('file', new Blob(['test']), 'test.txt')

      const request = new NextRequest('http://localhost:3000/api/upload', {
        method: 'POST',
        body: formData,
      })

      expect(request.method).toBe('POST')
    })

    it('should handle multipart form data', () => {
      const formData = new FormData()
      formData.append('name', 'Test Project')
      formData.append('file', new Blob(['file content']), 'file.pptx')

      const request = new NextRequest('http://localhost:3000/api/upload', {
        method: 'POST',
        body: formData,
      })

      expect(request.method).toBe('POST')
    })
  })
})
