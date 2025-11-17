# Fase 2 — Observabilidade (Sentry + BullMQ)

## Variáveis de Ambiente

Adicionar no `.env.local` em `estudio_ia_videos/`:

```
# Sentry
SENTRY_DSN= <dsn servidor>
NEXT_PUBLIC_SENTRY_DSN= <dsn cliente>
SENTRY_TRACES_SAMPLE_RATE=0.1
SENTRY_PROFILES_SAMPLE_RATE=0.1

# Redis / BullMQ
REDIS_URL= <redis://user:pass@host:port>
```

## Arquivos criados

- `estudio_ia_videos/sentry.client.config.ts`
- `estudio_ia_videos/sentry.server.config.ts`
- `estudio_ia_videos/instrumentation.ts`
- `estudio_ia_videos/app/api/_errors/test/route.ts`
- `estudio_ia_videos/app/api/queue/metrics/route.ts`
- `estudio_ia_videos/app/api/health/route.ts` (atualizado — integra BullMQ com fallback)

## Como validar localmente

1) Rodar server dev (mesmo com build quebrado, rotas de API devem responder):
```pwsh
cd estudio_ia_videos
npm run dev
```

2) Testar Sentry (gera erro proposital):
```pwsh
Invoke-WebRequest http://localhost:3000/api/_errors/test -UseBasicParsing | Select-Object StatusCode, Content
```
Esperado: `StatusCode=500` e evento recebido no Sentry.

3) Testar métricas de fila (sem Redis → fallback):
```pwsh
Invoke-WebRequest http://localhost:3000/api/queue/metrics -UseBasicParsing | Select-Object StatusCode, Content
```
Esperado: `ok:true`, `provider:"none"`, `waiting:0`.

4) Testar health com BullMQ (se `REDIS_URL` setado):
```pwsh
Invoke-WebRequest http://localhost:3000/api/health -UseBasicParsing | Select-Object StatusCode, Content
```
Esperado: `status: healthy|warning` e campos `waiting/active` > 0 se houver jobs.

## Notas
- Sentry só ativa se `SENTRY_DSN`/`NEXT_PUBLIC_SENTRY_DSN` estiverem definidos.
- BullMQ é carregado dinamicamente; sem Redis, as rotas retornam `warning` ou `provider: none`.
- Upload de sourcemaps pode ser integrado ao CI depois com token `SENTRY_AUTH_TOKEN`.
