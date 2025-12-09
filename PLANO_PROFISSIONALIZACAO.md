# 🎯 Plano de Profissionalização - MVP Vídeos TécnicoCursos v7

**Status Atual:** Protótipo Funcional (Score: 39/100)  
**Meta:** Sistema Profissional de Produção (Score: 85+/100)  
**Prazo Estimado:** 15 dias úteis  
**Última Atualização:** 9 de dezembro de 2025

---

## 📊 Diagnóstico Atual

### Problemas Críticos Identificados

#### 🔴 **CRÍTICO - Segurança de Tipos**
- ❌ `typescript.ignoreBuildErrors: true` no `next.config.mjs`
- ❌ `strict: false` no `tsconfig.json`
- ❌ 50+ ocorrências de tipo `any` sem justificativa
- ❌ 6 arquivos com `@ts-nocheck` ou `@ts-ignore`

#### 🔴 **CRÍTICO - Tratamento de Erros**
- ❌ 30+ casos de `.catch(() => {})` (erros silenciosos)
- ❌ Sem logging estruturado em produção
- ❌ `try/catch` sem contexto ou recovery

#### 🟡 **ALTO - Logging & Observabilidade**
- ⚠️ 30+ `console.log/error` em rotas API
- ⚠️ Observabilidade desabilitada (`catch {}` em `observability.ts`)
- ⚠️ Sem métricas, traces ou alerting

#### 🟡 **ALTO - Cobertura de Testes**
- ⚠️ 79 arquivos de teste, mas sem coverage mínimo enforçado
- ⚠️ Mocks excessivos (`any` em test-types)
- ⚠️ Falta E2E para fluxos críticos

#### 🟢 **MÉDIO - Performance & Otimizações**
- ℹ️ Comentários "slow if many notifications, but works for MVP"
- ℹ️ Queries sem índices documentados
- ℹ️ Cache inconsistente

---

## 🗓️ Roadmap de Implementação

### **FASE 1 - Fundações TypeScript** (2 dias - Sprint 1)

**Objetivo:** Eliminar dívida técnica de tipagem e habilitar type safety.

#### Dia 1: Configuração & Limpeza
- [ ] **1.1** Criar branch `feat/typescript-strict`
- [ ] **1.2** Habilitar `"strict": true` em `tsconfig.json`
- [ ] **1.3** Remover `ignoreBuildErrors` do `next.config.mjs`
- [ ] **1.4** Auditar e documentar todos os `any` (usar `npm run audit:any`)
- [ ] **1.5** Criar interfaces para APIs externas em `types/external-apis.ts`:
  - `ElevenLabsVoice`, `ElevenLabsCloneResponse`
  - `HeyGenVoice`, `HeyGenAvatarResponse`
  - `PPTXParseResult`, `PPTXSlideData`

**Deliverables:**
```typescript
// types/external-apis.ts (exemplo)
export interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  category: 'premade' | 'cloned' | 'professional';
  settings?: {
    stability: number;
    similarity_boost: number;
  };
}

export interface PPTXParseResult {
  metadata: {
    title: string;
    slideCount: number;
    author?: string;
  };
  slides: PPTXSlideData[];
  errors: PPTXParseError[];
}
```

#### Dia 2: Refatoração de `any`
- [ ] **1.6** Substituir `any[]` em `listVoices()` por tipos específicos
- [ ] **1.7** Tipar retornos de parsers PPTX (`pptx-parser.ts`, `pptx-core-parser.ts`)
- [ ] **1.8** Remover `@ts-nocheck` de:
  - `variable-data-engine.ts`
  - `transcription-service.ts`
  - `pdf-processor.ts`
- [ ] **1.9** Substituir `Record<string, any>` por tipos específicos
- [ ] **1.10** Executar `npm run type-check` sem erros

**Critérios de Sucesso:**
- ✅ Zero `ignoreBuildErrors` warnings
- ✅ Menos de 5 `any` justificados (com comentário `// @allow-any: reason`)
- ✅ TypeScript build passa em CI

---

### **FASE 2 - Logging Estruturado** (2 dias - Sprint 1)

**Objetivo:** Substituir `console.*` por logger profissional com contexto.

#### Dia 3: Setup Logger Service
- [ ] **2.1** Validar `logger-service.ts` existente
- [ ] **2.2** Criar wrapper para API routes: `withLogging(handler)`
- [ ] **2.3** Definir padrão de contexto:
  ```typescript
  logger.info('message', { 
    component: 'ComponentName',
    userId: string,
    jobId?: string,
    metadata?: Record<string, unknown>
  })
  ```
- [ ] **2.4** Criar script de migração: `scripts/migrate-console-to-logger.ts`

#### Dia 4: Migração em Massa
- [ ] **2.5** Substituir `console.log` em `app/api/` (30+ ocorrências)
- [ ] **2.6** Substituir `console.error` em handlers de erro
- [ ] **2.7** Adicionar contexto em logs críticos:
  - Render pipeline
  - Video export
  - Analytics processing
- [ ] **2.8** Configurar log levels por ambiente (`.env`):
  ```bash
  LOG_LEVEL=info          # production
  LOG_LEVEL=debug         # development
  ```

**Critérios de Sucesso:**
- ✅ Zero `console.*` em `app/api/` e `app/lib/`
- ✅ Todos os logs com `component` e contexto relevante
- ✅ Logs estruturados em JSON (produção)

---

### **FASE 3 - Tratamento de Erros Profissional** (3 dias - Sprint 2)

**Objetivo:** Eliminar erros silenciosos e implementar recovery strategies.

#### Dia 5: Error Boundaries & Handlers
- [ ] **3.1** Criar `lib/errors/`:
  - `AppError` (base class)
  - `ValidationError`, `AuthError`, `RenderError`, `StorageError`
- [ ] **3.2** Criar `normalizeError(error: unknown): AppError`
- [ ] **3.3** Implementar Error Boundary em `app/layout.tsx`
- [ ] **3.4** Criar `withErrorHandling` wrapper para API routes

#### Dia 6-7: Refatoração de Catches
- [ ] **3.5** Auditar todos os `.catch(() => {})` (30+ casos)
- [ ] **3.6** Categorizar por tipo:
  - **Cleanup intentional:** `fs.unlink().catch(() => {})` → OK se documentado
  - **Erro silencioso:** Adicionar logging
  - **Falha crítica:** Adicionar retry + alerting
- [ ] **3.7** Implementar retry pattern para:
  - Uploads S3/Supabase
  - Chamadas APIs externas (ElevenLabs, HeyGen)
  - Render jobs
- [ ] **3.8** Adicionar circuit breaker para serviços externos

**Exemplo Before/After:**
```typescript
// ❌ BEFORE (Protótipo)
try {
  await externalAPI.call();
} catch (e) {
  console.error(e);
}

// ✅ AFTER (Profissional)
try {
  await retryWithBackoff(() => externalAPI.call(), {
    maxRetries: 3,
    backoffMs: 1000
  });
} catch (error) {
  const normalized = normalizeError(error);
  logger.error('External API failed after retries', normalized, {
    component: 'APIClient',
    operation: 'externalAPI.call',
    userId: context.userId
  });
  
  if (normalized instanceof RateLimitError) {
    throw new AppError('Service temporarily unavailable', { 
      statusCode: 503,
      retryAfter: normalized.retryAfter 
    });
  }
  
  throw normalized;
}
```

**Critérios de Sucesso:**
- ✅ Zero catches vazios sem justificativa
- ✅ Retry implementado em operações críticas
- ✅ Erros categorizados e logged com contexto

---

### **FASE 4 - Validação & Segurança** (2 dias - Sprint 2)

**Objetivo:** Input validation uniforme e rate limiting em todas as rotas.

#### Dia 8: Zod Schemas Completos
- [ ] **4.1** Auditar rotas API sem validação
- [ ] **4.2** Criar schemas Zod em `lib/validation/schemas/`:
  - `render-job.schema.ts`
  - `analytics.schema.ts`
  - `webhook.schema.ts`
  - `voice-cloning.schema.ts`
- [ ] **4.3** Criar `validateRequest<T>(schema: ZodSchema<T>, data: unknown): T`
- [ ] **4.4** Aplicar validação em todas as rotas POST/PUT/PATCH

#### Dia 9: Rate Limiting & Sanitização
- [ ] **4.5** Implementar rate limiting uniforme (usar `rate-limiter-real.ts`)
- [ ] **4.6** Configurar limites por rota:
  - `/api/render/*`: 10 req/min
  - `/api/analytics/*`: 60 req/min
  - `/api/voice-cloning/*`: 5 req/min
- [ ] **4.7** Sanitizar outputs (prevenir XSS):
  - Escapar HTML em mensagens de erro
  - Validar URLs antes de redirect
- [ ] **4.8** Adicionar CSRF protection (Next.js middleware)

**Critérios de Sucesso:**
- ✅ Todas as rotas API validam input com Zod
- ✅ Rate limiting em 100% das rotas públicas
- ✅ Zero warnings de segurança (npm audit)

---

### **FASE 5 - Observabilidade & Monitoring** (2 dias - Sprint 3)

**Objetivo:** Visibilidade completa do sistema em produção.

#### Dia 10: OpenTelemetry Setup
- [ ] **5.1** Corrigir `lib/observability.ts` (remover `catch {}`)
- [ ] **5.2** Configurar exporters:
  - Jaeger (traces) ou DataDog
  - Prometheus (metrics)
- [ ] **5.3** Instrumentar rotas críticas:
  - Render pipeline (spans por etapa)
  - DB queries (latência)
  - External API calls
- [ ] **5.4** Criar custom metrics:
  - `render_jobs_total{status}`
  - `render_duration_seconds{percentile}`
  - `api_errors_total{route, error_type}`

#### Dia 11: Dashboards & Alerting
- [ ] **5.5** Criar dashboard Grafana:
  - Render queue depth
  - DB connection pool usage
  - API latency (p50, p95, p99)
  - Error rate por rota
- [ ] **5.6** Configurar alertas (PagerDuty/Slack):
  - Error rate > 5% (P1)
  - Render queue > 100 jobs (P2)
  - DB latency > 500ms (P2)
  - Disk usage > 80% (P3)
- [ ] **5.7** Health checks robustos:
  - `/health/liveness` (K8s probe)
  - `/health/readiness` (DB + Redis + Storage)
  - Expandir `scripts/health-check.ts`

**Critérios de Sucesso:**
- ✅ Traces visíveis para 100% dos requests
- ✅ Métricas coletadas (1min granularidade)
- ✅ Alertas testados e funcionando

---

### **FASE 6 - Performance & Otimizações** (3 dias - Sprint 3)

**Objetivo:** Eliminar bottlenecks e melhorar latência.

#### Dia 12: Database Optimization
- [ ] **6.1** Executar `EXPLAIN ANALYZE` em queries lentas
- [ ] **6.2** Adicionar índices:
  - `render_jobs(user_id, status, created_at)`
  - `projects(user_id, updated_at)`
  - `slides(project_id, order_index)`
- [ ] **6.3** Otimizar queries N+1:
  - Usar `.select()` com joins
  - Batch loading com DataLoader
- [ ] **6.4** Configurar connection pooling:
  ```typescript
  // supabase-admin.ts
  const pool = {
    max: 20,
    min: 5,
    idleTimeoutMillis: 30000
  }
  ```

#### Dia 13: Caching Strategy
- [ ] **6.5** Implementar cache layers:
  - **L1 (In-Memory):** Analytics stats (TTL 30s) ✅ Já existe
  - **L2 (Redis):** Session state, user preferences
  - **L3 (CDN):** Assets estáticos, thumbnails
- [ ] **6.6** Adicionar cache headers:
  ```typescript
  // Cache-Control para assets estáticos
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
  
  // Stale-while-revalidate para analytics
  res.setHeader('Cache-Control', 'max-age=60, stale-while-revalidate=300')
  ```
- [ ] **6.7** Implementar cache invalidation strategy

#### Dia 14: Code Splitting & Lazy Loading
- [ ] **6.8** Auditar bundle size: `npm run build -- --analyze`
- [ ] **6.9** Implementar dynamic imports:
  ```typescript
  const VideoEditor = dynamic(() => import('@/components/editor/pro'), {
    loading: () => <Skeleton />,
    ssr: false
  })
  ```
- [ ] **6.10** Otimizar imagens (Next.js Image)
- [ ] **6.11** Remover dead code (tree shaking)

**Critérios de Sucesso:**
- ✅ Queries principais < 100ms (p95)
- ✅ Cache hit rate > 70%
- ✅ Bundle size reduzido em 30%+

---

### **FASE 7 - Testes & Coverage** (3 dias - Sprint 4)

**Objetivo:** Coverage mínimo 80% e CI/CD robusto.

#### Dia 15: Unit Tests Expansion
- [ ] **7.1** Configurar coverage thresholds:
  ```json
  // jest.config.cjs
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 75,
      functions: 80,
      lines: 80
    }
  }
  ```
- [ ] **7.2** Adicionar testes para core logic:
  - `lib/analytics/render-core.ts` ✅ Já existe
  - `lib/pptx/pptx-parser.ts`
  - `lib/queue/render-queue.ts`
  - `lib/errors/*` (novos)
- [ ] **7.3** Reduzir mocks, aumentar integration tests

#### Dia 16: Integration & E2E Tests
- [ ] **7.4** Testes de integração para rotas críticas:
  - `POST /api/render/start` → job criado + queued
  - `GET /api/analytics/render-stats` → dados corretos
  - `POST /api/projects` → RLS funcionando
- [ ] **7.5** E2E com Playwright:
  - Fluxo: Upload PPTX → Editor → Render → Download
  - Fluxo: Login → Dashboard → Analytics
- [ ] **7.6** Contract tests para APIs externas (mock servers)

#### Dia 17: CI/CD Pipeline
- [ ] **7.7** GitHub Actions workflow:
  ```yaml
  # .github/workflows/ci.yml
  - name: Type Check
    run: npm run type-check
  
  - name: Lint
    run: npm run lint
  
  - name: Unit Tests
    run: npm run test:ci
  
  - name: E2E Tests
    run: npm run test:e2e
  
  - name: Coverage Check
    run: |
      npm run test:coverage
      npx codecov
  ```
- [ ] **7.8** Pre-commit hooks (Husky):
  - `lint-staged` (ESLint + Prettier)
  - `type-check` em arquivos modificados
- [ ] **7.9** PR checks obrigatórios:
  - ✅ Tests pass
  - ✅ Coverage ≥ 80%
  - ✅ No type errors
  - ✅ Approved by 1 reviewer

**Critérios de Sucesso:**
- ✅ Coverage global ≥ 80%
- ✅ E2E tests cobrindo 3 fluxos principais
- ✅ CI pipeline < 10min

---

## 📈 Métricas de Sucesso

### Scorecard (Antes → Depois)

| Critério | Atual | Meta | Como Medir |
|----------|-------|------|------------|
| **TypeScript Safety** | 20% | 95% | `npm run audit:any` → 0 erros |
| **Error Handling** | 30% | 90% | Zero catches vazios |
| **Logging** | 40% | 95% | Zero `console.*` em produção |
| **Test Coverage** | 35% | 80% | `npm run test:coverage` |
| **Observability** | 10% | 85% | Traces + Metrics operacionais |
| **Performance** | 60% | 90% | Core Web Vitals + API latency |
| **Security** | 70% | 95% | `npm audit` + Snyk scan |
| **Documentation** | 50% | 80% | JSDoc em 100% funções públicas |

**Score Geral:** 39/100 → **85+/100**

---

## 🚀 Quick Start (Executar Fases)

### Sprint 1 (Dias 1-4)
```powershell
# Criar branch
git checkout -b feat/typescript-strict

# Fase 1
npm run audit:any  # Auditar tipos any
# Editar tsconfig.json, next.config.mjs
npm run type-check  # Validar

# Fase 2
node scripts/migrate-console-to-logger.ts
npm run lint
```

### Sprint 2 (Dias 5-9)
```powershell
git checkout -b feat/error-handling

# Fase 3
# Implementar classes de erro
# Refatorar catches

# Fase 4
# Adicionar validação Zod
# Configurar rate limiting
npm run test:security
```

### Sprint 3 (Dias 10-14)
```powershell
git checkout -b feat/observability

# Fase 5
# Configurar OpenTelemetry
# Setup dashboards

# Fase 6
EXPLAIN ANALYZE queries lentas
# Adicionar índices
npm run build -- --analyze
```

### Sprint 4 (Dias 15-17)
```powershell
git checkout -b feat/testing-cicd

# Fase 7
npm run test:coverage
npm run test:e2e
# Configurar GitHub Actions
```

---

## 📋 Checklist de Deploy em Produção

Antes de fazer deploy, garantir:

- [ ] ✅ `npm run type-check` passa sem erros
- [ ] ✅ `npm run lint` passa sem warnings
- [ ] ✅ `npm run test:ci` com coverage ≥ 80%
- [ ] ✅ `npm audit` sem vulnerabilidades HIGH/CRITICAL
- [ ] ✅ `npm run health` score ≥ 85/100
- [ ] ✅ Environment variables validadas (`npm run validate:env`)
- [ ] ✅ Database migrations aplicadas (`npm run setup:supabase`)
- [ ] ✅ Observability configurada (traces visíveis)
- [ ] ✅ Health checks respondendo (`/health/readiness`)
- [ ] ✅ Alertas configurados e testados
- [ ] ✅ Rollback plan documentado
- [ ] ✅ Smoke tests em staging passando

---

## 🔧 Scripts Auxiliares

Criar os seguintes scripts para automatizar:

### `scripts/migrate-console-to-logger.ts`
```typescript
// Substituir console.* por logger automaticamente
// com AST parsing (ts-morph)
```

### `scripts/audit-error-handling.ts`
```typescript
// Listar todos os try/catch e .catch()
// Categorizar por severidade
```

### `scripts/validate-types.ts`
```typescript
// Verificar ausência de `any` não justificados
// Parte do CI pipeline
```

---

## 📚 Referências

- [TypeScript Strict Mode Guide](https://www.typescriptlang.org/tsconfig#strict)
- [Structured Logging Best Practices](https://www.google.com/search?q=structured+logging+best+practices)
- [OpenTelemetry Node.js](https://opentelemetry.io/docs/instrumentation/js/)
- [Next.js Performance Optimization](https://nextjs.org/docs/app/building-your-application/optimizing)
- [Testing Best Practices (Jest)](https://jestjs.io/docs/tutorial-react)

---

## 🎯 Próximos Passos Imediatos

1. **Revisar este plano** com time técnico
2. **Priorizar fases** (se necessário comprimir timeline)
3. **Criar issues/tasks** no GitHub Projects
4. **Iniciar Fase 1** (TypeScript strict mode)

**Responsável:** Time de Desenvolvimento  
**Reviewers:** Tech Lead + Senior Engineers  
**Status:** 📝 Planejamento → 🚀 Pronto para Execução
