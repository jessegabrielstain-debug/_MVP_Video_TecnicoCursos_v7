# Sprint 2 — Observabilidade (COMPLETO)

Data: 17/11/2025  
Status: ✅ Concluído

## Entregas
- Sentry integrado (cliente/servidor) com amostragem de traces 10%.
- Rota de teste de erro: `/api/_errors/test` (500 com captura no Sentry).
- Métricas BullMQ via `/api/queue/metrics` com fallback quando sem Redis.
- Healthcheck atualizado para usar BullMQ quando Redis disponível.
- Documentação `docs/observabilidade-fase-2-implementacao.md`.

## Como validar
- Definir `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` e reiniciar `npm run dev`.
- Chamar `/api/_errors/test` e verificar evento no Sentry.
- Se `REDIS_URL` presente e fila existir, `/api/queue/metrics` deve retornar contagens reais.
- Caso contrário, retorna `provider: none` e métricas zeradas, sem erro.

## Observações
- Upload de sourcemaps e release Sentry pode ser adicionado ao pipeline futuramente (opcional).
- Integração BullMQ é lazy/dinâmica, não quebra ambientes sem Redis.
