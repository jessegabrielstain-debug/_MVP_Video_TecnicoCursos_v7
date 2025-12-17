/**
 * Tests for API Validator module
 * 
 * @group unit
 * @group validation
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  validateRequestBody,
  validateQueryParams,
  validatePathParams,
  sanitizeString,
  SafeString,
  SafeUrl,
  createValidationError,
} from '../../../lib/validation/api-validator';

// Mock logger
jest.mock('../../../lib/logger', () => ({
  Logger: jest.fn().mockImplementation(() => ({
    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  })),
}));

// Helper to create mock request
function createMockRequest(options: {
  method?: string;
  url?: string;
  body?: unknown;
  searchParams?: Record<string, string>;
}): NextRequest {
  const url = new URL(options.url ?? 'http://localhost/api/test');
  
  if (options.searchParams) {
    for (const [key, value] of Object.entries(options.searchParams)) {
      url.searchParams.set(key, value);
    }
  }
  
  const request = new NextRequest(url, {
    method: options.method ?? 'POST',
  });
  
  if (options.body !== undefined) {
    // Mock json() method
    jest.spyOn(request, 'json').mockResolvedValue(options.body);
  }
  
  return request;
}

describe('validateRequestBody', () => {
  const testSchema = z.object({
    name: z.string().min(1),
    age: z.number().int().positive(),
    email: z.string().email().optional(),
  });

  it('should validate correct body', async () => {
    const request = createMockRequest({
      body: { name: 'John', age: 25 },
    });

    const result = await validateRequestBody(request, testSchema);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ name: 'John', age: 25 });
    }
  });

  it('should reject missing required fields', async () => {
    const request = createMockRequest({
      body: { name: 'John' },
    });

    const result = await validateRequestBody(request, testSchema);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeDefined();
      expect(result.details).toBeDefined();
      expect(result.response.status).toBe(400);
    }
  });

  it('should reject invalid field types', async () => {
    const request = createMockRequest({
      body: { name: 'John', age: 'not a number' },
    });

    const result = await validateRequestBody(request, testSchema);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.details?.age).toBeDefined();
    }
  });

  it('should reject invalid email format', async () => {
    const request = createMockRequest({
      body: { name: 'John', age: 25, email: 'invalid-email' },
    });

    const result = await validateRequestBody(request, testSchema);

    expect(result.success).toBe(false);
  });

  it('should handle invalid JSON', async () => {
    const request = createMockRequest({ url: 'http://localhost/api/test' });
    jest.spyOn(request, 'json').mockRejectedValue(new SyntaxError('Invalid JSON'));

    const result = await validateRequestBody(request, testSchema);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('JSON');
    }
  });

  it('should use custom error status', async () => {
    const request = createMockRequest({
      body: { name: 'John' },
    });

    const result = await validateRequestBody(request, testSchema, {
      errorStatus: 422,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.response.status).toBe(422);
    }
  });

  it('should hide details when includeDetails is false', async () => {
    const request = createMockRequest({
      body: { name: 'John' },
    });

    const result = await validateRequestBody(request, testSchema, {
      includeDetails: false,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const body = await result.response.json();
      expect(body.details).toBeUndefined();
    }
  });
});

describe('validateQueryParams', () => {
  const querySchema = z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    search: z.string().optional(),
  });

  it('should validate correct query params', () => {
    const request = createMockRequest({
      searchParams: { page: '1', limit: '10', search: 'test' },
    });

    const result = validateQueryParams(request, querySchema);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ page: 1, limit: 10, search: 'test' });
    }
  });

  it('should handle empty query params', () => {
    const request = createMockRequest({});

    const result = validateQueryParams(request, querySchema);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({});
    }
  });

  it('should reject invalid query params', () => {
    const strictSchema = z.object({
      page: z.string().regex(/^\d+$/),
    });

    const request = createMockRequest({
      searchParams: { page: 'invalid' },
    });

    const result = validateQueryParams(request, strictSchema);

    expect(result.success).toBe(false);
  });
});

describe('validatePathParams', () => {
  const pathSchema = z.object({
    id: z.string().uuid(),
    type: z.enum(['user', 'project']),
  });

  it('should validate correct path params', () => {
    const params = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      type: 'user',
    };

    const result = validatePathParams(params, pathSchema);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(params);
    }
  });

  it('should reject invalid UUID', () => {
    const params = {
      id: 'not-a-uuid',
      type: 'user',
    };

    const result = validatePathParams(params, pathSchema);

    expect(result.success).toBe(false);
  });

  it('should reject invalid enum value', () => {
    const params = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      type: 'invalid',
    };

    const result = validatePathParams(params, pathSchema);

    expect(result.success).toBe(false);
  });
});

describe('sanitizeString', () => {
  it('should encode angle brackets', () => {
    const input = '<script>alert("xss")</script>Hello';
    const result = sanitizeString(input);
    expect(result).not.toContain('<script>');
    expect(result).toContain('&lt;script&gt;');
    expect(result).toContain('Hello');
  });

  it('should encode quotes', () => {
    const input = '<img onerror="alert(1)" src="x">';
    const result = sanitizeString(input);
    expect(result).toContain('&quot;');
  });

  it('should encode ampersands', () => {
    const input = 'Tom & Jerry';
    const result = sanitizeString(input);
    expect(result).toBe('Tom &amp; Jerry');
  });

  it('should preserve alphanumeric text', () => {
    const input = 'Hello World 123';
    const result = sanitizeString(input);
    expect(result).toBe('Hello World 123');
  });

  it('should handle empty string', () => {
    expect(sanitizeString('')).toBe('');
  });

  it('should encode single quotes', () => {
    const input = "it's a test";
    const result = sanitizeString(input);
    expect(result).toContain('&#x27;');
  });
});

describe('SafeString refinement', () => {
  it('should transform and encode strings', () => {
    const result = SafeString.safeParse('Hello World');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe('Hello World');
    }
  });

  it('should encode strings with script tags', () => {
    const result = SafeString.safeParse('<script>alert(1)</script>');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toContain('&lt;script&gt;');
    }
  });

  it('should encode strings with event handlers', () => {
    const result = SafeString.safeParse('<div onclick="alert(1)">');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toContain('&quot;');
    }
  });

  it('should encode HTML entities', () => {
    const result = SafeString.safeParse('Use <b>bold</b> for emphasis');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toContain('&lt;b&gt;');
    }
  });
});

describe('SafeUrl refinement', () => {
  it('should accept https URLs', () => {
    const result = SafeUrl.safeParse('https://example.com');
    expect(result.success).toBe(true);
  });

  it('should accept http URLs', () => {
    const result = SafeUrl.safeParse('http://example.com');
    expect(result.success).toBe(true);
  });

  it('should reject javascript: URLs', () => {
    const result = SafeUrl.safeParse('javascript:alert(1)');
    expect(result.success).toBe(false);
  });

  it('should reject data: URLs', () => {
    const result = SafeUrl.safeParse('data:text/html,<script>alert(1)</script>');
    expect(result.success).toBe(false);
  });

  it('should reject invalid URLs', () => {
    const result = SafeUrl.safeParse('not a url');
    expect(result.success).toBe(false);
  });
});

describe('createValidationError', () => {
  it('should create error response', () => {
    const response = createValidationError('Something went wrong');
    expect(response.status).toBe(400);
  });

  it('should use custom status', () => {
    const response = createValidationError('Error', undefined, 422);
    expect(response.status).toBe(422);
  });

  it('should include details when provided', async () => {
    const response = createValidationError('Error', { field: 'Invalid' });
    const body = await response.json();
    expect(body.details).toEqual({ field: 'Invalid' });
  });

  it('should have success false in body', async () => {
    const response = createValidationError('Error');
    const body = await response.json();
    expect(body.success).toBe(false);
  });
});

describe('complex validation scenarios', () => {
  it('should validate nested objects', async () => {
    const nestedSchema = z.object({
      user: z.object({
        name: z.string(),
        address: z.object({
          city: z.string(),
          country: z.string(),
        }),
      }),
    });

    const request = createMockRequest({
      body: {
        user: {
          name: 'John',
          address: {
            city: 'NYC',
            country: 'USA',
          },
        },
      },
    });

    const result = await validateRequestBody(request, nestedSchema);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.user.address.city).toBe('NYC');
    }
  });

  it('should validate arrays', async () => {
    const arraySchema = z.object({
      items: z.array(z.string()).min(1).max(10),
    });

    const request = createMockRequest({
      body: { items: ['a', 'b', 'c'] },
    });

    const result = await validateRequestBody(request, arraySchema);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.items).toHaveLength(3);
    }
  });

  it('should reject array with too many items', async () => {
    const arraySchema = z.object({
      items: z.array(z.string()).max(2),
    });

    const request = createMockRequest({
      body: { items: ['a', 'b', 'c', 'd'] },
    });

    const result = await validateRequestBody(request, arraySchema);

    expect(result.success).toBe(false);
  });

  it('should handle discriminated unions', async () => {
    const unionSchema = z.discriminatedUnion('type', [
      z.object({ type: z.literal('email'), email: z.string().email() }),
      z.object({ type: z.literal('phone'), phone: z.string() }),
    ]);

    const emailRequest = createMockRequest({
      body: { type: 'email', email: 'test@example.com' },
    });

    const result = await validateRequestBody(emailRequest, unionSchema);

    expect(result.success).toBe(true);
  });
});
