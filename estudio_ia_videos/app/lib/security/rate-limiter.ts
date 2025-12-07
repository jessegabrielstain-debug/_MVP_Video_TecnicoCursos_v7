import { rateLimiter } from '@/lib/rate-limiter-real';

export async function applyRateLimit(identifier: string) {
  const result = await rateLimiter.check(identifier);
  
  return {
    success: result.allowed,
    headers: {
      'X-RateLimit-Limit': '100',
      'X-RateLimit-Remaining': result.remaining.toString(),
      'X-RateLimit-Reset': result.resetAt.toISOString(),
    }
  };
}
