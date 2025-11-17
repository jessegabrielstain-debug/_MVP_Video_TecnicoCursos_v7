# ADR 0002: Estados e Transições de Render Jobs

Data: 2025-11-12

## Contexto
O sistema de renderização orquestra jobs por usuário. Precisamos padronizar estados e transições para garantir previsibilidade e validação consistente.

## Decisão
Estados permitidos: `queued`, `processing`, `completed`, `failed`, `cancelled`.

Transições válidas:
- `queued` -> `processing`
- `processing` -> `completed` | `failed` | `cancelled`
- `failed` -> `queued` (requeue)
- `cancelled` -> `queued` (requeue)

Operações expostas:
- Criar (`queued`), Listar, Cancelar (`queued|processing`), Atualizar progresso (progress 0..100; opcional status `processing|completed|failed`), Reenfileirar (`failed|cancelled` -> `queued`).

## Consequências
- APIs validam e retornam 409 quando a transição é inválida.
- Índices em `render_jobs(user_id, created_at)` e `status` otimizam listagem e filtros.
- Futuras automações podem acoplar uma fila/worker respeitando este contrato.