#!/usr/bin/env node
import { redisClient } from '../lib/services/redis-client.js';
import { logger } from '../lib/services/logger.js';

/**
 * Script de teste do Redis client centralizado
 * Verifica conectividade e operações básicas
 */

const testLogger = logger.withContext({ component: 'RedisTest' });

async function runTests() {
  console.log('\n=== Teste do Redis Client ===\n');

  try {
    // Test 1: Health check
    console.log('1️⃣ Verificando saúde do Redis...');
    const health = await redisClient.health();
    console.log(`   Status: ${health.status}`);
    console.log(`   Latência: ${health.latency}ms`);
    
    if (health.status !== 'healthy') {
      testLogger.error('Redis não está saudável', { health });
      return;
    }

    // Test 2: Set/Get
    console.log('\n2️⃣ Testando SET/GET...');
    const testKey = 'test:logger:key';
    const testValue = { message: 'Hello Redis', timestamp: Date.now() };
    
    await redisClient.set(testKey, testValue, 60); // TTL 60s
    const retrieved = await redisClient.get(testKey);
    
    console.log(`   Valor gravado:`, testValue);
    console.log(`   Valor lido:`, retrieved);
    console.log(`   ✅ SET/GET ${JSON.stringify(testValue) === JSON.stringify(retrieved) ? 'OK' : 'FAILED'}`);

    // Test 3: Increment
    console.log('\n3️⃣ Testando INCR...');
    const counterKey = 'test:counter';
    const count1 = await redisClient.incr(counterKey);
    const count2 = await redisClient.incr(counterKey);
    console.log(`   Contador: ${count1} → ${count2}`);
    console.log(`   ✅ INCR ${count2 === count1 + 1 ? 'OK' : 'FAILED'}`);

    // Test 4: Exists/Delete
    console.log('\n4️⃣ Testando EXISTS/DEL...');
    const exists1 = await redisClient.exists(testKey);
    await redisClient.del(testKey);
    const exists2 = await redisClient.exists(testKey);
    console.log(`   Antes: ${exists1}, Depois: ${exists2}`);
    console.log(`   ✅ EXISTS/DEL ${exists1 && !exists2 ? 'OK' : 'FAILED'}`);

    // Test 5: Namespace
    console.log('\n5️⃣ Testando namespace...');
    await redisClient.set('ns:test:1', 'value1');
    await redisClient.set('ns:test:2', 'value2');
    await redisClient.set('other:key', 'other');
    
    await redisClient.clearNamespace('ns:test');
    const cleared1 = await redisClient.get('ns:test:1');
    const cleared2 = await redisClient.get('ns:test:2');
    const notCleared = await redisClient.get('other:key');
    
    console.log(`   ns:test:1 após clear: ${cleared1}`);
    console.log(`   ns:test:2 após clear: ${cleared2}`);
    console.log(`   other:key preservada: ${notCleared}`);
    console.log(`   ✅ NAMESPACE ${!cleared1 && !cleared2 && notCleared ? 'OK' : 'FAILED'}`);

    // Cleanup
    await redisClient.del(counterKey);
    await redisClient.del('other:key');

    console.log('\n✅ Todos os testes do Redis passaram!\n');
    testLogger.info('Testes de Redis concluídos com sucesso');
    
  } catch (error) {
    console.error('\n❌ Erro durante testes:', error);
    testLogger.error('Falha nos testes de Redis', {}, error as Error);
    process.exit(1);
  }
}

runTests();
