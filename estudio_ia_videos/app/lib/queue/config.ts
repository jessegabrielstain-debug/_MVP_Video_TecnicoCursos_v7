type QueueConfig = {
  redisUrl: string
  queueName: string
}

import { logger } from '@/lib/logger';

let cachedConfig: QueueConfig | null = null

export function getQueueConfig(): QueueConfig {
  if (cachedConfig) {
    return cachedConfig
  }

  const redisUrl = process.env.REDIS_URL
  const queueName = process.env.RENDER_QUEUE_NAME ?? 'render-jobs'

  if (!redisUrl) {
    logger.warn('⚠️ REDIS_URL not found. Queue will operate in mock/fallback mode.', { component: 'QueueConfig' })
    // Return a dummy URL to prevent URL constructor failure, but we'll handle it in render-queue.ts
    cachedConfig = { redisUrl: 'redis://mock:6379', queueName }
    return cachedConfig
  }

  cachedConfig = { redisUrl, queueName }
  return cachedConfig
}
