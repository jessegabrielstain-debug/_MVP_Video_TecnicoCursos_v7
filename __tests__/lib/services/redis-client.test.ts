/**
 * Testes unitários do Redis Client centralizado
 */

import { redisClient } from '@/lib/services/redis-client';

describe('RedisClient', () => {
  beforeEach(async () => {
    // Limpar namespace de teste
    await redisClient.clearNamespace('test:jest');
  });

  afterAll(async () => {
    // Cleanup final
    await redisClient.clearNamespace('test:jest');
  });

  describe('Health Check', () => {
    it('deve retornar status healthy quando Redis está disponível', async () => {
      const health = await redisClient.health();
      
      expect(health.status).toBe('healthy');
      expect(health.latency).toBeGreaterThanOrEqual(0);
      expect(typeof health.latency).toBe('number');
    });
  });

  describe('Basic Operations', () => {
    it('deve gravar e ler um valor string', async () => {
      const key = 'test:jest:string';
      const value = 'Hello Redis';

      await redisClient.set(key, value);
      const retrieved = await redisClient.get(key);

      expect(retrieved).toBe(value);
    });

    it('deve gravar e ler um objeto JSON', async () => {
      const key = 'test:jest:object';
      const value = { id: 123, name: 'Test User', active: true };

      await redisClient.set(key, value);
      const retrieved = await redisClient.get(key);

      expect(retrieved).toEqual(value);
    });

    it('deve verificar existência de chave', async () => {
      const key = 'test:jest:exists';

      const existsBefore = await redisClient.exists(key);
      expect(existsBefore).toBe(false);

      await redisClient.set(key, 'value');
      const existsAfter = await redisClient.exists(key);
      expect(existsAfter).toBe(true);
    });

    it('deve deletar uma chave', async () => {
      const key = 'test:jest:delete';

      await redisClient.set(key, 'value');
      await redisClient.del(key);
      
      const exists = await redisClient.exists(key);
      expect(exists).toBe(false);
    });
  });

  describe('TTL (Time To Live)', () => {
    it('deve respeitar TTL configurado', async () => {
      const key = 'test:jest:ttl';
      const value = 'ephemeral';

      await redisClient.set(key, value, 1); // TTL 1 segundo
      
      const immediate = await redisClient.get(key);
      expect(immediate).toBe(value);

      // Aguardar TTL expirar
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const afterTTL = await redisClient.get(key);
      expect(afterTTL).toBeNull();
    }, 3000);

    it('deve permitir atualizar TTL com expire', async () => {
      const key = 'test:jest:expire';

      await redisClient.set(key, 'value');
      const success = await redisClient.expire(key, 60);
      
      expect(success).toBe(true);
    });
  });

  describe('Counter Operations', () => {
    it('deve incrementar contador', async () => {
      const key = 'test:jest:counter';

      const count1 = await redisClient.incr(key);
      const count2 = await redisClient.incr(key);
      const count3 = await redisClient.incr(key);

      expect(count1).toBe(1);
      expect(count2).toBe(2);
      expect(count3).toBe(3);
    });

    it('deve permitir incrementar por valor específico', async () => {
      const key = 'test:jest:counter-by';

      const count1 = await redisClient.incr(key, 10);
      const count2 = await redisClient.incr(key, 5);

      expect(count1).toBe(10);
      expect(count2).toBe(15);
    });
  });

  describe('Namespace Operations', () => {
    it('deve limpar apenas chaves do namespace especificado', async () => {
      const ns = 'test:jest:namespace';

      await redisClient.set(`${ns}:key1`, 'value1');
      await redisClient.set(`${ns}:key2`, 'value2');
      await redisClient.set('test:jest:other', 'other');

      await redisClient.clearNamespace(ns);

      const key1 = await redisClient.get(`${ns}:key1`);
      const key2 = await redisClient.get(`${ns}:key2`);
      const other = await redisClient.get('test:jest:other');

      expect(key1).toBeNull();
      expect(key2).toBeNull();
      expect(other).toBe('other');

      // Cleanup
      await redisClient.del('test:jest:other');
    });
  });

  describe('Error Handling', () => {
    it('deve retornar null para chave inexistente', async () => {
      const value = await redisClient.get('test:jest:nonexistent');
      expect(value).toBeNull();
    });

    it('deve lidar graciosamente com operações em caso de falha', async () => {
      // Este teste assume comportamento de fallback
      // Em produção, verificar configuração de UPSTASH_REDIS_REST_URL
      const result = await redisClient.get('any:key');
      expect(result === null || typeof result === 'string').toBe(true);
    });
  });
});
