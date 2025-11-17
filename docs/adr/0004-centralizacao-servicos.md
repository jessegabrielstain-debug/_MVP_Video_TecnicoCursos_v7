# ADR 0004: Centralização de Serviços de Infraestrutura

**Status:** ✅ Aceito e Implementado  
**Data:** 2025-11-17 (atualizado de 2025-11-15)  
**Decisores:** Bruno L. (Tech Lead), Ana S. (Sponsor), Diego R. (DevOps)  
**Contexto:** Fase 1 do Plano de Implementação

## Contexto

O projeto apresentava múltiplas instâncias de conexões com Redis, BullMQ e implementações de logging espalhadas pelo código. Isso resultava em:

- Duplicação de código e lógica de conexão
- Dificuldade em manter consistência de configuração
- Falta de observabilidade centralizada
- Problemas com pool de conexões e memory leaks
- Ausência de fallback gracioso em caso de falhas
- Inconsistência no tratamento de erros
- Dificuldade em manutenção e testes

Exemplos de problemas identificados:
1. Conexões Redis criadas em múltiplos arquivos sem reuso
2. Logs inconsistentes (console.log, logger local, etc.)
3. Filas BullMQ sem monitoramento centralizado
4. Falta de health checks unificados

## Decisão

Criamos uma camada centralizada de serviços em `@/lib/services/` com três módulos principais seguindo o padrão singleton:

### Estrutura Implementada

```
lib/services/
├── index.ts                    # Exportações centralizadas
├── redis-client.ts             # Cliente Redis/Upstash singleton
├── queue-client.ts             # Filas BullMQ + métricas + health checks
├── logger.ts                   # Sistema de logging estruturado (JSONL)
├── supabase-client.ts          # Cliente Supabase (browser)
└── supabase-server.ts          # Cliente Supabase (server components)
```

### Padrões Adotados

1. **Singleton Pattern**: Instâncias únicas reutilizáveis
2. **Lazy Initialization**: Conexões criadas sob demanda
3. **Error Handling**: Logging centralizado de erros de conexão com fallback gracioso
4. **Environment Variables**: Configuração via variáveis de ambiente
5. **TypeScript Strict**: Tipagem explícita em todas as interfaces
6. **Health Checks**: Métodos de verificação de saúde para cada serviço

### Características Implementadas

#### Redis Client (`redis-client.ts`)
**Responsabilidade:** Gerenciar conexão única com Upstash Redis

**API:**
- `get<T>(key, namespace?)`: Obter valor do cache
- `set<T>(key, value, options?)`: Definir valor com TTL opcional
- `del(key, namespace?)`: Remover valor
- `incr(key, namespace?)`: Incrementar contador
- `expire(key, ttl, namespace?)`: Definir TTL
- `exists(key, namespace?)`: Verificar existência
- `clearNamespace(namespace)`: Limpar namespace completo
- `healthCheck()`: Verifica conectividade e latência
- `getStats()`: Estatísticas de conexão

**Funcionalidades:**
- Fallback gracioso (retorna null em caso de falha)
- Namespace para organização de keys
- TTL automático e expiração
- Logging estruturado de operações
- Health check com medição de latência

#### Queue Client (`queue-client.ts`)
**Responsabilidade:** Gerenciar filas BullMQ

**API:**
- `getQueue(name, config?)`: Obter ou criar fila
- `addJob(queueName, jobData, options?)`: Adicionar job com prioridade
- `getMetrics(queueName)`: Métricas em tempo real
- `pauseQueue(queueName)`: Pausar fila
- `resumeQueue(queueName)`: Retomar fila
- `removeJob(queueName, jobId)`: Remover job específico
- `cleanQueue(queueName, grace?)`: Limpar jobs antigos
- `healthCheck(queueName)`: Verificar saúde da fila
- `close()`: Encerrar todas as conexões

**Funcionalidades:**
- Múltiplas filas gerenciadas simultaneamente
- Retry automático exponencial (3 tentativas, delay 5s)
- Event listeners para monitoramento (completed, failed, progress)
- Métricas: waiting, active, completed, failed, delayed, paused
- Limpeza automática (mantém 100 completados, 500 falhados)
- Priorização (high=1, normal=5, low=10)

#### Logger (`logger.ts`)
**Responsabilidade:** Logging estruturado centralizado

**API:**
- `debug(message, context?)`: Log de debug
- `info(message, context?)`: Log informacional
- `warn(message, context?)`: Log de aviso
- `error(message, errorOrContext?, error?)`: Log de erro
- `withContext(baseContext)`: Logger contextual para request scoping
- `timer(label, context?)`: Utilitário para medir tempo
- `getConfig()`: Obter configuração
- `setMinLevel(level)`: Atualizar nível mínimo

**Funcionalidades:**
- Níveis: debug, info, warn, error
- Contexto rico: userId, requestId, jobId, projectId
- Saída console (colorizada) + arquivo (JSON Lines)
- Logging contextual para request tracing
- Timer para medição de performance
- Preparado para integração Sentry
- Rotação automática por dia e nível

## Padrões de Uso

### Redis
```typescript
import { redisClient } from '@/lib/services';

// Cache simples
await redisClient.set('user:123', userData, { ttl: 3600 });
const user = await redisClient.get<UserData>('user:123');

// Com namespace
await redisClient.set('stats', data, { namespace: 'analytics', ttl: 1800 });
const stats = await redisClient.get('stats', 'analytics');

// Health check
const health = await redisClient.healthCheck();
if (health.healthy) {
  console.log(`Redis OK (latency: ${health.latency}ms)`);
}
```

### Filas
```typescript
import { queueClient } from '@/lib/services';

// Adicionar job
const jobId = await queueClient.addJob('render-queue', {
  type: 'video-render',
  payload: { projectId, slides },
  metadata: { userId, priority: 'high' }
});

// Métricas
const metrics = await queueClient.getMetrics('render-queue');
console.log(`Queue: ${metrics.waiting} waiting, ${metrics.active} active`);

// Health check
const health = await queueClient.healthCheck('render-queue');
if (!health.healthy) {
  console.error('Queue unhealthy:', health.error);
}
```

### Logger
```typescript
import { logger } from '@/lib/services';

// Log simples
logger.info('Usuário autenticado', { userId: '123' });
logger.error('Falha ao processar', new Error('Timeout'));

// Com contexto fixo (útil em handlers de rota)
const requestLogger = logger.withContext({ 
  requestId: crypto.randomUUID(),
  userId: session.user.id 
});

requestLogger.info('Processando requisição');
requestLogger.error('Erro ao salvar', error);

// Timer para medição de performance
const timer = logger.timer('Processar vídeo', { projectId });
// ... processamento
timer.end({ slidesCount: 10, success: true });
```

### Integração Completa (Exemplo de API Route)
```typescript
import { logger, redisClient, queueClient } from '@/lib/services';
import { createServerClient } from '@/lib/services';

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  const log = logger.withContext({ requestId });

  try {
    log.info('Iniciando processamento de vídeo');

    // Autenticação
    const supabase = createServerClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      log.warn('Autenticação falhou');
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verificar cache
    const cacheKey = `video:${projectId}`;
    const cached = await redisClient.get(cacheKey);
    
    if (cached) {
      log.info('Retornando resposta do cache', { cacheKey });
      return Response.json(cached);
    }

    // Adicionar job à fila
    const timer = log.timer('Enfileirar job');
    const jobId = await queueClient.addJob('render-queue', {
      type: 'video-render',
      payload: { projectId, slides },
      metadata: { userId: user.id, priority: 'normal' }
    });
    timer.end({ jobId });

    // Cachear resultado
    await redisClient.set(cacheKey, { jobId, status: 'queued' }, { ttl: 300 });

    return Response.json({ jobId, status: 'queued' });

  } catch (error) {
    log.error('Erro ao processar requisição', error as Error);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}
```

## Consequências

### Positivas ✅
1. **Código mais limpo:** Única fonte de verdade para cada serviço
2. **Observabilidade:** Logs estruturados e métricas centralizadas
3. **Manutenibilidade:** Mudanças de configuração em um único local
4. **Resiliência:** Fallbacks graciosos e retry automático
5. **Performance:** Reuso de conexões, evita memory leaks
6. **Testabilidade:** Fácil mockar serviços centralizados
7. **Onboarding:** Documentação clara de como usar cada serviço
8. **Redução de código duplicado:** Lógica de conexão unificada
9. **Padrão consistente:** Todos os serviços seguem mesma estrutura
10. **Health checks:** Visibilidade em tempo real do estado dos serviços

### Negativas ⚠️
1. **Dependência:** Toda a aplicação depende desses módulos
2. **Migração:** Código existente precisa ser refatorado
3. **Singleton:** Pattern pode dificultar alguns tipos de teste (mitigado com interface clara)
4. **Dependência de environment:** Requer variáveis configuradas corretamente

### Mitigações 🛠️
- **Testes:** Criar suite de testes unitários para cada serviço (Fase 2)
- **Documentação:** Exemplos atualizados neste ADR e CONTRIBUTING.md
- **Migração gradual:** Refatorar módulo por módulo, sem big bang
- **Health checks:** Expor endpoint `/api/health` usando os health checks dos serviços
- **Mocks:** Criar mocks oficiais em `__tests__/__mocks__/services/`

## Alternativas Consideradas

### 1. Biblioteca externa (ex: `ioredis`, logger de terceiros)
**Rejeitado:** Adiciona dependências desnecessárias e menos controle sobre comportamento customizado

### 2. Injeção de dependência com DI container (ex: tsyringe, inversify)
**Rejeitado:** Overhead de complexidade para o tamanho do projeto atual. Singleton é suficiente.

### 3. Manter código distribuído
**Rejeitado:** Problemas atuais (duplicação, inconsistência) justificam refatoração completa

### 4. Usar apenas Supabase Realtime para filas
**Rejeitado:** BullMQ oferece funcionalidades avançadas (retry, prioridade, delayed jobs) essenciais para render

## Próximos Passos

1. ✅ Criar serviços em `@/lib/services/` (redis-client, queue-client, logger)
2. ⏳ Migrar rotas `app/api/v1/video-jobs/**` para usar novos serviços
3. ⏳ Atualizar `CONTRIBUTING.md` com padrões de uso
4. ⏳ Integrar logger com Sentry (Fase 2 - Observabilidade)
5. ⏳ Criar testes unitários para cada serviço
6. ⏳ Expor métricas em `/api/health` e dashboard (Grafana/Supabase)
7. ⏳ Criar mocks oficiais para testes
8. ⏳ Documentar troubleshooting em `docs/operacao/`

## Referências

- [Documentação BullMQ](https://docs.bullmq.io/)
- [Upstash Redis](https://upstash.com/docs/redis)
- [ADR 0002: Estados de Job](./0002-job-states.md)
- [Fase 1 - Plano de Implementação](../plano-implementacao-por-fases.md#fase-1--fundação-técnica)
- [Padrão Singleton Supabase](../../lib/services/supabase-client.ts)

---
**Autor:** Bruno L. (Tech Lead)  
**Revisores:** Diego R. (DevOps), Ana S. (Sponsor)  
**Data implementação:** 17/11/2025  
**Última atualização:** 17/11/2025
