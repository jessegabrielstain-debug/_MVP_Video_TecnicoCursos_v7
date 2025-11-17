import { logger as scriptsLogger } from '../../scripts/logger';

export type { LogLevel, LogEntry, LogAnalysis } from '../../scripts/logger';

/**
 * Logger centralizado do app.
 * Reexporta o singleton definido em scripts/logger.ts para uso dentro de lib/app.
 */
export const logger = scriptsLogger;
