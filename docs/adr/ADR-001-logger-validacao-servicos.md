# ADR-001 — Logger Centralizado, Validações Zod e Serviços (Supabase/Redis)

Data: 16/11/2025
Status: Aceito
Decisores: Tech Lead + Equipe Core

## Contexto
O projeto exigia padronização de observabilidade (logs), validação de entrada robusta e centralização de serviços para reduzir acoplamento e facilitar testes/métricas. Havia logs espalhados com `console.*`, validações inconsistentes e acessos diretos a Redis/clients fora de uma camada única.

## Decisão
1) Logger centralizado
- Reexport do singleton de `scripts/logger.ts` em `lib/services/logger.ts`.
- Substituição de `console.*` por `logger` em rotas core (`video-jobs/*`).
- Formato JSON Lines com rotação (10MB, 5 arquivos) e impressão human-friendly no console.

2) Validações com Zod
- Schemas base em `lib/validation/schemas.ts` (inputs, cancel/retry, stats/metrics, analytics).
- Compatibilidade retroativa em handlers (`cancel`/`requeue` aceitando `{id}` e `{jobId}`), normalizando para `{ id }`.
- Query de `stats` aceita `period` (`24h|7d|30d|all`) com fallback de 60min.

3) Serviços centralizados
- Supabase: `lib/services/supabase-{client,server}.ts` (mantidos).
- Redis: `lib/services/redis.ts` com fallback in-memory (interface mínima) quando `ioredis` não estiver disponível.

## Alternativas Consideradas
- Manter `console.*` e logs ad-hoc (rejeitada: baixa padronização e custo de triagem).
- Validar via DTOs manuais (rejeitada: mais código repetido, menos segurança).
- Acesso direto ao Redis em cada módulo (rejeitada: dificulta troca/fallback e testes).

## Consequências
- Mais previsibilidade em logs e facilitação de troubleshooting.
- Redução de regressões de contrato ao adotar Zod com compatibilidade.
- Camada de serviços pronta para instrumentação futura (BullMQ, Sentry) sem quebrar APIs internas.

## Adoção e Escopo
- Aplicada nas rotas `app/api/v1/video-jobs/**` (POST/GET list, [id], cancel, progress, requeue, stats).
- Métricas admin (`video-jobs/metrics`) permanecem com validação mínima (somente auth/admin) por não receber payload complexo.

## Referências
- `lib/services/logger.ts`, `scripts/logger.ts`
- `lib/validation/schemas.ts`
- `lib/services/redis.ts`
- `estudio_ia_videos/app/api/v1/video-jobs/*`
