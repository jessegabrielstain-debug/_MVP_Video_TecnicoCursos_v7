import { logger } from '@/lib/logger';

export const errorLogger = {
  log: (error: Error | unknown, context?: Record<string, unknown>) => {
    logger.error('Error logged', error as Error, { ...context, component: 'errorLogger' });
  },
  logError: (context: Record<string, unknown>) => {
    logger.error('Error logged', new Error('Unknown error'), { ...context, component: 'errorLogger' });
  },
  warn: (message: string, context?: Record<string, unknown>) => {
    logger.warn(message, { ...context, component: 'errorLogger' });
  },
  info: (message: string, context?: Record<string, unknown>) => {
    logger.info(message, { ...context, component: 'errorLogger' });
  },
  logInfo: (message: string, context?: Record<string, unknown>) => {
    logger.info(message, { ...context, component: 'errorLogger' });
  }
};
