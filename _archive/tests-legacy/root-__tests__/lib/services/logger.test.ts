/**
 * Testes unitários do Logger centralizado
 */

import { Logger } from '@/lib/services/logger';
import * as fs from 'fs';
import * as path from 'path';

describe('Logger', () => {
  let logger: Logger;
  const testLogDir = path.join(process.cwd(), 'logs', 'test');

  beforeEach(() => {
    logger = new Logger({
      serviceName: 'TestService',
      logLevel: 'debug',
      enableFileLogging: false, // Desabilitar para testes
    });
  });

  describe('Log Levels', () => {
    it('deve registrar mensagens de debug', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      logger.debug('Debug message', { component: 'Test' });
      
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('deve registrar mensagens de info', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      logger.info('Info message', { component: 'Test' });
      
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('deve registrar mensagens de warn', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      logger.warn('Warning message', { component: 'Test' });
      
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('deve registrar mensagens de error', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      logger.error('Error message', { component: 'Test' });
      
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('Contextual Logger', () => {
    it('deve criar logger contextual com contexto base', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      const contextLogger = logger.withContext({ 
        userId: 'user-123', 
        requestId: 'req-456' 
      });
      
      contextLogger.info('Contextual message');
      
      const calls = consoleSpy.mock.calls;
      expect(calls.length).toBeGreaterThan(0);
      
      // Verificar se contexto está presente (segunda chamada contém contexto)
      const contextArg = calls[0][1];
      expect(contextArg).toBeDefined();
      
      consoleSpy.mockRestore();
    });

    it('deve mesclar contextos em loggers aninhados', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      const baseLogger = logger.withContext({ service: 'API' });
      const nestedLogger = baseLogger.withContext({ endpoint: '/users' });
      
      nestedLogger.info('Nested context message');
      
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('Timer', () => {
    it('deve medir tempo decorrido', async () => {
      const timer = logger.timer();
      
      // Simular operação com 100ms
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const elapsed = timer();
      
      expect(elapsed).toBeGreaterThanOrEqual(100);
      expect(elapsed).toBeLessThan(200); // Margem de erro
    });
  });

  describe('Error Logging', () => {
    it('deve registrar erro com stack trace', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      const error = new Error('Test error');
      logger.error('Operation failed', { component: 'Test' }, error);
      
      const calls = consoleSpy.mock.calls;
      expect(calls.length).toBeGreaterThan(0);
      
      // Verificar se erro está presente
      const errorArg = calls[0][2];
      expect(errorArg).toContain('Error:');
      
      consoleSpy.mockRestore();
    });

    it('deve aceitar erro como segundo parâmetro', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      const error = new Error('Test error');
      logger.error('Operation failed', error);
      
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('Structured Context', () => {
    it('deve incluir contexto estruturado nos logs', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      logger.info('User action', {
        userId: 'user-123',
        action: 'login',
        timestamp: Date.now(),
        metadata: {
          ip: '192.168.1.1',
          userAgent: 'Test Browser'
        }
      });
      
      const calls = consoleSpy.mock.calls;
      expect(calls.length).toBeGreaterThan(0);
      
      const contextArg = calls[0][1];
      expect(contextArg).toBeDefined();
      expect(typeof contextArg).toBe('object');
      
      consoleSpy.mockRestore();
    });
  });

  describe('Log Level Filtering', () => {
    it('não deve registrar debug quando level é info', () => {
      const infoLogger = new Logger({
        serviceName: 'TestService',
        logLevel: 'info',
        enableFileLogging: false,
      });
      
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      infoLogger.debug('This should not appear');
      
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('deve registrar info quando level é info', () => {
      const infoLogger = new Logger({
        serviceName: 'TestService',
        logLevel: 'info',
        enableFileLogging: false,
      });
      
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      infoLogger.info('This should appear');
      
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});
