/**
 * Tests for app/lib/rate-limit.ts
 * Rate limiter with LRU cache for tracking request frequencies
 */

import { RateLimiter, globalRateLimiter } from '../../lib/rate-limit'

describe('Rate Limit Module', () => {
  describe('RateLimiter Class', () => {
    describe('Constructor', () => {
      it('should create rate limiter with default options', () => {
        const limiter = new RateLimiter()
        expect(limiter).toBeInstanceOf(RateLimiter)
      })

      it('should create rate limiter with custom options', () => {
        const limiter = new RateLimiter({
          uniqueTokenPerInterval: 100,
          interval: 30000,
        })
        expect(limiter).toBeInstanceOf(RateLimiter)
      })

      it('should accept partial options', () => {
        const limiter = new RateLimiter({
          interval: 5000,
        })
        expect(limiter).toBeInstanceOf(RateLimiter)
      })
    })

    describe('check method', () => {
      it('should allow first request', async () => {
        const limiter = new RateLimiter({ interval: 1000 })
        
        const isLimited = await limiter.check(5, 'token-1')
        
        expect(isLimited).toBe(false)
      })

      it('should allow requests under limit', async () => {
        const limiter = new RateLimiter({ interval: 1000 })
        const token = 'under-limit-token'
        
        // Make 3 requests with limit of 5
        await limiter.check(5, token)
        await limiter.check(5, token)
        const isLimited = await limiter.check(5, token)
        
        expect(isLimited).toBe(false)
      })

      it('should block requests at limit', async () => {
        const limiter = new RateLimiter({ interval: 60000 })
        const token = 'at-limit-token'
        
        // Make 5 requests with limit of 5
        await limiter.check(5, token)
        await limiter.check(5, token)
        await limiter.check(5, token)
        await limiter.check(5, token)
        await limiter.check(5, token)
        
        // 6th request should be blocked
        const isLimited = await limiter.check(5, token)
        
        expect(isLimited).toBe(true)
      })

      it('should track different tokens separately', async () => {
        const limiter = new RateLimiter({ interval: 60000 })
        
        // Fill up token-a
        await limiter.check(2, 'token-a')
        await limiter.check(2, 'token-a')
        const tokenALimited = await limiter.check(2, 'token-a')
        
        // token-b should still be allowed
        const tokenBLimited = await limiter.check(2, 'token-b')
        
        expect(tokenALimited).toBe(true)
        expect(tokenBLimited).toBe(false)
      })

      it('should return Promise', () => {
        const limiter = new RateLimiter()
        
        const result = limiter.check(5, 'promise-test')
        
        expect(result).toBeInstanceOf(Promise)
      })

      it('should handle single request limit', async () => {
        const limiter = new RateLimiter({ interval: 60000 })
        const token = 'single-limit'
        
        const first = await limiter.check(1, token)
        const second = await limiter.check(1, token)
        
        expect(first).toBe(false)
        expect(second).toBe(true)
      })

      it('should handle high limits', async () => {
        const limiter = new RateLimiter({ interval: 60000 })
        const token = 'high-limit'
        
        // Make many requests under high limit
        for (let i = 0; i < 50; i++) {
          await limiter.check(100, token)
        }
        
        const isLimited = await limiter.check(100, token)
        
        expect(isLimited).toBe(false)
      })

      it('should reset after interval expires', async () => {
        // Use very short interval for testing
        const limiter = new RateLimiter({ interval: 50 })
        const token = 'expiring-token'
        
        // Fill up the limit
        await limiter.check(2, token)
        await limiter.check(2, token)
        const beforeWait = await limiter.check(2, token)
        
        expect(beforeWait).toBe(true)
        
        // Wait for interval to expire
        await new Promise(resolve => setTimeout(resolve, 100))
        
        // Should be allowed again
        const afterWait = await limiter.check(2, token)
        
        expect(afterWait).toBe(false)
      })

      it('should handle empty token', async () => {
        const limiter = new RateLimiter()
        
        const isLimited = await limiter.check(5, '')
        
        expect(isLimited).toBe(false)
      })

      it('should handle special characters in token', async () => {
        const limiter = new RateLimiter()
        
        const specialTokens = [
          'user:123',
          'ip:192.168.1.1',
          'token/with/slashes',
          'token@with@at',
          'token with spaces',
        ]
        
        for (const token of specialTokens) {
          const isLimited = await limiter.check(5, token)
          expect(isLimited).toBe(false)
        }
      })
    })

    describe('Sliding Window Behavior', () => {
      it('should use sliding window for rate limiting', async () => {
        const limiter = new RateLimiter({ interval: 100 })
        const token = 'sliding-window-' + Date.now()
        
        // First burst - make 3 requests (max limit)
        await limiter.check(3, token)
        await limiter.check(3, token)
        const thirdResult = await limiter.check(3, token)
        expect(thirdResult).toBe(false) // Third should still work (limit is 3)
        
        // Fourth request should be limited (exceeded 3)
        const fourthResult = await limiter.check(3, token)
        expect(fourthResult).toBe(true)
        
        // Wait for interval to expire
        await new Promise(resolve => setTimeout(resolve, 120))
        
        // Now should be allowed again
        const afterExpire = await limiter.check(3, token)
        expect(afterExpire).toBe(false)
      })
    })
  })

  describe('globalRateLimiter Singleton', () => {
    it('should be a RateLimiter instance', () => {
      expect(globalRateLimiter).toBeInstanceOf(RateLimiter)
    })

    it('should be usable for rate limiting', async () => {
      // Use unique token to avoid test interference
      const uniqueToken = `global-test-${Date.now()}`
      
      const isLimited = await globalRateLimiter.check(100, uniqueToken)
      
      expect(isLimited).toBe(false)
    })

    it('should be the same instance across imports', async () => {
      // This tests that it's a singleton
      const { globalRateLimiter: limiter2 } = await import('../../lib/rate-limit')
      
      expect(globalRateLimiter).toBe(limiter2)
    })
  })

  describe('Performance', () => {
    it('should handle rapid requests efficiently', async () => {
      const limiter = new RateLimiter({ interval: 60000, uniqueTokenPerInterval: 100 })
      const token = 'performance-test'
      
      const start = Date.now()
      
      // Make 50 rapid requests
      const promises = Array(50).fill(null).map(() => limiter.check(100, token))
      await Promise.all(promises)
      
      const duration = Date.now() - start
      
      // Should complete quickly (< 100ms)
      expect(duration).toBeLessThan(100)
    })

    it('should handle many different tokens', async () => {
      const limiter = new RateLimiter({ interval: 60000, uniqueTokenPerInterval: 1000 })
      
      const start = Date.now()
      
      // Make requests for 100 different tokens
      const promises = Array(100).fill(null).map((_, i) => 
        limiter.check(5, `token-${i}`)
      )
      await Promise.all(promises)
      
      const duration = Date.now() - start
      
      // Should complete quickly (< 100ms)
      expect(duration).toBeLessThan(100)
    })
  })
})
