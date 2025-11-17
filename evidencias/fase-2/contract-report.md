# Relatório dos Testes de Contrato da API Video Jobs

- **Data de execução:** 14/11/2025, 22:09:49
- **Comando:** `npm run test:contract`
- **Resumo:** 10/12 testes passaram; 1 foram marcados como SKIP.
- **Servidor local:** ativo em http://127.0.0.1:3320
- **Fonte:** `evidencias/fase-2/contract-suite-result.json`

| Teste | Status | Contexto | Tempo |
| --- | --- | --- | --- |
| `video-jobs` | ✅ OK | Validação do payload de criação de vídeo | 465 ms |
| `video-jobs-query` | ✅ OK | Consultas e filtros | 367 ms |
| `video-jobs-cancel` | ✅ OK | Cancelamento de jobs | 351 ms |
| `video-jobs-progress` | ✅ OK | Atualização de progresso | 393 ms |
| `video-jobs-requeue` | ✅ OK | Reenfileirar jobs | 375 ms |
| `video-jobs-id` | ✅ OK | Busca por ID | 359 ms |
| `video-jobs-status` | ✅ OK | Consulta de status | 278 ms |
| `video-jobs-response` | ✅ OK | Estrutura da resposta | 296 ms |
| `video-jobs-stats` | ✅ OK | Estatísticas agregadas (requer servidor) | 9467 ms |
| `video-jobs-list-cache` | ✅ OK | Cache de listagem (requer servidor) | 8349 ms |
| `video-jobs-rate-limit` | ❌ FAIL | Rate limiting (requer servidor) | 101169 ms |
| `video-jobs-metrics` | ⏭️ SKIP | Métricas detalhadas (requer servidor) | 2862 ms |

## Observações
- Esta execução inicializou o servidor Next.js automaticamente para habilitar os cenários dependentes de API.
- Configure um ambiente com servidor (`npm run dev`) para validar cenários completos de cache, rate limiting e métricas.
