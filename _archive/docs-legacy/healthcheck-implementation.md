# Healthcheck Endpoint — Implementação

**Endpoint**: `GET /api/health`  
**Autenticação**: Público (sem token)  
**Uso**: Vercel health checks, UptimeRobot, smoke tests

---

## Response Schema

### Success (200 OK)
```json
{
  "status": "healthy",
  "timestamp": "2025-11-16T23:59:59.999Z",
  "checks": {
    "database": { "status": "ok", "latency_ms": 12 },
    "redis": { "status": "ok", "latency_ms": 3 },
    "queue": { "status": "ok", "waiting": 5, "active": 2 }
  }
}
```

### Degraded (503 Service Unavailable)
```json
{
  "status": "unhealthy",
  "timestamp": "2025-11-16T23:59:59.999Z",
  "checks": {
    "database": { "status": "error", "message": "Connection timeout" },
    "redis": { "status": "ok", "latency_ms": 4 },
    "queue": { "status": "warning", "waiting": 150, "message": "Queue backed up" }
  }
}
```

---

## Implementação

### 1. Criar arquivo de rota
**Caminho**: `estudio_ia_videos/app/api/health/route.ts`

```typescript
import { NextResponse } from 'next/server'
import { getSupabaseForRequest } from '~lib/services/supabase-server'
import { createRedisClient } from '~lib/services/redis'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type CheckStatus = 'ok' | 'warning' | 'error'
interface Check {
  status: CheckStatus
  latency_ms?: number
  message?: string
  [key: string]: unknown
}

async function checkDatabase(): Promise<Check> {
  const start = Date.now()
  try {
    const supabase = getSupabaseForRequest(new Request('http://localhost'))
    const { error } = await supabase.from('render_jobs').select('id').limit(1).single()
    const latency_ms = Date.now() - start
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows (ok)
      return { status: 'error', message: error.message, latency_ms }
    }
    return { status: 'ok', latency_ms }
  } catch (err) {
    return { status: 'error', message: (err as Error).message, latency_ms: Date.now() - start }
  }
}

async function checkRedis(): Promise<Check> {
  const start = Date.now()
  try {
    const redis = createRedisClient()
    await redis.set('healthcheck', Date.now().toString(), 'EX', 10)
    const latency_ms = Date.now() - start
    return { status: 'ok', latency_ms }
  } catch (err) {
    return { status: 'error', message: (err as Error).message, latency_ms: Date.now() - start }
  }
}

async function checkQueue(): Promise<Check> {
  try {
    // Placeholder: integrar com BullMQ quando disponível
    // const queue = getQueue('render')
    // const waiting = await queue.getWaitingCount()
    // const active = await queue.getActiveCount()
    // if (waiting > 100) return { status: 'warning', waiting, active, message: 'Queue backed up' }
    // return { status: 'ok', waiting, active }
    return { status: 'ok', waiting: 0, active: 0 }
  } catch (err) {
    return { status: 'error', message: (err as Error).message }
  }
}

export async function GET() {
  const timestamp = new Date().toISOString()
  
  const [database, redis, queue] = await Promise.all([
    checkDatabase(),
    checkRedis(),
    checkQueue()
  ])

  const checks = { database, redis, queue }
  const hasError = Object.values(checks).some(c => c.status === 'error')
  const status = hasError ? 'unhealthy' : 'healthy'
  const httpStatus = hasError ? 503 : 200

  return NextResponse.json({ status, timestamp, checks }, { 
    status: httpStatus,
    headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
  })
}
```

### 2. Atualizar tsconfig para incluir nova rota
Já incluído via padrão glob `app/api/**/*.ts`.

### 3. Testar localmente
```pwsh
# Terminal 1: rodar dev server
cd estudio_ia_videos/app
npm run dev

# Terminal 2: testar endpoint
curl http://localhost:3000/api/health
```

### 4. Configurar Vercel Health Checks
No dashboard Vercel:
- Settings → Health Checks
- Path: `/api/health`
- Interval: 60s
- Timeout: 10s

### 5. Configurar UptimeRobot (externo)
- Monitor Type: HTTP(s)
- URL: `https://seu-dominio.vercel.app/api/health`
- Interval: 5 min
- Alert contacts: Slack webhook + email

---

## Smoke Tests (Playwright)

```typescript
// e2e/health.spec.ts
import { test, expect } from '@playwright/test'

test('healthcheck returns 200 and healthy status', async ({ request }) => {
  const response = await request.get('/api/health')
  expect(response.status()).toBe(200)
  
  const body = await response.json()
  expect(body.status).toBe('healthy')
  expect(body.checks.database.status).toBe('ok')
  expect(body.checks.redis.status).toBe('ok')
})
```

---

## Alertas

### Slack Webhook (unhealthy)
Configurar em workflow GitHub Actions ou Vercel:
```yaml
- name: Check Health
  run: |
    HEALTH=$(curl -s https://seu-dominio.vercel.app/api/health | jq -r '.status')
    if [ "$HEALTH" != "healthy" ]; then
      curl -X POST ${{ secrets.SLACK_WEBHOOK }} \
        -H 'Content-Type: application/json' \
        -d '{"text":"⚠️ Healthcheck FAILED: '$HEALTH'"}'
    fi
```

---

## Manutenção

- Adicionar checks para novos serviços (S3, TTS API, etc.)
- Incluir versão do app no response (`version: process.env.VERCEL_GIT_COMMIT_SHA`)
- Expandir métricas de fila quando BullMQ estiver integrado
