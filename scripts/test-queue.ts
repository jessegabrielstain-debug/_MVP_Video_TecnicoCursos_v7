#!/usr/bin/env node
import { queueClient } from '../lib/services/queue-client.js';
import { logger } from '../lib/services/logger.js';

/**
 * Script de teste do Queue client (BullMQ)
 * Verifica saúde, enfileiramento e processamento
 */

const testLogger = logger.withContext({ component: 'QueueTest' });

async function runTests() {
  console.log('\n=== Teste do Queue Client (BullMQ) ===\n');

  try {
    const queueName = 'test-queue';

    // Test 1: Health check
    console.log('1️⃣ Verificando saúde das filas...');
    const health = await queueClient.health();
    console.log(`   Status: ${health.status}`);
    console.log(`   Filas ativas: ${health.queues.join(', ') || 'nenhuma'}`);

    // Test 2: Add jobs
    console.log('\n2️⃣ Adicionando jobs à fila...');
    
    const job1 = await queueClient.addJob(queueName, 'test-job-1', {
      message: 'Job de alta prioridade',
      timestamp: Date.now(),
    }, { priority: 'high' });
    
    const job2 = await queueClient.addJob(queueName, 'test-job-2', {
      message: 'Job de prioridade normal',
      timestamp: Date.now(),
    });

    console.log(`   Job 1 ID: ${job1.id} (priority: high)`);
    console.log(`   Job 2 ID: ${job2.id} (priority: normal)`);

    // Test 3: Get metrics
    console.log('\n3️⃣ Obtendo métricas da fila...');
    const metrics = await queueClient.getMetrics(queueName);
    console.log(`   Waiting: ${metrics.waiting}`);
    console.log(`   Active: ${metrics.active}`);
    console.log(`   Completed: ${metrics.completed}`);
    console.log(`   Failed: ${metrics.failed}`);
    console.log(`   Delayed: ${metrics.delayed}`);
    console.log(`   Paused: ${metrics.paused}`);

    // Test 4: Setup processor (simulated)
    console.log('\n4️⃣ Configurando processador de teste...');
    let processedCount = 0;
    
    queueClient.on(queueName, async (job) => {
      console.log(`   📦 Processando job ${job.id}:`, job.data);
      testLogger.info('Job processado', { jobId: job.id, data: job.data });
      
      // Simular processamento
      await new Promise(resolve => setTimeout(resolve, 500));
      processedCount++;
      
      return { processed: true, jobId: job.id };
    });

    // Wait for processing
    console.log('\n   ⏳ Aguardando processamento (3s)...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log(`\n   ✅ Jobs processados: ${processedCount}`);

    // Test 5: Cleanup
    console.log('\n5️⃣ Limpando fila de teste...');
    await queueClient.cleanupQueue(queueName);
    
    const metricsAfterCleanup = await queueClient.getMetrics(queueName);
    console.log(`   Completed após cleanup: ${metricsAfterCleanup.completed}`);
    console.log(`   Failed após cleanup: ${metricsAfterCleanup.failed}`);

    console.log('\n✅ Todos os testes do Queue passaram!\n');
    testLogger.info('Testes de Queue concluídos com sucesso');

    // Close queue connection
    await queueClient.close(queueName);
    
  } catch (error) {
    console.error('\n❌ Erro durante testes:', error);
    testLogger.error('Falha nos testes de Queue', {}, error as Error);
    process.exit(1);
  }
}

runTests();
