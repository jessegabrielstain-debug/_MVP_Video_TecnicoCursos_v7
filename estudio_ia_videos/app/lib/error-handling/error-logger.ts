export const errorLogger = {
  log: (error: Error | unknown, context?: Record<string, unknown>) => {
    console.error('Error logged:', error, context);
  },
  logError: (context: Record<string, unknown>) => {
    console.error('Error logged:', context);
  },
  warn: (message: string, context?: Record<string, unknown>) => {
    console.warn('Warning logged:', message, context);
  },
  info: (message: string, context?: Record<string, unknown>) => {
    console.info('Info logged:', message, context);
  },
  logInfo: (message: string, context?: Record<string, unknown>) => {
    console.info('Info logged:', message, context);
  }
};
