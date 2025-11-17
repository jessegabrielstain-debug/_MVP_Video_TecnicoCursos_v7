/**
 * Services Index - Exportação centralizada de todos os serviços
 * 
 * Facilita importação dos serviços em outros módulos:
 * import { logger, redisClient, queueClient } from '@/lib/services';
 * 
 * @module lib/services
 */

export { redisClient } from './redis-client';
export type { CacheOptions } from './redis-client';

export { queueClient } from './queue-client';
export type { JobData, QueueMetrics, QueueConfig } from './queue-client';

export { logger } from './logger';
export type { LogLevel, LogContext, LogEntry } from './logger';

export { createClient } from './supabase-client';
export { createServerClient } from './supabase-server';
