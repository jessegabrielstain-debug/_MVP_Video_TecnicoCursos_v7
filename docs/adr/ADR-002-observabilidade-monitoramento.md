# ADR-002 — Observabilidade e Monitoramento (Fase 2)

Data: 16/11/2025
Status: Proposto
Decisores: Tech Lead + Equipe Core

## Contexto
Com a Fase 1 concluída (fundação técnica sólida), precisamos de visibilidade operacional em produção: rastreamento de erros, métricas de fila, latência e alertas proativos para degradação de serviço.

## Decisão

### 1. Sentry para Error Tracking
- **Escopo**: App Router + API Routes + background jobs
- **Configuração**:
  - `@sentry/nextjs` com integração automática
  - Source maps uploadados em build (Vercel)
  - Environment tags: `development`, `staging`, `production`
  - User context: `user_id` de Supabase (sem PII sensível)
- **Alertas**:
  - Slack webhook para erros críticos (>5 ocorrências/min)
  - Email digest diário para warnings acumulados

### 2. BullMQ Metrics Dashboard
- **Escopo**: filas de render e notificações
- **Implementação**:
  - Exportar métricas via `bull-board` (web UI)
  - Expor endpoint `/api/admin/queues` (autenticado, is_admin RPC)
  - Métricas coletadas:
    - Taxa de processamento (jobs/min)
    - Latência média (waiting → completed)
    - Taxa de falha (failed/total)
    - Tamanho de fila (waiting + active)
- **Armazenamento**:
  - Snapshots periódicos em `queue_metrics` (tabela Supabase)
  - Retenção: 30 dias (análise de tendências)

### 3. Alertas Proativos
- **Triggers**:
  - Fila de render >100 jobs aguardando por >5 min
  - Taxa de erro >10% em janela de 5 min
  - Latência p95 >30s em render
  - Worker inativo por >2 min (heartbeat)
- **Canais**:
  - Slack: alertas críticos
  - PagerDuty: incidentes (apenas produção)
  - Log estruturado: todos os alertas (auditoria)

### 4. Healthcheck Endpoint
- `GET /api/health`: status agregado
  - DB: query simples (`SELECT 1`)
  - Redis: ping
  - Queue: contadores básicos
  - Response: `200 OK` ou `503 Service Unavailable`
- Usado por:
  - Vercel health checks
  - Uptime monitoring externo (UptimeRobot)
  - Smoke tests Playwright

## Alternativas Consideradas
- **New Relic/Datadog**: rejeitados por custo (~$100/mês vs Sentry free tier)
- **Prometheus + Grafana**: rejeitado por complexidade de setup em serverless
- **Logs agregados em CloudWatch**: rejeitado por lock-in AWS (estamos em Vercel)

## Consequências

### Positivas
- Visibilidade end-to-end de erros em produção
- Detecção precoce de gargalos e falhas
- Métricas históricas para capacity planning
- Redução de MTTR (mean time to recovery)

### Negativas
- Overhead de rede (+10-20ms por request com Sentry)
- Custo adicional se ultrapassar free tier Sentry (5k eventos/mês)
- Complexidade de configuração inicial (~2-3 dias)

### Riscos Mitigados
- Erros silenciosos em produção (Sentry captura automaticamente)
- Filas travadas sem alerta (métricas BullMQ + alertas)
- Degradação gradual não detectada (p95 latency tracking)

## Implementação — Roadmap

### Sprint 1 (17-21/11)
- [ ] Setup Sentry projeto + DSN
- [ ] Instrumentar App Router (`instrumentation.ts`)
- [ ] Configurar source maps upload (Vercel)
- [ ] Testar captura de erro intencional

### Sprint 2 (24-28/11)
- [ ] Instalar `bull-board` + autenticação admin
- [ ] Criar tabela `queue_metrics` (schema + RLS)
- [ ] Implementar snapshot worker (cron 1 min)
- [ ] Dashboard simples em `/admin/queues`

### Sprint 3 (01-05/12)
- [ ] Healthcheck endpoint `/api/health`
- [ ] Configurar alertas Slack (webhook)
- [ ] Smoke tests Playwright (healthcheck + critical flows)
- [ ] Documentar runbook de incidentes

## Dependências
- Supabase RLS: função `is_admin()` já existe
- Redis: serviço centralizado já implementado (Fase 1)
- Logger: já padronizado nas rotas core (Fase 1)

## Métricas de Sucesso
- **MTTD** (Mean Time To Detect): <5 min para erros críticos
- **MTTR**: <30 min para incidentes P0
- **Cobertura de alertas**: 100% dos cenários críticos (fila, DB, auth)
- **Uptime SLA**: ≥99.5% medido via healthcheck externo

## Referências
- Sentry Next.js: https://docs.sentry.io/platforms/javascript/guides/nextjs/
- Bull Board: https://github.com/felixmosh/bull-board
- `lib/services/redis.ts` (fallback in-memory)
- `scripts/logger.ts` (logs estruturados)
