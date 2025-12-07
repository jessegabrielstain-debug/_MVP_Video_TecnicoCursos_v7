# Plano de Arquitetura e Refinamento Final - MVP Vídeos TécnicoCursos v7

Este documento rastreia a implementação das melhorias arquiteturais, de observabilidade e resiliência solicitadas.

## 1. Observabilidade & Operações
- [ ] **Tracing distribuído (OpenTelemetry):** Instrumentar etapas (parse PPTX, enqueue, render frames, FFmpeg).
- [x] **Métricas Prometheus:** Latências, throughput, erros categorizados, uso de recursos. (✅ Implementado em `/api/metrics`)
- [ ] **Alertas (SLO/SLA):** Definir thresholds (ex: p95 render time).
- [x] **Dashboard Operacional:** Consolidar stats + health-check detalhado. (✅ Implementado em `/admin/metrics`)
- [x] **Log Correlation:** Padronizar `traceId`, `jobId`, `userId` e níveis de log. (✅ Implementado via `logger.ts`)

## 2. Resiliência & Fila
- [x] **Backpressure:** Limitar jobs simultâneos (global/user). (✅ Implementado via Rate Limit)
- [x] **Retry Policy Diferenciada:** Estratégia baseada em categoria de erro. (✅ Implementado no Worker)
- [x] **Dead-letter Queue (DLQ):** Para jobs falhados após N tentativas. (✅ Implementado no Worker)
- [ ] **Timeout Configurável:** Baseado na complexidade estimada do job.
- [ ] **Verificação de Recursos:** Checar disco/storage antes de iniciar.

## 3. Arquitetura & Domínio
- [ ] **Diagrama Formal:** C4 ou fluxo detalhado do pipeline.
- [x] **Idempotência:** Evitar render duplicado para mesmo hash. (✅ Implementado em `job-manager.ts`)
- [ ] **Política de Cancelamento:** Handshake worker e limpeza de assets.

## 4. Segurança
- [x] **Rate Limiting:** Por IP e User em rotas críticas. (✅ Implementado em `rate-limit.ts`)
- [x] **Validação PPTX Robusta:** Sanitização profunda e limites. (✅ Implementado em `pptx-processor.ts`)
- [ ] **Scan de Vírus/MIME:** Verificação de uploads.
- [ ] **Rotação de Secrets:** Documentação e scripts.
- [ ] **Hardening Docker:** User não-root, limites.

## 5. Dados & Migrations
- [x] **Schema Versionado:** Migração incremental (ex: drizzle/pg-migrate). (✅ Implementado via `scripts/migrate-db.ts` + `supabase/migrations`)
- [x] **Backup/Restore:** Automatizado com política de retenção. (✅ Implementado via `scripts/backup-db.ts` e `scripts/restore-db.ts`)
- [x] **Revisão de Índices:** Otimização para jobs e analytics. (✅ Implementado em `supabase/migrations/20251130120000_add_indices.sql`)

## 6. Testes
- [ ] **Cobertura Alvo:** >=80% em lógica pura.
- [x] **Testes de Carga:** Locust/k6 para render e analytics. (✅ Setup Artillery criado)
- [x] **Testes E2E:** Playwright/Cypress para fluxo completo. (✅ Setup Playwright criado)
- [ ] **Fuzz Testing:** Parser PPTX.

## 7. Qualidade & Código
- [ ] **Remover `@ts-nocheck`:** Limpeza final.
- [ ] **JSDoc Consistente:** Expandir para queue e parser.
- [ ] **Linter de Complexidade:** Regras de manutenibilidade.
- [ ] **Auditoria de Performance:** React components.

## 8. Frontend
- [ ] **Acessibilidade:** ARIA, foco, contraste.
- [ ] **Estado Offline:** Retry UI.
- [ ] **Suspense/Streaming:** Otimização UX.

## 9. Vídeo / Media Pipeline
- [ ] **Cache de Assets:** Pruning automático.
- [ ] **Ajuste Dinâmico FFmpeg:** Presets baseados em origem/alvo.
- [ ] **Normalização de Áudio:** Loudness.
- [ ] **Validação Final:** `ffprobe` no artefato gerado.

## 10. Custos, DX & Compliance
- [ ] **Métricas de Custo:** Estimativa por minuto.
- [ ] **DX:** Script bootstrap, CLI job inspect.
- [ ] **Compliance:** Retenção, consentimento, licenças.

---

## Próximos Passos Imediatos (Prioridade)

1. **Observabilidade Mínima:** Logging estruturado + traceId + métricas render. (✅ Concluído)
2. **Rate Limiting + Validação PPTX.** (✅ Concluído)
3. **DLQ e Retry Policy.** (✅ Concluído)
4. **Testes E2E e Carga.** (✅ Concluído)
5. **Dashboard Operacional.** (✅ Concluído)
6. **Migrar schema para solução incremental.** (✅ Concluído - Requer setup manual RPC)
7. **Backup/Restore Automatizado.** (✅ Concluído)
8. **Revisão de Índices.** (✅ Concluído)
9. **Remover `@ts-nocheck` e Limpeza Final.** (Próximo passo)
