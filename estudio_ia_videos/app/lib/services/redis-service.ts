/**
 * Redis Service
 * Serviço centralizado para conexões Redis
 * Conforme padrão estabelecido em supabase-client.ts
 */

import Redis from 'ioredis';

let redisClient: Redis | null = null;

/**
 * Obtém instância singleton do Redis client
 */
export function getRedisClient(): Redis {
  if (!redisClient) {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      lazyConnect: true,
    });

    redisClient.on('error', (err) => {
      console.error('[Redis] Connection error:', err);
    });

    redisClient.on('connect', () => {
      console.log('[Redis] Connected successfully');
    });
  }

  return redisClient;
}

/**
 * Cria uma nova instância Redis para pub/sub
 * (não deve compartilhar a mesma conexão de comandos)
 */
export function createRedisPubSub(): Redis {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  return new Redis(redisUrl);
}

/**
 * Fecha todas as conexões Redis
 */
export async function closeRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}

/**
 * Verifica se o Redis está conectado
 */
export async function isRedisConnected(): Promise<boolean> {
  try {
    const client = getRedisClient();
    await client.ping();
    return true;
  } catch {
    return false;
  }
}
