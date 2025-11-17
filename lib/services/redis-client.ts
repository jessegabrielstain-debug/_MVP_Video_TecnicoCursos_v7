/**
 * Redis Client - Serviço centralizado para conexão Redis/Upstash
 * 
 * Responsabilidades:
 * - Gerenciar conexão única com Redis/Upstash
 * - Fornecer métodos helper para operações comuns
 * - Garantir fallback gracioso em caso de falha
 * - Logging estruturado de todas as operações
 * 
 * @module lib/services/redis-client
 */

import { Redis } from '@upstash/redis';

interface RedisConfig {
  url: string;
  token: string;
}

interface CacheOptions {
  ttl?: number; // TTL em segundos
  namespace?: string; // Namespace para organizar keys
}

class RedisClientService {
  private client: Redis | null = null;
  private isConnected: boolean = false;
  private connectionAttempts: number = 0;
  private readonly maxRetries: number = 3;

  constructor() {
    this.initialize();
  }

  /**
   * Inicializa a conexão com Redis
   */
  private initialize(): void {
    try {
      const url = process.env.UPSTASH_REDIS_REST_URL;
      const token = process.env.UPSTASH_REDIS_REST_TOKEN;

      if (!url || !token) {
        console.warn('[RedisClient] Variáveis de ambiente ausentes. Redis desabilitado.');
        this.isConnected = false;
        return;
      }

      this.client = new Redis({
        url,
        token,
      });

      this.isConnected = true;
      console.log('[RedisClient] Conexão estabelecida com sucesso');
    } catch (error) {
      console.error('[RedisClient] Erro ao inicializar:', error);
      this.isConnected = false;
    }
  }

  /**
   * Verifica se o Redis está disponível
   */
  public isAvailable(): boolean {
    return this.isConnected && this.client !== null;
  }

  /**
   * Obtém valor do cache
   */
  public async get<T = unknown>(key: string, namespace?: string): Promise<T | null> {
    if (!this.isAvailable()) {
      return null;
    }

    try {
      const fullKey = namespace ? `${namespace}:${key}` : key;
      const value = await this.client!.get<T>(fullKey);
      
      if (value) {
        console.log(`[RedisClient] Cache HIT: ${fullKey}`);
      } else {
        console.log(`[RedisClient] Cache MISS: ${fullKey}`);
      }

      return value;
    } catch (error) {
      console.error('[RedisClient] Erro ao ler cache:', error);
      return null;
    }
  }

  /**
   * Define valor no cache
   */
  public async set<T = unknown>(
    key: string,
    value: T,
    options: CacheOptions = {}
  ): Promise<boolean> {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      const { ttl, namespace } = options;
      const fullKey = namespace ? `${namespace}:${key}` : key;

      if (ttl) {
        await this.client!.set(fullKey, value, { ex: ttl });
      } else {
        await this.client!.set(fullKey, value);
      }

      console.log(`[RedisClient] Cache SET: ${fullKey}${ttl ? ` (TTL: ${ttl}s)` : ''}`);
      return true;
    } catch (error) {
      console.error('[RedisClient] Erro ao gravar cache:', error);
      return false;
    }
  }

  /**
   * Remove valor do cache
   */
  public async del(key: string, namespace?: string): Promise<boolean> {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      const fullKey = namespace ? `${namespace}:${key}` : key;
      await this.client!.del(fullKey);
      console.log(`[RedisClient] Cache DELETE: ${fullKey}`);
      return true;
    } catch (error) {
      console.error('[RedisClient] Erro ao deletar cache:', error);
      return false;
    }
  }

  /**
   * Incrementa contador
   */
  public async incr(key: string, namespace?: string): Promise<number | null> {
    if (!this.isAvailable()) {
      return null;
    }

    try {
      const fullKey = namespace ? `${namespace}:${key}` : key;
      const value = await this.client!.incr(fullKey);
      console.log(`[RedisClient] INCR: ${fullKey} = ${value}`);
      return value;
    } catch (error) {
      console.error('[RedisClient] Erro ao incrementar:', error);
      return null;
    }
  }

  /**
   * Define TTL para uma key existente
   */
  public async expire(key: string, ttl: number, namespace?: string): Promise<boolean> {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      const fullKey = namespace ? `${namespace}:${key}` : key;
      await this.client!.expire(fullKey, ttl);
      console.log(`[RedisClient] EXPIRE: ${fullKey} (${ttl}s)`);
      return true;
    } catch (error) {
      console.error('[RedisClient] Erro ao definir TTL:', error);
      return false;
    }
  }

  /**
   * Verifica existência de key
   */
  public async exists(key: string, namespace?: string): Promise<boolean> {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      const fullKey = namespace ? `${namespace}:${key}` : key;
      const result = await this.client!.exists(fullKey);
      return result === 1;
    } catch (error) {
      console.error('[RedisClient] Erro ao verificar existência:', error);
      return false;
    }
  }

  /**
   * Limpa todas as keys de um namespace
   */
  public async clearNamespace(namespace: string): Promise<boolean> {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      const pattern = `${namespace}:*`;
      const keys = await this.client!.keys(pattern);
      
      if (keys.length > 0) {
        await this.client!.del(...keys);
        console.log(`[RedisClient] Namespace limpo: ${namespace} (${keys.length} keys)`);
      }

      return true;
    } catch (error) {
      console.error('[RedisClient] Erro ao limpar namespace:', error);
      return false;
    }
  }

  /**
   * Health check do Redis
   */
  public async healthCheck(): Promise<{ healthy: boolean; latency?: number; error?: string }> {
    if (!this.isAvailable()) {
      return { healthy: false, error: 'Redis não configurado' };
    }

    try {
      const start = Date.now();
      await this.client!.ping();
      const latency = Date.now() - start;

      return { healthy: true, latency };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      return { healthy: false, error: errorMessage };
    }
  }

  /**
   * Obtém estatísticas da conexão
   */
  public getStats() {
    return {
      isConnected: this.isConnected,
      connectionAttempts: this.connectionAttempts,
      maxRetries: this.maxRetries,
    };
  }
}

// Singleton instance
export const redisClient = new RedisClientService();

// Re-exporta tipos úteis
export type { CacheOptions };
