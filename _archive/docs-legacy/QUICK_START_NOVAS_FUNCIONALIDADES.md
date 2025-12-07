# ⚡ GUIA DE INÍCIO RÁPIDO - Novas Funcionalidades

## 🎯 Em 5 Minutos

### 1. Health Check - Verificar Saúde do Sistema

```bash
# Teste via cURL
curl http://localhost:3000/api/health

# Ou no navegador
http://localhost:3000/api/health?detailed=true
```

**Código:**
```typescript
import { createCachedHealthCheck } from '@/lib/monitoring/health-check-system';

const checker = createCachedHealthCheck();
const result = await checker.checkSystemHealth();

console.log('Status:', result.data?.overall);
// Output: "healthy" | "degraded" | "unhealthy"
```

---

### 2. Queue Manager - Processar Jobs em Background

```typescript
import { createResilientQueue } from '@/lib/queue/queue-manager';

// 1. Criar fila
const queue = createResilientQueue('my-tasks');

// 2. Registrar processador
queue.registerProcessor('send-email', async (job) => {
  console.log('Enviando email para:', job.data.email);
  // Seu código aqui
  return { success: true };
});

// 3. Adicionar job
await queue.addJob('send-email', {
  email: 'user@example.com',
  subject: 'Hello'
});

// 4. Monitorar
const metrics = await queue.getMetrics();
console.log('Jobs completados:', metrics.completed);
```

---

### 3. Cache - Acelerar Suas Aplicações

```typescript
import { createDistributedCache } from '@/lib/cache/multi-layer-cache';

const cache = createDistributedCache();

// Salvar
await cache.set('user:123', {
  name: 'John Doe',
  email: 'john@example.com'
});

// Buscar
const result = await cache.get('user:123');

if (result.hit) {
  console.log('User encontrado:', result.value);
  console.log('Cache layer:', result.layer); // memory, redis ou s3
} else {
  console.log('Cache miss - buscar do banco');
}

// Invalidar
await cache.delete('user:123');
```

---

## 🚀 Exemplos Práticos

### Exemplo 1: Pipeline de Vídeo com Queue

```typescript
import { createResilientQueue } from '@/lib/queue/queue-manager';
import { createDistributedCache } from '@/lib/cache/multi-layer-cache';

const queue = createResilientQueue('video-pipeline');
const cache = createDistributedCache();

// Processador 1: Upload
queue.registerProcessor('video:upload', async (job) => {
  const url = await uploadToS3(job.data.file);
  await cache.set(`video:${job.id}`, { url });
  
  // Enfileirar próximo step
  await queue.addJob('video:process', { videoId: job.id }, {
    priority: 'high'
  });
  
  return { url };
});

// Processador 2: Processar
queue.registerProcessor('video:process', async (job) => {
  const video = (await cache.get(`video:${job.data.videoId}`)).value;
  const processed = await processVideo(video.url);
  
  return { processed };
});

// Iniciar pipeline
await queue.addJob('video:upload', {
  file: myFile
});
```

### Exemplo 2: Monitoramento Automático

```typescript
import { createMonitoredHealthCheck } from '@/lib/monitoring/health-check-system';

const health = createMonitoredHealthCheck();

// Alertar quando houver problemas
health.onHealthChange((status) => {
  if (status.overall !== 'healthy') {
    console.error('🚨 ALERTA: Sistema degradado!');
    console.error('Serviços com problema:', 
      status.services.filter(s => s.status !== 'healthy')
    );
    
    // Enviar notificação
    sendSlackAlert('Sistema com problemas!');
  }
});

// Check a cada minuto
setInterval(async () => {
  await health.checkSystemHealth();
}, 60000);
```

### Exemplo 3: Cache Inteligente para API

```typescript
import { createDistributedCache } from '@/lib/cache/multi-layer-cache';

const cache = createDistributedCache();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  
  const cacheKey = `api:user:${userId}`;
  
  // Tentar cache primeiro
  const cached = await cache.get(cacheKey);
  
  if (cached.hit) {
    return Response.json({
      ...cached.value,
      fromCache: true,
      layer: cached.layer
    });
  }
  
  // Cache miss - buscar do banco
  const user = await db.user.findUnique({
    where: { id: userId }
  });
  
  // Salvar no cache (5 minutos)
  await cache.set(cacheKey, user, 300000);
  
  return Response.json({
    ...user,
    fromCache: false
  });
}
```

---

## 🧪 Testando

### Rodar Testes

```bash
# Todos os testes
npm test

# Teste específico
npm test health-check-system.test.ts

# Com coverage
npm test -- --coverage
```

### Teste Manual das APIs

```bash
# 1. Health Check
curl http://localhost:3000/api/health

# 2. Adicionar job na fila
curl -X POST http://localhost:3000/api/queue \
  -H "Content-Type: application/json" \
  -d '{
    "type": "test-job",
    "data": {"message": "Hello"},
    "priority": "high"
  }'

# 3. Ver métricas da fila
curl http://localhost:3000/api/queue
```

---

## 📊 Monitorar Performance

### Health Check

```typescript
const result = await checker.checkSystemHealth();

console.log('Duração:', result.duration, 'ms');
console.log('Serviços checados:', result.data?.services.length);
console.log('Taxa de erro DB:', checker.getErrorRate('database'));
```

### Queue

```typescript
const metrics = await queue.getMetrics();

console.log('Taxa de sucesso:', metrics.successRate, '%');
console.log('Tempo médio:', metrics.avgProcessingTime, 'ms');
console.log('Throughput:', metrics.throughput, 'jobs');
```

### Cache

```typescript
const stats = cache.getStats();

console.log('Hit Rate:', stats.overall.hitRate, '%');
console.log('Tamanho total:', stats.overall.totalSize, 'bytes');
console.log('Memory hits:', stats.memory.hits);
console.log('Redis hits:', stats.redis.hits);
```

---

## 🔧 Configuração Avançada

### Custom Health Check

```typescript
import { HealthCheckSystem } from '@/lib/monitoring/health-check-system';

const health = new HealthCheckSystem({
  timeout: 10000,           // 10 segundos
  retries: 3,               // 3 tentativas
  enableCache: true,
  cacheTTL: 60000,          // 1 minuto
  enableNotifications: true,
  thresholds: {
    responseTime: 2000,     // 2 segundos
    errorRate: 0.05,        // 5%
  }
});
```

### Custom Queue

```typescript
import { QueueManager } from '@/lib/queue/queue-manager';

const queue = new QueueManager({
  name: 'custom-queue',
  concurrency: 20,          // 20 jobs paralelos
  maxAttempts: 5,           // 5 tentativas
  retryDelay: 2000,         // 2 segundos
  retryBackoff: 'exponential',
  timeout: 60000,           // 1 minuto
  enableDLQ: true,
  enableMetrics: true,
  cleanupInterval: 300000,  // 5 minutos
});
```

### Custom Cache

```typescript
import { MultiLayerCache } from '@/lib/cache/multi-layer-cache';

const cache = new MultiLayerCache({
  enableMemory: true,
  enableRedis: true,
  enableS3: true,
  enableCompression: true,
  compressionThreshold: 5120,  // 5KB
  memoryMax: 500,              // 500 MB
  memoryTTL: 900000,           // 15 minutos
  redisTTL: 7200000,           // 2 horas
  s3TTL: 86400000,             // 24 horas
});
```

---

## 🎓 Boas Práticas

### 1. Sempre use Factory Functions

```typescript
// ✅ BOM
const queue = createResilientQueue('my-queue');

// ❌ EVITE (a menos que precise de configuração custom)
const queue = new QueueManager({ ... });
```

### 2. Handle Errors

```typescript
queue.on('error', (error) => {
  console.error('Queue error:', error);
  // Log para sistema de monitoramento
});

queue.on('job:failed', (job, error) => {
  console.error('Job failed:', job.id, error);
  // Notificar time
});
```

### 3. Cleanup Resources

```typescript
// Antes de encerrar aplicação
await queue.close();
await cache.close();
```

### 4. Use Priorities

```typescript
// Jobs críticos
await queue.addJob('critical-task', data, { 
  priority: 'critical' 
});

// Jobs normais
await queue.addJob('normal-task', data);

// Jobs de baixa prioridade (background)
await queue.addJob('cleanup-task', data, { 
  priority: 'low' 
});
```

---

## 💡 Dicas

1. **Cache:** Use para dados que mudam pouco
2. **Queue:** Use para tarefas demoradas ou assíncronas
3. **Health Check:** Execute periodicamente (60s)
4. **Metrics:** Monitore e ajuste thresholds
5. **Logs:** Use eventos para rastreabilidade

---

## 📚 Próximos Passos

1. Explore os exemplos completos
2. Leia a documentação detalhada
3. Configure variáveis de ambiente
4. Execute os testes
5. Integre ao seu projeto

---

**Última Atualização:** 11 de Outubro de 2025
