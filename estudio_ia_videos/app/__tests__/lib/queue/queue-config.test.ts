/**
 * Tests for app/lib/queue/config.ts
 * Queue configuration with Redis URL and fallback handling
 */

// Store original env before any imports
const originalEnv = { ...process.env }

describe('Queue Config Module', () => {
  beforeEach(() => {
    // Reset env and module cache before each test
    process.env = { ...originalEnv }
    jest.resetModules()
  })

  afterAll(() => {
    process.env = originalEnv
  })

  describe('getQueueConfig', () => {
    it('should return config with REDIS_URL when set', async () => {
      process.env.REDIS_URL = 'redis://localhost:6379'
      process.env.RENDER_QUEUE_NAME = 'test-queue'
      
      const { getQueueConfig } = await import('../../../lib/queue/config')
      const config = getQueueConfig()
      
      expect(config.redisUrl).toBe('redis://localhost:6379')
      expect(config.queueName).toBe('test-queue')
    })

    it('should use default queue name when RENDER_QUEUE_NAME not set', async () => {
      process.env.REDIS_URL = 'redis://localhost:6379'
      delete process.env.RENDER_QUEUE_NAME
      
      const { getQueueConfig } = await import('../../../lib/queue/config')
      const config = getQueueConfig()
      
      expect(config.queueName).toBe('render-jobs')
    })

    it('should return mock URL when REDIS_URL not set', async () => {
      delete process.env.REDIS_URL
      
      const { getQueueConfig } = await import('../../../lib/queue/config')
      const config = getQueueConfig()
      
      expect(config.redisUrl).toBe('redis://mock:6379')
    })

    it('should cache configuration on subsequent calls', async () => {
      process.env.REDIS_URL = 'redis://localhost:6379'
      process.env.RENDER_QUEUE_NAME = 'cached-queue'
      
      const { getQueueConfig } = await import('../../../lib/queue/config')
      
      const config1 = getQueueConfig()
      
      // Change env (should not affect cached config)
      process.env.REDIS_URL = 'redis://different:6379'
      process.env.RENDER_QUEUE_NAME = 'different-queue'
      
      const config2 = getQueueConfig()
      
      expect(config1).toBe(config2) // Same reference (cached)
      expect(config2.redisUrl).toBe('redis://localhost:6379')
      expect(config2.queueName).toBe('cached-queue')
    })

    it('should handle complex Redis URLs', async () => {
      process.env.REDIS_URL = 'rediss://user:password@redis-host.example.com:6380/0'
      
      const { getQueueConfig } = await import('../../../lib/queue/config')
      const config = getQueueConfig()
      
      expect(config.redisUrl).toBe('rediss://user:password@redis-host.example.com:6380/0')
    })

    it('should handle empty RENDER_QUEUE_NAME as valid value', async () => {
      process.env.REDIS_URL = 'redis://localhost:6379'
      process.env.RENDER_QUEUE_NAME = ''
      
      const { getQueueConfig } = await import('../../../lib/queue/config')
      const config = getQueueConfig()
      
      // ?? operator only checks null/undefined, empty string is valid
      expect(config.queueName).toBe('')
    })
  })
})
