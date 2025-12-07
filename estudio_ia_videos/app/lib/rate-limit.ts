import { LRUCache } from 'lru-cache';

type RateLimitOptions = {
  uniqueTokenPerInterval?: number;
  interval?: number;
};

export class RateLimiter {
  private tokenCache: LRUCache<string, number[]>;
  private interval: number;

  constructor(options?: RateLimitOptions) {
    this.interval = options?.interval || 60000; // Default 1 minute
    this.tokenCache = new LRUCache({
      max: options?.uniqueTokenPerInterval || 500,
      ttl: this.interval,
    });
  }

  check(limit: number, token: string): Promise<boolean> {
    return new Promise((resolve) => {
      const now = Date.now();
      const tokenCount = this.tokenCache.get(token) || [0];
      
      // Filter out timestamps that are outside the current interval
      const validTimestamps = tokenCount.filter((timestamp) => now - timestamp < this.interval);
      
      const isRateLimited = validTimestamps.length >= limit;
      
      if (!isRateLimited) {
        validTimestamps.push(now);
        this.tokenCache.set(token, validTimestamps);
      }

      resolve(isRateLimited);
    });
  }
}

// Singleton instance for global rate limiting
// Limit: 10 requests per minute per IP by default for critical actions
export const globalRateLimiter = new RateLimiter({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 1000, // Max 1000 unique IPs tracked
});
