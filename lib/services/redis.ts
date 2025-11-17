// Interface mínima usada pelos módulos atuais
export type MinimalRedis = {
  ping: () => Promise<string>;
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string, mode?: 'EX' | 'PX', ttl?: number) => Promise<'OK' | null>;
  del: (key: string | string[]) => Promise<number>;
  publish: (channel: string, message: string) => Promise<number>;
  sadd: (key: string, member: string) => Promise<number>;
  scard: (key: string) => Promise<number>;
  srem: (key: string, member: string) => Promise<number>;
  smembers: (key: string) => Promise<string[]>;
  spop: (key: string) => Promise<string | null>;
  keys: (pattern: string) => Promise<string[]>;
  quit: () => Promise<'OK' | void>;
};

class MemoryRedis implements MinimalRedis {
  private store = new Map<string, string>();
  private sets = new Map<string, Set<string>>();

  async ping() { return 'PONG'; }
  async get(key: string) { return this.store.get(key) ?? null; }
  async set(key: string, value: string): Promise<'OK' | null> { this.store.set(key, value); return 'OK'; }
  async del(key: string | string[]) {
    const keys = Array.isArray(key) ? key : [key];
    let count = 0; keys.forEach(k => { if (this.store.delete(k)) count++; });
    return count;
  }
  async publish() { return 0; }
  async sadd(key: string, member: string) {
    const s = this.sets.get(key) ?? new Set<string>();
    const sizeBefore = s.size; s.add(member); this.sets.set(key, s); return s.size > sizeBefore ? 1 : 0;
  }
  async scard(key: string) { return (this.sets.get(key)?.size ?? 0); }
  async srem(key: string, member: string) { const s = this.sets.get(key); if (!s) return 0; const had = s.delete(member); return had ? 1 : 0; }
  async smembers(key: string) { return Array.from(this.sets.get(key) ?? []); }
  async spop(key: string) { const s = this.sets.get(key); if (!s || s.size === 0) return null; const v = s.values().next().value as string; s.delete(v); return v; }
  async keys(pattern: string) {
    if (!pattern.endsWith('*')) return Array.from(this.store.keys()).filter(k => k === pattern);
    const p = pattern.slice(0, -1); return Array.from(this.store.keys()).filter(k => k.startsWith(p));
  }
  async quit(): Promise<'OK' | void> { /* noop */ return 'OK'; }
}

export type RedisClient = MinimalRedis | unknown;

export function getRedisUrl(): string {
  return (
    process.env.REDIS_URL ||
    (process.env.REDIS_HOST && process.env.REDIS_PORT ? `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}` : '') ||
    'redis://localhost:6379'
  );
}

/**
 * Cria um cliente Redis. Se `ioredis` não estiver instalado/disponível,
 * retorna um fallback em memória compatível com os métodos mínimos utilizados.
 */
export function createRedisClient(url = getRedisUrl()): RedisClient {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const IORedis = require('ioredis');
    return new IORedis(url);
  } catch {
    return new MemoryRedis();
  }
}
