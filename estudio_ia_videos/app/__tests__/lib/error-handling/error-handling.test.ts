/**
 * Tests for app/lib/error-handling.ts
 */

import {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  ExternalServiceError,
  DatabaseError,
  TimeoutError,
  ErrorCategory,
  categorizeError,
  normalizeError,
  getUserMessage,
  safeJsonParse,
  withRetry,
} from '../../../lib/error-handling'

describe('Error Handling Module', () => {
  describe('AppError', () => {
    it('should create error with default category', () => {
      const error = new AppError('Test error')
      
      expect(error.message).toBe('Test error')
      expect(error.category).toBe(ErrorCategory.INTERNAL)
      expect(error.statusCode).toBe(500)
      expect(error.isOperational).toBe(true)
      expect(error.name).toBe('AppError')
    })

    it('should create error with custom category', () => {
      const error = new AppError('Not found', ErrorCategory.NOT_FOUND)
      
      expect(error.category).toBe(ErrorCategory.NOT_FOUND)
      expect(error.statusCode).toBe(404)
    })

    it('should include context', () => {
      const context = { userId: '123', action: 'test' }
      const error = new AppError('Test', ErrorCategory.VALIDATION, context)
      
      expect(error.context).toEqual(context)
    })

    it('should serialize to JSON correctly', () => {
      const error = new AppError('Test', ErrorCategory.VALIDATION, { key: 'value' })
      const json = error.toJSON()
      
      expect(json.name).toBe('AppError')
      expect(json.message).toBe('Test')
      expect(json.category).toBe(ErrorCategory.VALIDATION)
      expect(json.statusCode).toBe(400)
      expect(json.context).toEqual({ key: 'value' })
    })
  })

  describe('Specialized Errors', () => {
    describe('ValidationError', () => {
      it('should create with correct category and status', () => {
        const error = new ValidationError('Invalid input', { field: 'email' })
        
        expect(error.name).toBe('ValidationError')
        expect(error.category).toBe(ErrorCategory.VALIDATION)
        expect(error.statusCode).toBe(400)
        expect(error.context).toEqual({ field: 'email' })
      })
    })

    describe('AuthenticationError', () => {
      it('should create with default message', () => {
        const error = new AuthenticationError()
        
        expect(error.name).toBe('AuthenticationError')
        expect(error.message).toBe('Autenticação necessária')
        expect(error.category).toBe(ErrorCategory.AUTHENTICATION)
        expect(error.statusCode).toBe(401)
      })

      it('should create with custom message', () => {
        const error = new AuthenticationError('Token expirado')
        expect(error.message).toBe('Token expirado')
      })
    })

    describe('AuthorizationError', () => {
      it('should create with correct category', () => {
        const error = new AuthorizationError()
        
        expect(error.name).toBe('AuthorizationError')
        expect(error.category).toBe(ErrorCategory.AUTHORIZATION)
        expect(error.statusCode).toBe(403)
      })
    })

    describe('NotFoundError', () => {
      it('should create with resource name', () => {
        const error = new NotFoundError('Usuário')
        
        expect(error.name).toBe('NotFoundError')
        expect(error.message).toBe('Usuário não encontrado')
        expect(error.category).toBe(ErrorCategory.NOT_FOUND)
        expect(error.statusCode).toBe(404)
      })

      it('should use default resource name', () => {
        const error = new NotFoundError()
        expect(error.message).toBe('Recurso não encontrado')
      })
    })

    describe('ConflictError', () => {
      it('should create with message', () => {
        const error = new ConflictError('Versão desatualizada')
        
        expect(error.name).toBe('ConflictError')
        expect(error.category).toBe(ErrorCategory.CONFLICT)
        expect(error.statusCode).toBe(409)
      })
    })

    describe('RateLimitError', () => {
      it('should include retryAfter in context', () => {
        const error = new RateLimitError(60)
        
        expect(error.name).toBe('RateLimitError')
        expect(error.category).toBe(ErrorCategory.RATE_LIMIT)
        expect(error.statusCode).toBe(429)
        expect(error.context?.retryAfter).toBe(60)
      })
    })

    describe('ExternalServiceError', () => {
      it('should include service name and original error', () => {
        const originalError = new Error('API down')
        const error = new ExternalServiceError('ElevenLabs', originalError)
        
        expect(error.name).toBe('ExternalServiceError')
        expect(error.message).toBe('Erro no serviço ElevenLabs')
        expect(error.category).toBe(ErrorCategory.EXTERNAL_SERVICE)
        expect(error.statusCode).toBe(502)
        expect(error.context?.service).toBe('ElevenLabs')
        expect(error.context?.originalMessage).toBe('API down')
      })
    })

    describe('DatabaseError', () => {
      it('should include operation name', () => {
        const error = new DatabaseError('SELECT users')
        
        expect(error.name).toBe('DatabaseError')
        expect(error.message).toBe('Erro de banco de dados: SELECT users')
        expect(error.category).toBe(ErrorCategory.DATABASE)
        expect(error.statusCode).toBe(500)
        expect(error.context?.operation).toBe('SELECT users')
      })
    })

    describe('TimeoutError', () => {
      it('should include operation and timeout', () => {
        const error = new TimeoutError('video rendering', 30000)
        
        expect(error.name).toBe('TimeoutError')
        expect(error.message).toBe('Timeout em video rendering após 30000ms')
        expect(error.category).toBe(ErrorCategory.TIMEOUT)
        expect(error.statusCode).toBe(504)
        expect(error.context?.operation).toBe('video rendering')
        expect(error.context?.timeout).toBe(30000)
      })
    })
  })

  describe('categorizeError', () => {
    it('should return category from AppError', () => {
      const error = new ValidationError('Test')
      expect(categorizeError(error)).toBe(ErrorCategory.VALIDATION)
    })

    it('should categorize timeout errors', () => {
      expect(categorizeError(new Error('Request timed out'))).toBe(ErrorCategory.TIMEOUT)
      expect(categorizeError(new Error('Operation timeout'))).toBe(ErrorCategory.TIMEOUT)
    })

    it('should categorize ffmpeg errors', () => {
      expect(categorizeError(new Error('FFmpeg encoding failed'))).toBe(ErrorCategory.FFMPEG)
      expect(categorizeError(new Error('Invalid codec'))).toBe(ErrorCategory.FFMPEG)
    })

    it('should categorize network errors', () => {
      expect(categorizeError(new Error('Network error'))).toBe(ErrorCategory.NETWORK)
      expect(categorizeError(new Error('ECONNREFUSED'))).toBe(ErrorCategory.NETWORK)
      expect(categorizeError(new Error('Fetch failed'))).toBe(ErrorCategory.NETWORK)
    })

    it('should categorize storage errors', () => {
      expect(categorizeError(new Error('Storage bucket not found'))).toBe(ErrorCategory.STORAGE)
      expect(categorizeError(new Error('Upload failed'))).toBe(ErrorCategory.STORAGE)
    })

    it('should categorize database errors', () => {
      expect(categorizeError(new Error('Database connection failed'))).toBe(ErrorCategory.DATABASE)
      expect(categorizeError(new Error('Prisma query error'))).toBe(ErrorCategory.DATABASE)
      expect(categorizeError(new Error('Supabase error'))).toBe(ErrorCategory.DATABASE)
    })

    it('should categorize auth errors', () => {
      expect(categorizeError(new Error('Authentication failed'))).toBe(ErrorCategory.AUTHENTICATION)
      expect(categorizeError(new Error('Invalid token'))).toBe(ErrorCategory.AUTHENTICATION)
      expect(categorizeError(new Error('JWT expired'))).toBe(ErrorCategory.AUTHENTICATION)
    })

    it('should categorize authorization errors', () => {
      expect(categorizeError(new Error('Permission denied'))).toBe(ErrorCategory.AUTHORIZATION)
      expect(categorizeError(new Error('Forbidden access'))).toBe(ErrorCategory.AUTHORIZATION)
      expect(categorizeError(new Error('Access denied'))).toBe(ErrorCategory.AUTHORIZATION)
    })

    it('should categorize not found errors', () => {
      expect(categorizeError(new Error('Resource not found'))).toBe(ErrorCategory.NOT_FOUND)
      expect(categorizeError(new Error('404 error'))).toBe(ErrorCategory.NOT_FOUND)
    })

    it('should categorize validation errors', () => {
      expect(categorizeError(new Error('Validation failed'))).toBe(ErrorCategory.VALIDATION)
      expect(categorizeError(new Error('Invalid input'))).toBe(ErrorCategory.VALIDATION)
      expect(categorizeError(new Error('Field required'))).toBe(ErrorCategory.VALIDATION)
    })

    it('should categorize resource errors', () => {
      expect(categorizeError(new Error('Memory limit exceeded'))).toBe(ErrorCategory.RESOURCE)
      expect(categorizeError(new Error('Heap out of memory'))).toBe(ErrorCategory.RESOURCE)
    })

    it('should return UNKNOWN for unrecognized errors', () => {
      expect(categorizeError(new Error('Some random error'))).toBe(ErrorCategory.UNKNOWN)
      expect(categorizeError('string error')).toBe(ErrorCategory.UNKNOWN)
    })
  })

  describe('normalizeError', () => {
    it('should return AppError as-is', () => {
      const original = new ValidationError('Test')
      const normalized = normalizeError(original)
      
      expect(normalized).toBe(original)
    })

    it('should convert regular Error to AppError', () => {
      const original = new Error('Timeout occurred')
      const normalized = normalizeError(original)
      
      expect(normalized).toBeInstanceOf(AppError)
      expect(normalized.message).toBe('Timeout occurred')
      expect(normalized.category).toBe(ErrorCategory.TIMEOUT)
    })

    it('should convert string to AppError', () => {
      const normalized = normalizeError('String error')
      
      expect(normalized).toBeInstanceOf(AppError)
      expect(normalized.message).toBe('String error')
      expect(normalized.category).toBe(ErrorCategory.UNKNOWN)
    })
  })

  describe('getUserMessage', () => {
    it('should return message from operational AppError', () => {
      const error = new ValidationError('Email inválido')
      expect(getUserMessage(error)).toBe('Email inválido')
    })

    it('should return generic message for non-operational errors', () => {
      const error = new AppError('Internal details', ErrorCategory.INTERNAL, undefined, false)
      expect(getUserMessage(error)).toBe('Erro interno do servidor')
    })

    it('should return generic message for unknown errors', () => {
      expect(getUserMessage(new Error('Random error'))).toBe('Erro desconhecido')
    })

    it('should return category message for categorized errors', () => {
      const error = new Error('Database connection failed')
      expect(getUserMessage(error)).toBe('Erro ao acessar o banco de dados')
    })
  })

  describe('safeJsonParse', () => {
    it('should parse valid JSON', () => {
      const result = safeJsonParse('{"key": "value"}', {})
      expect(result).toEqual({ key: 'value' })
    })

    it('should return fallback for invalid JSON', () => {
      const fallback = { default: true }
      const result = safeJsonParse('invalid json', fallback)
      expect(result).toBe(fallback)
    })

    it('should handle different types', () => {
      expect(safeJsonParse('"string"', 'fallback')).toBe('string')
      expect(safeJsonParse('123', 0)).toBe(123)
      expect(safeJsonParse('[1,2,3]', [])).toEqual([1, 2, 3])
    })
  })

  describe('withRetry', () => {
    it('should succeed on first attempt', async () => {
      const fn = jest.fn().mockResolvedValue('success')
      
      const result = await withRetry(fn)
      
      expect(result).toBe('success')
      expect(fn).toHaveBeenCalledTimes(1)
    })

    it('should retry on failure and succeed', async () => {
      const fn = jest.fn()
        .mockRejectedValueOnce(new Error('Fail 1'))
        .mockRejectedValueOnce(new Error('Fail 2'))
        .mockResolvedValue('success')

      const result = await withRetry(fn, { maxAttempts: 3, delayMs: 10 })
      
      expect(result).toBe('success')
      expect(fn).toHaveBeenCalledTimes(3)
    }, 10000)

    it('should throw after max attempts', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('Always fail'))

      await expect(
        withRetry(fn, { maxAttempts: 2, delayMs: 10 })
      ).rejects.toThrow('Always fail')
      
      expect(fn).toHaveBeenCalledTimes(2)
    }, 10000)

    it('should respect shouldRetry predicate', async () => {
      const fn = jest.fn().mockRejectedValue(new ValidationError('Invalid'))

      const shouldRetry = (error: unknown) => !(error instanceof ValidationError)
      
      await expect(
        withRetry(fn, { maxAttempts: 3, shouldRetry })
      ).rejects.toThrow('Invalid')
      
      // Should not retry on ValidationError
      expect(fn).toHaveBeenCalledTimes(1)
    })

    it('should apply exponential backoff', async () => {
      const fn = jest.fn()
        .mockRejectedValueOnce(new Error('Fail'))
        .mockRejectedValueOnce(new Error('Fail'))
        .mockResolvedValue('success')

      const startTime = Date.now()
      const result = await withRetry(fn, { 
        maxAttempts: 3, 
        delayMs: 10,
        backoffMultiplier: 2 
      })
      const elapsed = Date.now() - startTime

      expect(result).toBe('success')
      expect(fn).toHaveBeenCalledTimes(3)
      // Should have waited at least 10 + 20 = 30ms (with some tolerance)
      expect(elapsed).toBeGreaterThanOrEqual(25)
    }, 10000)
  })

  describe('Error Category Mapping', () => {
    const categoryStatusMap: [ErrorCategory, number][] = [
      [ErrorCategory.VALIDATION, 400],
      [ErrorCategory.AUTHENTICATION, 401],
      [ErrorCategory.AUTHORIZATION, 403],
      [ErrorCategory.NOT_FOUND, 404],
      [ErrorCategory.CONFLICT, 409],
      [ErrorCategory.RATE_LIMIT, 429],
      [ErrorCategory.EXTERNAL_SERVICE, 502],
      [ErrorCategory.DATABASE, 500],
      [ErrorCategory.NETWORK, 503],
      [ErrorCategory.TIMEOUT, 504],
      [ErrorCategory.FFMPEG, 500],
      [ErrorCategory.STORAGE, 500],
      [ErrorCategory.RESOURCE, 507],
      [ErrorCategory.INTERNAL, 500],
      [ErrorCategory.UNKNOWN, 500],
    ]

    it.each(categoryStatusMap)(
      'should map %s to status %i',
      (category, expectedStatus) => {
        const error = new AppError('Test', category)
        expect(error.statusCode).toBe(expectedStatus)
      }
    )
  })
})
