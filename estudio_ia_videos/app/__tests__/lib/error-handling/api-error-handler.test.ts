/**
 * @fileoverview Tests for API Error Handler
 * Tests for ApiError class and apiClient utilities
 */

import { ApiError, apiClient } from '@/lib/error-handling/api-error-handler';

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('ApiError', () => {
  describe('constructor', () => {
    it('should create an ApiError with message and status code', () => {
      const error = new ApiError('Not Found', 404);
      
      expect(error.message).toBe('Not Found');
      expect(error.statusCode).toBe(404);
      expect(error.name).toBe('ApiError');
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ApiError);
    });

    it('should create an ApiError with optional code', () => {
      const error = new ApiError('Validation Error', 400, 'VALIDATION_ERROR');
      
      expect(error.message).toBe('Validation Error');
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('VALIDATION_ERROR');
    });

    it('should work without optional code', () => {
      const error = new ApiError('Server Error', 500);
      
      expect(error.code).toBeUndefined();
    });

    it('should have correct stack trace', () => {
      const error = new ApiError('Test Error', 500);
      
      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('ApiError');
    });
  });

  describe('common HTTP errors', () => {
    it('should handle 400 Bad Request', () => {
      const error = new ApiError('Bad Request', 400, 'BAD_REQUEST');
      expect(error.statusCode).toBe(400);
    });

    it('should handle 401 Unauthorized', () => {
      const error = new ApiError('Unauthorized', 401, 'UNAUTHORIZED');
      expect(error.statusCode).toBe(401);
    });

    it('should handle 403 Forbidden', () => {
      const error = new ApiError('Forbidden', 403, 'FORBIDDEN');
      expect(error.statusCode).toBe(403);
    });

    it('should handle 404 Not Found', () => {
      const error = new ApiError('Not Found', 404, 'NOT_FOUND');
      expect(error.statusCode).toBe(404);
    });

    it('should handle 429 Too Many Requests', () => {
      const error = new ApiError('Too Many Requests', 429, 'RATE_LIMIT');
      expect(error.statusCode).toBe(429);
    });

    it('should handle 500 Internal Server Error', () => {
      const error = new ApiError('Internal Server Error', 500, 'INTERNAL_ERROR');
      expect(error.statusCode).toBe(500);
    });

    it('should handle 503 Service Unavailable', () => {
      const error = new ApiError('Service Unavailable', 503, 'SERVICE_UNAVAILABLE');
      expect(error.statusCode).toBe(503);
    });
  });
});

describe('apiClient', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('handleError', () => {
    it('should return ApiError as-is', () => {
      const originalError = new ApiError('Original Error', 404, 'NOT_FOUND');
      const result = apiClient.handleError(originalError);
      
      expect(result).toBe(originalError);
      expect(result.message).toBe('Original Error');
      expect(result.statusCode).toBe(404);
      expect(result.code).toBe('NOT_FOUND');
    });

    it('should wrap Error with message', () => {
      const error = new Error('Something went wrong');
      const result = apiClient.handleError(error);
      
      expect(result).toBeInstanceOf(ApiError);
      expect(result.message).toBe('Something went wrong');
      expect(result.statusCode).toBe(500);
    });

    it('should handle unknown errors with default message', () => {
      const result = apiClient.handleError('string error');
      
      expect(result).toBeInstanceOf(ApiError);
      expect(result.message).toBe('An unexpected error occurred');
      expect(result.statusCode).toBe(500);
    });

    it('should handle null error', () => {
      const result = apiClient.handleError(null);
      
      expect(result).toBeInstanceOf(ApiError);
      expect(result.message).toBe('An unexpected error occurred');
      expect(result.statusCode).toBe(500);
    });

    it('should handle undefined error', () => {
      const result = apiClient.handleError(undefined);
      
      expect(result).toBeInstanceOf(ApiError);
      expect(result.message).toBe('An unexpected error occurred');
      expect(result.statusCode).toBe(500);
    });

    it('should handle object error without message', () => {
      const result = apiClient.handleError({ code: 'ERROR' });
      
      expect(result).toBeInstanceOf(ApiError);
      expect(result.statusCode).toBe(500);
    });

    it('should preserve Error subclass messages', () => {
      const typeError = new TypeError('Invalid type');
      const result = apiClient.handleError(typeError);
      
      expect(result.message).toBe('Invalid type');
    });
  });

  describe('request', () => {
    it('should make successful GET request', async () => {
      const mockData = { id: 1, name: 'Test' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await apiClient.request<typeof mockData>('/api/test');
      
      expect(mockFetch).toHaveBeenCalledWith('/api/test', undefined);
      expect(result).toEqual(mockData);
    });

    it('should make successful POST request', async () => {
      const mockData = { success: true };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const options = {
        method: 'POST',
        body: JSON.stringify({ name: 'test' }),
        headers: { 'Content-Type': 'application/json' },
      };

      const result = await apiClient.request('/api/test', options);
      
      expect(mockFetch).toHaveBeenCalledWith('/api/test', options);
      expect(result).toEqual(mockData);
    });

    it('should throw ApiError on 400 response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
      });

      try {
        await apiClient.request('/api/test');
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).statusCode).toBe(400);
        expect((error as ApiError).message).toContain('400');
      }
    });

    it('should throw ApiError on 401 response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      try {
        await apiClient.request('/api/test');
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).statusCode).toBe(401);
        expect((error as ApiError).message).toContain('401');
      }
    });

    it('should throw ApiError on 404 response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      try {
        await apiClient.request('/api/resource');
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).statusCode).toBe(404);
      }
    });

    it('should throw ApiError on 500 response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      try {
        await apiClient.request('/api/test');
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).statusCode).toBe(500);
      }
    });

    it('should include status in error message', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
      });

      try {
        await apiClient.request('/api/test');
        fail('Should have thrown');
      } catch (error) {
        expect((error as ApiError).message).toBe('Request failed with status 503');
      }
    });

    it('should propagate network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(apiClient.request('/api/test')).rejects.toThrow('Network error');
    });

    it('should handle different HTTP methods', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({}),
      });

      const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
      
      for (const method of methods) {
        await apiClient.request('/api/test', { method });
        expect(mockFetch).toHaveBeenLastCalledWith('/api/test', { method });
      }
    });

    it('should handle JSON response', async () => {
      const complexData = {
        users: [
          { id: 1, name: 'Alice' },
          { id: 2, name: 'Bob' },
        ],
        total: 2,
        metadata: {
          page: 1,
          limit: 10,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => complexData,
      });

      const result = await apiClient.request<typeof complexData>('/api/users');
      
      expect(result).toEqual(complexData);
      expect(result.users).toHaveLength(2);
      expect(result.metadata.page).toBe(1);
    });

    it('should work with custom headers', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      await apiClient.request('/api/test', {
        headers: {
          'Authorization': 'Bearer token123',
          'X-Custom-Header': 'value',
        },
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/test', {
        headers: {
          'Authorization': 'Bearer token123',
          'X-Custom-Header': 'value',
        },
      });
    });
  });
});

describe('Integration scenarios', () => {
  it('should handle error and extract message', () => {
    try {
      throw new ApiError('User not found', 404, 'USER_NOT_FOUND');
    } catch (error) {
      const handled = apiClient.handleError(error);
      expect(handled.message).toBe('User not found');
      expect(handled.code).toBe('USER_NOT_FOUND');
    }
  });

  it('should chain request error handling', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
    });

    try {
      await apiClient.request('/api/protected');
    } catch (error) {
      const handled = apiClient.handleError(error);
      expect(handled.statusCode).toBe(403);
    }
  });

  it('should differentiate error types', () => {
    const apiError = new ApiError('API Error', 400);
    const genericError = new Error('Generic Error');

    expect(apiClient.handleError(apiError)).toBe(apiError);
    expect(apiClient.handleError(genericError).statusCode).toBe(500);
  });
});
