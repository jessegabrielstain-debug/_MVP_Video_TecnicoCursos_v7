# Migração de Payloads — video-jobs (jobId → id)

Data: 16/11/2025
Status: Compatível (sem breaking change)

## Contexto
Para padronização dos handlers e schemas Zod, unificamos a chave de identificação do job para `id`. Alguns clientes legados enviavam `{ jobId: string }`. Os handlers agora aceitam ambos e normalizam para `{ id }` internamente.

## Endpoints Impactados
- `POST /api/v1/video-jobs/cancel`
- `POST /api/v1/video-jobs/requeue`

## Regras de Compatibilidade
- Requisições com `{"id": "<uuid>"}`: suportado (recomendado).
- Requisições com `{"jobId": "<uuid>"}`: suportado (compatibilidade retroativa), normalizado para `id` no servidor.

## Ação Recomendada
- Atualize clientes para enviar `id` em vez de `jobId`.
- Não há mudança necessária no response.

## Linha do Tempo
- 16/11/2025: compatibilidade liberada (sem deprecar `jobId`).
- A definir: anúncio de depreciação de `jobId` com período mínimo de 60 dias antes da remoção.

## Referências
- `lib/handlers/video-jobs-cancel.ts`
- `lib/handlers/video-jobs-requeue.ts`
- `docs/adr/ADR-001-logger-validacao-servicos.md`
