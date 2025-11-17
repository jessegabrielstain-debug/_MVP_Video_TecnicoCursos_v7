# ADR 0004: Centralização de Serviços

**Status:** Aceito  
**Data:** 2025-11-15  
**Decisores:** Bruno L. (Tech Lead), Ana S. (Sponsor)  
**Contexto:** Fase 1 do Plano de Implementação

## Contexto

O projeto possui múltiplas integrações (Supabase, Redis, BullMQ, logging) dispersas em diferentes módulos, causando:
- Duplicação de lógica de conexão
- Inconsistência no tratamento de erros
- Dificuldade em manutenção e testes
- Falta de padrão singleton adequado

## Decisão

Centralizar todos os serviços de infraestrutura em `@/lib/services/` seguindo o padrão singleton estabelecido em `supabase-client.ts`:

### Estrutura Criada

```
lib/services/
├── index.ts                    # Exportações centralizadas
├── redis-service.ts            # Cliente Redis singleton
├── bullmq-service.ts           # Filas BullMQ + operações
├── logger-service.ts           # Sistema de logging estruturado (JSONL)
└── monitoring-service.ts       # Stubs para Sentry (futura integração)
```

### Padrões Adotados

1. **Singleton Pattern**: Instâncias únicas reutilizáveis
2. **Lazy Initialization**: Conexões criadas sob demanda
3. **Error Handling**: Logging centralizado de erros de conexão
4. **Environment Variables**: Configuração via variáveis de ambiente
5. **TypeScript Strict**: Tipagem explícita em todas as interfaces

### Características Implementadas

#### Redis Service
- `getRedisClient()`: Cliente singleton com retry automático
- `createRedisPubSub()`: Instâncias separadas para pub/sub
- `isRedisConnected()`: Health check
- `closeRedis()`: Encerramento gracioso

#### BullMQ Service
- `getVideoRenderQueue()`: Fila de renderização singleton
- `addRenderJob()`: Adicionar jobs com prioridade/delay
- `getJobStatus()`: Consulta estado de jobs
- `cancelJob()`: Cancelamento de jobs
- `getQueueMetrics()`: Métricas agregadas (waiting/active/completed/failed)
- `cleanQueue()`: Limpeza de jobs antigos
- `createVideoRenderWorker()`: Factory para workers com concorrência configurável

#### Logger Service
- Formato JSONL compatível com `scripts/logger.ts`
- Rotação automática em 10MB
- Níveis: debug/info/warn/error/fatal
- Contexto por instância (`getLogger('context')`)
- Output colorido em desenvolvimento

#### Monitoring Service
- Stubs para integração futura com Sentry
- `captureError()`, `captureException()`, `recordMetric()`, `addBreadcrumb()`

## Consequências

### Positivas
✅ **Redução de código duplicado**: Lógica de conexão unificada  
✅ **Facilita testes**: Mocks centralizados  
✅ **Manutenibilidade**: Ponto único de configuração  
✅ **Padrão consistente**: Todos os serviços seguem mesma estrutura  
✅ **Logging estruturado**: Rastreabilidade completa de eventos  
✅ **Métricas de fila**: Visibilidade de performance BullMQ  

### Negativas
⚠️ **Refatoração necessária**: Código existente precisa migrar para novos serviços  
⚠️ **Dependência de environment**: Requer variáveis configuradas corretamente  

### Neutras
📝 **Monitoring Service**: Stubs aguardando integração Sentry (Fase 2)  

## Próximos Passos

1. ✅ Criar serviços em `@/lib/services/`
2. ⏳ Migrar código existente para usar novos serviços
3. ⏳ Atualizar `CONTRIBUTING.md` com padrão de uso
4. ⏳ Integrar Sentry no `monitoring-service.ts` (Fase 2)
5. ⏳ Adicionar testes unitários para cada serviço

## Referências

- [Padrão Singleton Supabase](../lib/supabase/supabase-client.ts)
- [Fase 1 - Plano de Implementação](../../docs/plano-implementacao-por-fases.md#fase-1--fundação-técnica)
- [ADR 0002 - Job States](./0002-job-states.md)
