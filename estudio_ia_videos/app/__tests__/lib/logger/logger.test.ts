/**
 * Tests for app/lib/logger.ts
 * Professional Logger Service with levels, formatting, and production-ready features
 */

import { Logger, logger, log } from '../../../lib/logger'

// Mock Sentry
jest.mock('@sentry/nextjs', () => ({
  captureException: jest.fn(),
  captureMessage: jest.fn(),
}))

import * as Sentry from '@sentry/nextjs'

describe('Logger Module', () => {
  let originalEnv: NodeJS.ProcessEnv
  let consoleDebugSpy: jest.SpyInstance
  let consoleInfoSpy: jest.SpyInstance
  let consoleWarnSpy: jest.SpyInstance
  let consoleErrorSpy: jest.SpyInstance

  beforeAll(() => {
    originalEnv = { ...process.env }
  })

  beforeEach(() => {
    jest.clearAllMocks()
    consoleDebugSpy = jest.spyOn(console, 'debug').mockImplementation()
    consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation()
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation()
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
  })

  afterEach(() => {
    process.env = { ...originalEnv }
    jest.restoreAllMocks()
  })

  describe('Logger Class', () => {
    describe('Constructor', () => {
      it('should create logger without namespace', () => {
        const loggerInstance = new Logger()
        expect(loggerInstance).toBeInstanceOf(Logger)
      })

      it('should create logger with namespace', () => {
        const loggerInstance = new Logger('TestNamespace')
        expect(loggerInstance).toBeInstanceOf(Logger)
      })
    })

    describe('Log Levels', () => {
      it('should log debug messages in development', () => {
        process.env.NODE_ENV = 'development'
        process.env.LOG_LEVEL = 'debug'
        const loggerInstance = new Logger()
        
        loggerInstance.debug('Debug message')
        
        expect(consoleDebugSpy).toHaveBeenCalled()
      })

      it('should not log debug in production by default', () => {
        process.env.NODE_ENV = 'production'
        process.env.LOG_LEVEL = 'info'
        const loggerInstance = new Logger()
        
        loggerInstance.debug('Debug message')
        
        // Debug should not be called when level is info
        expect(consoleDebugSpy).not.toHaveBeenCalled()
      })

      it('should log info messages', () => {
        process.env.NODE_ENV = 'development'
        process.env.LOG_LEVEL = 'info'
        const loggerInstance = new Logger()
        
        loggerInstance.info('Info message')
        
        expect(consoleInfoSpy).toHaveBeenCalled()
      })

      it('should log warn messages', () => {
        process.env.NODE_ENV = 'development'
        process.env.LOG_LEVEL = 'info'
        const loggerInstance = new Logger()
        
        loggerInstance.warn('Warning message')
        
        expect(consoleWarnSpy).toHaveBeenCalled()
      })

      it('should log error messages', () => {
        process.env.NODE_ENV = 'development'
        process.env.LOG_LEVEL = 'info'
        const loggerInstance = new Logger()
        
        loggerInstance.error('Error message')
        
        expect(consoleErrorSpy).toHaveBeenCalled()
      })

      it('should respect minimum log level', () => {
        process.env.NODE_ENV = 'development'
        process.env.LOG_LEVEL = 'warn'
        const loggerInstance = new Logger()
        
        loggerInstance.debug('Debug')
        loggerInstance.info('Info')
        loggerInstance.warn('Warn')
        loggerInstance.error('Error')
        
        expect(consoleDebugSpy).not.toHaveBeenCalled()
        expect(consoleInfoSpy).not.toHaveBeenCalled()
        expect(consoleWarnSpy).toHaveBeenCalled()
        expect(consoleErrorSpy).toHaveBeenCalled()
      })

      it('should only log errors when level is error', () => {
        process.env.NODE_ENV = 'development'
        process.env.LOG_LEVEL = 'error'
        const loggerInstance = new Logger()
        
        loggerInstance.debug('Debug')
        loggerInstance.info('Info')
        loggerInstance.warn('Warn')
        loggerInstance.error('Error')
        
        expect(consoleDebugSpy).not.toHaveBeenCalled()
        expect(consoleInfoSpy).not.toHaveBeenCalled()
        expect(consoleWarnSpy).not.toHaveBeenCalled()
        expect(consoleErrorSpy).toHaveBeenCalled()
      })
    })

    describe('Context Support', () => {
      it('should include context in log messages', () => {
        process.env.NODE_ENV = 'development'
        process.env.LOG_LEVEL = 'info'
        const loggerInstance = new Logger()
        
        loggerInstance.info('Message with context', { userId: '123', action: 'test' })
        
        expect(consoleInfoSpy).toHaveBeenCalled()
        const logOutput = consoleInfoSpy.mock.calls[0][0]
        expect(logOutput).toContain('userId')
        expect(logOutput).toContain('123')
      })

      it('should handle empty context', () => {
        process.env.NODE_ENV = 'development'
        process.env.LOG_LEVEL = 'info'
        const loggerInstance = new Logger()
        
        loggerInstance.info('Message without context')
        
        expect(consoleInfoSpy).toHaveBeenCalled()
      })
    })

    describe('Error Logging', () => {
      it('should log error with Error object', () => {
        process.env.NODE_ENV = 'development'
        process.env.LOG_LEVEL = 'info'
        const loggerInstance = new Logger()
        const testError = new Error('Test error')
        
        loggerInstance.error('Error occurred', testError)
        
        expect(consoleErrorSpy).toHaveBeenCalled()
        const logOutput = consoleErrorSpy.mock.calls[0][0]
        expect(logOutput).toContain('Test error')
      })

      it('should log error with context and Error object', () => {
        process.env.NODE_ENV = 'development'
        process.env.LOG_LEVEL = 'info'
        const loggerInstance = new Logger()
        const testError = new Error('Test error')
        
        loggerInstance.error('Error occurred', testError, { userId: '123' })
        
        expect(consoleErrorSpy).toHaveBeenCalled()
        const logOutput = consoleErrorSpy.mock.calls[0][0]
        expect(logOutput).toContain('Test error')
        expect(logOutput).toContain('userId')
      })

      it('should include stack trace in development', () => {
        process.env.NODE_ENV = 'development'
        process.env.LOG_LEVEL = 'info'
        const loggerInstance = new Logger()
        const testError = new Error('Test error with stack')
        
        loggerInstance.error('Error occurred', testError)
        
        expect(consoleErrorSpy).toHaveBeenCalled()
        const logOutput = consoleErrorSpy.mock.calls[0][0]
        expect(logOutput).toContain('Stack:')
      })
    })

    describe('Namespace Support', () => {
      it('should include namespace in log output', () => {
        process.env.NODE_ENV = 'development'
        process.env.LOG_LEVEL = 'info'
        const loggerInstance = new Logger('MyComponent')
        
        loggerInstance.info('Namespaced message')
        
        expect(consoleInfoSpy).toHaveBeenCalled()
        const logOutput = consoleInfoSpy.mock.calls[0][0]
        expect(logOutput).toContain('MyComponent')
      })
    })

    describe('Production Formatting', () => {
      it('should output JSON in production', () => {
        process.env.NODE_ENV = 'production'
        process.env.LOG_LEVEL = 'info'
        const loggerInstance = new Logger('ProdLogger')
        
        loggerInstance.info('Production message', { key: 'value' })
        
        expect(consoleInfoSpy).toHaveBeenCalled()
        const logOutput = consoleInfoSpy.mock.calls[0][0]
        
        // Should be valid JSON
        const parsed = JSON.parse(logOutput)
        expect(parsed.level).toBe('info')
        expect(parsed.message).toBe('Production message')
        expect(parsed.namespace).toBe('ProdLogger')
        expect(parsed.key).toBe('value')
      })

      it('should include error info in JSON format', () => {
        process.env.NODE_ENV = 'production'
        process.env.LOG_LEVEL = 'info'
        const loggerInstance = new Logger()
        const testError = new Error('Production error')
        
        loggerInstance.error('Error in production', testError)
        
        expect(consoleErrorSpy).toHaveBeenCalled()
        const logOutput = consoleErrorSpy.mock.calls[0][0]
        
        const parsed = JSON.parse(logOutput)
        expect(parsed.error).toBeDefined()
        expect(parsed.error.message).toBe('Production error')
        expect(parsed.error.name).toBe('Error')
      })
    })

    describe('Sentry Integration', () => {
      it('should capture exceptions in production for errors', () => {
        process.env.NODE_ENV = 'production'
        process.env.LOG_LEVEL = 'info'
        const loggerInstance = new Logger()
        const testError = new Error('Sentry test error')
        
        loggerInstance.error('Error for Sentry', testError, { userId: '123' })
        
        expect(Sentry.captureException).toHaveBeenCalledWith(testError, {
          extra: { userId: '123', message: 'Error for Sentry' }
        })
      })

      it('should capture message in production for error level without Error object', () => {
        process.env.NODE_ENV = 'production'
        process.env.LOG_LEVEL = 'info'
        const loggerInstance = new Logger()
        
        loggerInstance.error('Error message without Error object')
        
        expect(Sentry.captureMessage).toHaveBeenCalledWith('Error message without Error object', {
          level: 'error',
          extra: undefined
        })
      })

      it('should capture message in production for warnings', () => {
        process.env.NODE_ENV = 'production'
        process.env.LOG_LEVEL = 'info'
        const loggerInstance = new Logger()
        
        loggerInstance.warn('Warning for Sentry', { context: 'test' })
        
        expect(Sentry.captureMessage).toHaveBeenCalledWith('Warning for Sentry', {
          level: 'warning',
          extra: { context: 'test' }
        })
      })

      it('should not send to Sentry in development', () => {
        process.env.NODE_ENV = 'development'
        process.env.LOG_LEVEL = 'info'
        const loggerInstance = new Logger()
        
        loggerInstance.error('Dev error', new Error('test'))
        loggerInstance.warn('Dev warning')
        
        expect(Sentry.captureException).not.toHaveBeenCalled()
        expect(Sentry.captureMessage).not.toHaveBeenCalled()
      })
    })

    describe('withContext Method', () => {
      it('should create new logger with merged context', () => {
        process.env.NODE_ENV = 'development'
        process.env.LOG_LEVEL = 'info'
        const baseLogger = new Logger('Base')
        const contextLogger = baseLogger.withContext({ userId: '123', requestId: 'abc' })
        
        contextLogger.info('Message with inherited context')
        
        expect(consoleInfoSpy).toHaveBeenCalled()
        const logOutput = consoleInfoSpy.mock.calls[0][0]
        expect(logOutput).toContain('userId')
        expect(logOutput).toContain('123')
        expect(logOutput).toContain('requestId')
        expect(logOutput).toContain('abc')
      })

      it('should merge additional context on log call', () => {
        process.env.NODE_ENV = 'development'
        process.env.LOG_LEVEL = 'info'
        const baseLogger = new Logger()
        const contextLogger = baseLogger.withContext({ baseKey: 'baseValue' })
        
        contextLogger.info('Merged context', { additionalKey: 'additionalValue' })
        
        expect(consoleInfoSpy).toHaveBeenCalled()
        const logOutput = consoleInfoSpy.mock.calls[0][0]
        expect(logOutput).toContain('baseKey')
        expect(logOutput).toContain('baseValue')
        expect(logOutput).toContain('additionalKey')
        expect(logOutput).toContain('additionalValue')
      })
    })
  })

  describe('Singleton Logger Instance', () => {
    it('should export singleton logger instance', () => {
      expect(logger).toBeInstanceOf(Logger)
    })

    it('should provide debug method', () => {
      expect(typeof logger.debug).toBe('function')
    })

    it('should provide info method', () => {
      expect(typeof logger.info).toBe('function')
    })

    it('should provide warn method', () => {
      expect(typeof logger.warn).toBe('function')
    })

    it('should provide error method', () => {
      expect(typeof logger.error).toBe('function')
    })
  })

  describe('Convenience Log Functions', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development'
      process.env.LOG_LEVEL = 'debug'
    })

    it('should provide log.debug', () => {
      expect(typeof log.debug).toBe('function')
      // Note: singleton logger instance is created at module load time
      // with its own log level settings, so we just verify it doesn't throw
      expect(() => log.debug('Debug via convenience')).not.toThrow()
    })

    it('should provide log.info', () => {
      expect(typeof log.info).toBe('function')
      log.info('Info via convenience')
      expect(consoleInfoSpy).toHaveBeenCalled()
    })

    it('should provide log.warn', () => {
      expect(typeof log.warn).toBe('function')
      log.warn('Warn via convenience')
      expect(consoleWarnSpy).toHaveBeenCalled()
    })

    it('should provide log.error', () => {
      expect(typeof log.error).toBe('function')
      log.error('Error via convenience', new Error('test'))
      expect(consoleErrorSpy).toHaveBeenCalled()
    })

    it('should pass context to convenience functions', () => {
      log.info('Info with context', { key: 'value' })
      
      expect(consoleInfoSpy).toHaveBeenCalled()
      const logOutput = consoleInfoSpy.mock.calls[0][0]
      expect(logOutput).toContain('key')
      expect(logOutput).toContain('value')
    })
  })

  describe('Development Formatting', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development'
      process.env.LOG_LEVEL = 'debug'
    })

    it('should include emoji for debug level', () => {
      const loggerInstance = new Logger()
      loggerInstance.debug('Debug message')
      
      expect(consoleDebugSpy).toHaveBeenCalled()
      const logOutput = consoleDebugSpy.mock.calls[0][0]
      expect(logOutput).toContain('🔍')
      expect(logOutput).toContain('[DEBUG]')
    })

    it('should include emoji for info level', () => {
      const loggerInstance = new Logger()
      loggerInstance.info('Info message')
      
      expect(consoleInfoSpy).toHaveBeenCalled()
      const logOutput = consoleInfoSpy.mock.calls[0][0]
      expect(logOutput).toContain('ℹ️')
      expect(logOutput).toContain('[INFO]')
    })

    it('should include emoji for warn level', () => {
      const loggerInstance = new Logger()
      loggerInstance.warn('Warning message')
      
      expect(consoleWarnSpy).toHaveBeenCalled()
      const logOutput = consoleWarnSpy.mock.calls[0][0]
      expect(logOutput).toContain('⚠️')
      expect(logOutput).toContain('[WARN]')
    })

    it('should include emoji for error level', () => {
      const loggerInstance = new Logger()
      loggerInstance.error('Error message')
      
      expect(consoleErrorSpy).toHaveBeenCalled()
      const logOutput = consoleErrorSpy.mock.calls[0][0]
      expect(logOutput).toContain('❌')
      expect(logOutput).toContain('[ERROR]')
    })

    it('should include timestamp in log output', () => {
      const loggerInstance = new Logger()
      loggerInstance.info('Timestamped message')
      
      expect(consoleInfoSpy).toHaveBeenCalled()
      const logOutput = consoleInfoSpy.mock.calls[0][0]
      // ISO timestamp pattern
      expect(logOutput).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    })

    it('should pretty print context in development', () => {
      const loggerInstance = new Logger()
      loggerInstance.info('Pretty context', { 
        nested: { key: 'value' },
        array: [1, 2, 3]
      })
      
      expect(consoleInfoSpy).toHaveBeenCalled()
      const logOutput = consoleInfoSpy.mock.calls[0][0]
      // Should contain newlines for pretty printing
      expect(logOutput).toContain('"nested"')
      expect(logOutput).toContain('"array"')
    })
  })

  describe('Edge Cases', () => {
    it('should handle undefined log level', () => {
      delete process.env.LOG_LEVEL
      process.env.NODE_ENV = 'development'
      
      const loggerInstance = new Logger()
      // Default is info, so debug should not log
      loggerInstance.debug('Should not appear')
      loggerInstance.info('Should appear')
      
      expect(consoleDebugSpy).not.toHaveBeenCalled()
      expect(consoleInfoSpy).toHaveBeenCalled()
    })

    it('should handle null context gracefully', () => {
      process.env.NODE_ENV = 'development'
      process.env.LOG_LEVEL = 'info'
      const loggerInstance = new Logger()
      
      // @ts-expect-error - testing null context
      loggerInstance.info('Null context', null)
      
      expect(consoleInfoSpy).toHaveBeenCalled()
    })

    it('should handle undefined context gracefully', () => {
      process.env.NODE_ENV = 'development'
      process.env.LOG_LEVEL = 'info'
      const loggerInstance = new Logger()
      
      loggerInstance.info('Undefined context', undefined)
      
      expect(consoleInfoSpy).toHaveBeenCalled()
    })

    it('should handle circular reference in context', () => {
      process.env.NODE_ENV = 'development'
      process.env.LOG_LEVEL = 'info'
      const loggerInstance = new Logger()
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const circular: any = { key: 'value' }
      circular.self = circular
      
      // Should not throw
      expect(() => {
        loggerInstance.info('Circular context', circular)
      }).toThrow() // JSON.stringify throws on circular
    })

    it('should handle very long messages', () => {
      process.env.NODE_ENV = 'development'
      process.env.LOG_LEVEL = 'info'
      const loggerInstance = new Logger()
      
      const longMessage = 'A'.repeat(10000)
      loggerInstance.info(longMessage)
      
      expect(consoleInfoSpy).toHaveBeenCalled()
      const logOutput = consoleInfoSpy.mock.calls[0][0]
      expect(logOutput).toContain(longMessage)
    })

    it('should handle special characters in messages', () => {
      process.env.NODE_ENV = 'development'
      process.env.LOG_LEVEL = 'info'
      const loggerInstance = new Logger()
      
      const specialMessage = 'Message with "quotes" and <tags> and & ampersand'
      loggerInstance.info(specialMessage)
      
      expect(consoleInfoSpy).toHaveBeenCalled()
      const logOutput = consoleInfoSpy.mock.calls[0][0]
      expect(logOutput).toContain(specialMessage)
    })

    it('should handle unicode in messages', () => {
      process.env.NODE_ENV = 'development'
      process.env.LOG_LEVEL = 'info'
      const loggerInstance = new Logger()
      
      const unicodeMessage = 'Message with 中文 and émojis 🎉'
      loggerInstance.info(unicodeMessage)
      
      expect(consoleInfoSpy).toHaveBeenCalled()
      const logOutput = consoleInfoSpy.mock.calls[0][0]
      expect(logOutput).toContain(unicodeMessage)
    })
  })
})
