# API: Video Jobs

Endpoints para gerenciar jobs de renderização de vídeo.

Autenticação: Authorization: Bearer <access_token Supabase>

## Criar job
- POST /api/v1/video-jobs
- Body:
```
{
  "project_id": "uuid",
  "slides": [{ "title": "...", "content": "...", "order_index": 0 }],
  "tts_voice": "opcional",
  "quality": "low|medium|high" (default medium)
}
```
- 201: `{ job: { id,status,project_id,created_at,progress,settings,attempts,duration_ms }, metrics: { validation_ms } }`
- 400, 401, 500

Rate limiting:
- 30 requisições por minuto por usuário. Excedendo o limite, a API retorna 429 com header `Retry-After`.

Observação: o rate limiting é local in-memory por instância. Em ambiente distribuído recomenda-se backend compartilhado (Redis/KV) para consistência.

## Listar jobs do usuário
- GET /api/v1/video-jobs?limit=1..50&status=queued|processing|completed|failed|cancelled
- 200: `{ jobs: [{ id,status,project_id,created_at,progress,settings,attempts,duration_ms }] }`
- 400, 401, 500

## Cancelar job
- POST /api/v1/video-jobs/cancel
- Body: `{ id: "uuid" }`
- Regras: somente dono; status atual em queued|processing
- 200: `{ job: { id,status,project_id,created_at,progress,settings,attempts,duration_ms } }`
- 401, 403, 404, 409, 500

Rate limiting:
- 20 requisições por minuto por usuário. Excedendo o limite, resposta 429 com `Retry-After`.

## Atualizar progresso
- POST /api/v1/video-jobs/progress
- Body: `{ id: "uuid", progress: 0..100, status?: processing|completed|failed }`
- Regras: somente dono; status atual em queued|processing
- 200: `{ job: { id,status,project_id,created_at,progress,settings,attempts,duration_ms } }`
- 401, 403, 404, 409, 500

Comportamento:
- Ao transicionar para `processing`, o campo `started_at` é preenchido automaticamente se ainda estiver vazio.
- Ao transicionar para `completed` ou `failed`, o campo `completed_at` é preenchido automaticamente.
- Quando `completed` e `started_at` existir, `duration_ms` é calculado (diferença entre agora e `started_at`).

Rate limiting:
- 120 atualizações de progresso por minuto por usuário (429 quando excedido, com `Retry-After`).

## Reenfileirar job
- POST /api/v1/video-jobs/requeue
- Body: `{ id: "uuid" }`
- Regras: somente dono; status atual em failed|cancelled
- 200: `{ job: { id,status,project_id,created_at,progress,settings,attempts,duration_ms } }`
- 401, 403, 404, 409, 500

Comportamento:
- Ao reenfileirar, os campos `started_at`, `completed_at`, `duration_ms` e `error_message` são resetados (null). O `progress` volta a 0, e `attempts` é incrementado.

Rate limiting:
- 20 requisições por minuto por usuário (429 quando excedido, com `Retry-After`).
Limite de tentativas:
- Máximo de 5 tentativas (attempts). Ao atingir o limite, retorna 409 com código `MAX_ATTEMPTS_REACHED`.

## Obter job por id
- GET /api/v1/video-jobs/:id
- 200: `{ job: { id,status,project_id,created_at,progress,settings,attempts,duration_ms } }`
- 400, 401, 403, 404, 500

## Notas
- RLS: isolamento por auth.uid() na tabela render_jobs
- Índices recomendados: (user_id, created_at desc), status

# API — POST /api/v1/video-jobs

Cria um job de renderização de vídeo.

- Método: POST
- Autenticação: Supabase Auth (Bearer no header Authorization)
- Body (JSON):
```
{
  "project_id": "<uuid>",
  "slides": [{ "title": "...", "content": "...", "order_index": 0 }],
  "tts_voice": "optional",
  "quality": "low|medium|high"
}
```
- Respostas:
  - 201: `{ job: { id, status, project_id, created_at, progress, settings, attempts, duration_ms }, metrics: { validation_ms } }`
  - 400: `{ code: 'VALIDATION_ERROR', details: [...] }`
  - 401: `{ code: 'UNAUTHORIZED' }`
  - 500: `{ code: 'DB_ERROR' | 'UNEXPECTED' }`

Notas:
- RLS deve associar `user_id` via `auth.uid()`; a rota usa token do Authorization para executar.
- Campo `settings` armazena o resumo de `render_settings` (slides, quality, tts_voice).
- Status inicial do job é `queued`.
- Campo `attempts` inicia em 1 e é incrementado em requeue.
- Campo `duration_ms` é preenchido quando o job atinge status `completed`.

## Estatísticas de jobs
- GET /api/v1/video-jobs/stats
- 200:
```
{
  "totals": { "total_jobs": 42 },
  "by_status": { "queued": 10, "processing": 2, "completed": 25, "failed": 3, "cancelled": 2, "other": 0 },
  "throughput": { "window_minutes": 60, "jobs_completed_last_60m": 5, "jobs_per_min": 0.083 },
  "performance": { "avg_duration_ms": 1234, "p50_ms": 1100, "p90_ms": 2000, "p95_ms": 2500 },
  "metadata": { "cache": "HIT|MISS", "ttl_ms": 30000 }
}
```
- 401, 500

Notas:
- A listagem `GET /api/v1/video-jobs` também utiliza cache in-memory por 15s e retorna o header `X-Cache: HIT|MISS`.

## Métricas de Observabilidade (Admin)
- GET /api/v1/video-jobs/metrics
- **Autenticação**: Requer permissão de administrador (`is_admin() = true`).
- **Cache**: N/A. Retorna dados em tempo real. Headers `Cache-Control: no-store` são enviados.
- **Resposta 200**:
```json
{
  "rate_limit_hits": 15,
  "errors_total": 5,
  "errors_by_code": {
    "DB_ERROR": 3,
    "UNEXPECTED": 2
  },
  "uptime_ms": 3600000
}
```
- **Respostas de Erro**:
  - `401 Unauthorized`: Token de autenticação ausente ou inválido.
  - `403 Forbidden`: O usuário autenticado não é um administrador.
  - `500 Unexpected`: Erro interno no servidor ao buscar as métricas.

**Descrição dos Campos:**
- `rate_limit_hits`: Número total de requisições que atingiram algum dos limites de rate limiting desde o último reinício do servidor.
- `errors_total`: Número total de erros registrados pela API.
- `errors_by_code`: Um objeto que agrupa a contagem de erros por seus códigos internos (ex: `DB_ERROR`, `UNEXPECTED`).
- `uptime_ms`: Tempo em milissegundos que o processo do servidor está no ar.

**Observação**: As métricas são armazenadas em memória e são resetadas a cada reinício da instância do servidor. Para um ambiente de produção distribuído, seria necessário um backend de métricas compartilhado (ex: Prometheus, Datadog).
