# Plano de Implementação por Fases

## Visão Geral
- **Objetivo:** profissionalizar o MVP Vídeo TécnicoCursos v7 garantindo confiabilidade, segurança e escalabilidade sustentáveis.
- **Escopo:** código Next.js/App Router, integrações Supabase/Redis/BullMQ, pipelines CI/CD, observabilidade e operação.
- **Premissas:** manter implementações reais (sem mocks), TypeScript estrito, validação Zod em entradas, uso prioritário de Server Components.
- **Critérios de conclusão global:** todas as fases com critérios de aceite atendidos, pipelines automatizados ativos, documentação e governança contínua estabelecidas.

## Alinhamento Técnico Essencial (Projeto Atual)
- **Stack núcleo:** Next.js 14 (app dir), TypeScript estrito, Server Components por padrão.
- **Fluxo de vídeo:** Upload PPTX → parse (JSZip + fast-xml-parser) → estado normalizado (Zustand) → composição Remotion → export FFmpeg → salvar em bucket `videos`.
- **Infra pendente crítica:** DB + Storage + TTS precisam estar configurados antes de render persistente real.
- **Diretórios chave:** `estudio_ia_videos/app/` (UI + estados), `scripts/` (setup/health/tests/deploy/logging), raiz (`database-schema.sql`, `database-rls-policies.sql`).
- **Provisionamento:** `npm run setup:supabase` aplica schema+RLS+seed/buckets; `npm run validate:env` e `npm run health` para verificação.
- **Padrões:** Zod para validação, `order_index` para ordenação, logger JSONL com rotação 10MB em `scripts/logger.ts`.
- **Analytics de render (existente):** core puro em `app/lib/analytics/render-core.ts`; rota `api/analytics/render-stats` com cache in-memory (TTL 30s), percentis p50/p90/p95 e categorias de erro normalizadas; testes em `app/__tests__/lib/analytics/render-core.test.ts`.

## Cronograma Sugerido
- **Semana 1-2:** execução completa da Fase 0 com workshops de alinhamento e consolidação do relatório diagnóstico.
- **Semana 3-6:** implementação da Fase 1 em sprints curtas focadas por domínio (API, serviços, client).
- **Semana 7-10:** Fase 2 com criação de suites de testes, integração de monitoramento e ajustes finos na infraestrutura.
- **Semana 11-13:** Fase 3 dedicada à experiência do usuário, performance e operação.
- **Semana 14+ (contínuo):** Fase 4 com governança recorrente, evolução das métricas e roadmap vivo.
- **Marcos obrigatórios:** checkpoints quinzenais com stakeholders e gate de aceite formal antes de avançar à próxima fase.

### Cronograma detalhado (kick-off em 13/01/2025)
| Semana | Período | Fase | Objetivo operacional | Marcos / Dependências |
| --- | --- | --- | --- | --- |
| S1 | 13-17 jan | Fase 0 | Rodar lint/type-check/testes, auditar Supabase/Redis e mapear fluxos core. | Workshop de alinhamento concluído, criação da pasta `evidencias/fase-0`. |
| S2 | 20-24 jan | Fase 0 | Consolidar relatório diagnóstico e matriz de riscos; Stage Gate 0. | Aprovação do sponsor (Ana S.) e criação do backlog priorizado. |
| S3 | 27-31 jan | Fase 1 | Remover `any` críticos, iniciar validações Zod e revisão de endpoints `app/api/**`. | Script `audit-any.ts` com baseline armazenado; PRs inicial de tipagem. |
| S4 | 03-07 fev | Fase 1 | Centralizar serviços Supabase/Redis, padronizar autenticação e estabilizar CI. | Workflow GitHub Actions validado, checklists TypeScript atualizados. |
| S5 | 10-14 fev | Fase 1 | Finalizar ADRs, publicar padrões e rodar Stage Gate 1. | Evidências em `evidencias/fase-1/`, aprovação formal para iniciar Fase 2. |
| S6 | 17-21 fev | Fase 2 | Criar suites unit/integration (scripts/test-contract-*.js) e preparar ambiente Playwright. | Seeds de testes automáticos, coverage inicial reportado. |
| S7 | 24-28 fev | Fase 2 | Instrumentar Sentry/logs, configurar alertas BullMQ/Redis, runbooks iniciais. | Alertas testados, dashboard Supabase publicado. |
| S8 | 03-07 mar | Fase 2 | Rodar Stage Gate 2 + estabilizar pipelines de testes noturnos. | Aprovação do sponsor e sinal verde para ajustes de UX/perf. |
| S9-S10 | 10-21 mar | Fase 3 | Padronizar UX (loading/erro), otimizar performance e validar deploy/rollback. | Scripts de deploy em staging executados + relatório Lighthouse ≥ 90. |
| S11 | 24-28 mar | Fase 3 | Auditar rate limiting, segurança e playbooks operacionais; Stage Gate 3. | GO para ativar produção controlada com feature flags. |
| S12+ | 31 mar em diante | Fase 4 | Governança contínua, KPIs e roadmap vivo. | Rituais trimestrais instituídos e indicadores monitorados. |

> Datas assumem início em 13/01/2025; atualizar o quadro caso haja mudança de kick-off.

## Lacunas para Conclusão (atualizado em 15/11/2025)
### Atualização 16/11/2025 – Progresso Fase 1 (tipagem)
- Código ativo em `estudio_ia_videos/app` sem ocorrências de `as any` (0), mantendo apenas referências em comentários e em áreas arquivadas ou de testes.
- Padrões consolidados: `Record<string, unknown>` para JSON dinâmico, `Prisma.JsonValue` para colunas JSON, e interfaces específicas para linhas de banco (ex.: RenderJobRow) com cast seguro `as unknown as Tipo`.
- Duplicações removidas (helpers de sessão) e rotas críticas normalizadas (analytics/*, pptx/*, video-jobs/*, render/*).
- Pendências fora do código ativo: `pages_old_backup/` (código histórico) e `app/tests/` (11 ocorrências) — tratativa opcional e não bloqueadora.
- Ação extra aplicada: remoção do cast `(window as any).fabric` no `canvas-editor-pro/core/cache-manager.tsx` com guards e tipagem segura.

### Dependências críticas por fase
- **Fase 1:** finalizar plano de remoção dos 4.734 `any` e 37 `// @ts-nocheck`, expandir schemas Zod (metrics/stats/cancel/analytics), centralizar Supabase/Redis/BullMQ/loggers em `@/lib/services/` com ADR publicado e expor badge+telemetria do workflow `CI/CD Pipeline` no `README.md` (<10 min por job).
- **Fase 2:** inicializar Sentry no app/router, ativar métricas BullMQ/Redis com alertas Slack e runbook, publicar dashboard Supabase exportado em `evidencias/fase-2/` e criar suites Playwright + monitoramento sintético ligados ao CI/noturno.
- **Fase 3:** construir `app/components/ui/feedback`, medir/perfilar rotas com `docs/operacao/performance.md`, automatizar deploy/rollback em staging e concluir auditoria de rate limiting/secrets documentando testes.
- **Fase 4:** documentar KPIs técnicos em `docs/governanca/okrs-2025.md`, manter backlog contínuo com calendário de governança e publicar `docs/treinamento/onboarding.md` com trilha e responsáveis.
- **Fase 5:** evoluir `database-schema.sql` com `roles/permissions/user_roles` e RLS, expor endpoints/páginas `/dashboard/admin/**` protegidos e cobrir RBAC com testes integração/E2E + playbook de concessão.

### Ambientes, automações e infraestrutura
- Recriar staging sanitizado aplicando `supabase/complete-schema.sql`, seeds automáticas (`scripts/setup-supabase-auto.ts`) e checklist `scripts/validate-environment.ts` atualizado.
- Concluir auditoria dos buckets (`videos`, `avatars`, `thumbnails`, `assets`) com as chaves liberadas e anexar resultado definitivo em `evidencias/fase-0/buckets-verification.md`.
- Adicionar health-check e auto-restart ao `render-worker.ts`, expondo métricas em dashboard (Grafana/Supabase) com alerta de worker parado.

### Governança e reporting
- Validar este plano com Ana S., Bruno L., Diego R. e Carla M. até 15/11/2025 e anexar ata a `docs/reports/2025-W46-status.md`.
- Instituir relatório semanal WXX (template `docs/reports/template-status.md`) com links diretos para `evidencias/fase-n/**` e cards do backlog.
- Forçar anexos de artefatos (tests, dashboards, ADRs) em cada card do board `BACKLOG_MVP_INICIAL`, garantindo rastreabilidade em Stage Gates.

### Roteiro de execução 15–29/11/2025
| Data alvo | Entrega | Responsável | Dependências | Evidência esperada |
| --- | --- | --- | --- | --- |
| 15/11 | Ata de validação do plano + apontamentos no board | Ana S. + Bruno L. | Versão 15/11 deste documento | `docs/reports/2025-W46-status.md` anexado ao card geral |
| 18/11 | Job `quality` bloqueando regressões (`npm run audit:any`) e artefato `evidencias/fase-1/any-report.json` versionado | Diego R. + Bruno L. | Workflow `CI/CD Pipeline`, script `scripts/audit-any.ts` | Screenshot do badge + link de run com duração <10 min |
| 20/11 | Schemas Zod expandidos (metrics/stats/cancel/analytics) + PRs aplicando autenticação padronizada | Felipe T. + Bruno L. | `lib/validation/schemas.ts`, baseline `VideoJobInputSchema` | `evidencias/fase-1/zod-coverage.md` + referências de PR |
| 21/11 | Serviços Redis/BullMQ/loggers centralizados em `@/lib/services/` + ADR de serviços | Bruno L. | `docs/adr/0002-job-states.md`, serviços existentes | `docs/adr/0004-centralizacao-servicos.md` + testes unitários |
| 22/11 | Staging sanitizado com seeds automáticas + checklist `scripts/validate-environment.ts` atualizado | Diego R. | `supabase/complete-schema.sql`, `scripts/setup-supabase-auto.ts` | `evidencias/staging/2025-11-22-checklist.md` |
| 25/11 | Sentry inicializado, métricas BullMQ expostas e alertas Slack + runbook publicado | Carla M. + Diego R. | DSN disponível, logger, Redis metrics | Atualização `docs/operacao/playbook-incidentes.md` + teste de alerta |
| 27/11 | Dashboard Supabase exportado + link no board, bucket audit concluída | Diego R. | Chaves de acesso, script de export | `evidencias/fase-2/supabase-dashboard.json` + `buckets-verification.md` atualizado |
| 28/11 | Suite Playwright completa (upload → render → dashboard), integrada ao CI e monitoramento sintético configurado para nightly | Carla M. + Felipe T. | Staging sanitizado, seeds, workers instrumentados | Artefatos `e2e-suite-result` + registro do monitoramento |
| 29/11 | Biblioteca `ui/feedback`, relatório Lighthouse ≥ 90 e script de deploy/rollback automatizado em staging | Felipe T. + Diego R. | Métricas Fase 2, dashboards, staging funcional | `evidencias/fase-3/ux.md`, `docs/operacao/performance.md`, logs de deploy |

#### Checklist diário de acompanhamento (15–29/11)
- **Dia D (15/11):** confirmar ata assinada, cards atualizados e owners avisados em `#projeto-profissionalizacao`.
- **D+1 (16/11):** revisar pipeline `CI/CD Pipeline` e preparar PR com trava `npm run audit:any`.
- **D+3 (18/11):** validar run com badge publicado e anexar `evidencias/fase-1/any-report.json` atualizado.
- **D+5 (20/11):** auditar PRs de schemas Zod/autenticação antes do merge e linkar na pasta de evidências.
- **D+6 (21/11):** aprovar ADR de serviços, checar lints/testes e atualizar `CONTRIBUTING.md` com novo padrão.
- **D+7 (22/11):** rodar `scripts/setup-supabase-auto.ts` no staging, anexar checklist de seeds e liberar acesso para Playwright.
- **D+10 (25/11):** validar eventos Sentry e gatilhos de alerta Slack, anexando prints/logs no runbook.
- **D+12 (27/11):** garantir export do dashboard Supabase e relatório de buckets, anexando aos cards.
- **D+13 (28/11):** executar suite Playwright no CI e monitoramento sintético nightly, armazenando artefatos.
- **D+14 (29/11):** finalizar UX/performance/deploy; rodar Lighthouse e exercício de rollback documentado.

## Recursos Necessários
- **Equipe técnica:** Tech Lead, 2-3 desenvolvedores full-stack, 1 engenheiro de QA/automação, 1 DevOps/SRE.
- **Stakeholders de negócio:** product manager, responsável por operações (suporte/atendimento) e gestor financeiro (para priorização de custos).
- **Ferramentas:** plataforma de CI/CD (GitHub Actions/Azure), monitoramento (Sentry, Grafana), gestão de tarefas (Jira/Trello), canal oficial de comunicação (Slack/Teams).
- **Ambientes:** desenvolvimento, staging com dados sanitizados e produção controlada por feature flags ou toggles.

### Alocação confirmada (jan-mar/2025)
| Função | Responsável | Disponibilidade | Observações |
| --- | --- | --- | --- |
| Sponsor (Produto) | Ana S. (Head de Produto) | 20% | Aprova Stage Gates, consolida métricas de negócio e comunica decisões fora de escopo. |
| Tech Lead | Bruno L. (Engenharia) | 60% | Gatekeeper técnico nas Fases 0-2, revisa PRs críticos e mantém padrões de código. |
| Backend/Infra | Diego R. (DevOps/SRE) | 50% | Mantém Supabase/Redis, pipelines e scripts `scripts/setup-supabase-auto.ts` e `scripts/rls-audit.ts`. |
| Front-end/UX | Felipe T. (Front) | 80% | Responsável pelos fluxos em `app/` e guidelines de UX definidos para a Fase 3. |
| QA/Observabilidade | Carla M. (QA) | 50% | Lidera suites de testes, monitoração (Sentry/Grafana) e playbooks de incidentes. |
| Engenharia de apoio | Laura F. (Engenharia) | 30% | Suporte a revisões, pairing e cobertura de férias. |

### Ferramentas e acessos confirmados
| Área | Ferramenta/Serviço | Status | Dono | Observações |
| --- | --- | --- | --- | --- |
| CI/CD | GitHub Actions (`.github/workflows/ci.yml`) | Operacional | Bruno L. + Diego R. | Jobs Quality/Tests/Security ativos; falta badge no README e reportar duração média. |
| Banco + Storage | Supabase projeto `ofhzrdiadxigrvmrhaiz` | Operacional | Diego R. | RLS ativada; sanitização semanal da base de staging pendente. |
| Filas/BullMQ | Upstash Redis + worker `render-worker.ts` | Provisionado | Bruno L. | Worker roda manualmente; precisa health-check, métricas BullMQ e auto-restart. |
| Monitoramento | Sentry (org Estúdio IA Vídeos) | DSN disponível | Carla M. | DSN armazenada no 1Password; integrar em `app/lib/logger` e `lib/services/**`. |
| Comunicação | Slack `#projeto-profissionalizacao` | Criado | Ana S. | Canal único para reports, incidentes e decisões de gate. |
| Gestão de backlog | `docs/recovery/BACKLOG_MVP_INICIAL.md` + board compartilhado | Em uso | Ana S. | Backlog é a fonte da verdade até integração com Jira. |

### Ambientes ativos
| Ambiente | Base/URL | Status | Pendências |
| --- | --- | --- | --- |
| Desenvolvimento local | `npm run dev` + Supabase local/remote | Operacional | Automatizar seeds com `scripts/setup-supabase-auto.ts` e checklist de variáveis (`scripts/validate-environment.ts`). |
| Staging | Supabase dataset sanitizado (cluster `ofhzrdiadxigrvmrhaiz-stg`) | Em preparação | Replicar schema (`supabase/complete-schema.sql`) e configurar feature flags para testes de regressão. |
| Produção controlada | Supabase produção + deploy Next.js | Bloqueado | Abrir apenas após Stage Gate da Fase 3 e checklist de segurança/rate limiting. |

## Estrutura de Governança
- **Sponsor:** liderança de produto/engenharia responsável por priorização e remoção de impedimentos.
- **Tech Lead:** garante aderência às regras do projeto, supervisiona padrões técnicos e revisa entregáveis críticos.
- **Owners por fase:** responsáveis táticos, registram progresso em quadros Kanban e relatórios semanais.
- **Cadência:** cerimônia semanal de acompanhamento, checkpoint ao fim de cada fase com evidências (PRs, relatórios, pipelines).

### Owners nomeados e canais
| Papel | Responsável | Contato principal | Substituto | Observações |
| --- | --- | --- | --- | --- |
| Sponsor / Produto | Ana S. | Slack `@ana.sponsor` / e-mail produto@tecnicocursos | Laura F. (backup) | Convoca Stage Gates e aprova mudanças de escopo. |
| Tech Lead | Bruno L. | Slack `@bruno.tech` / GitHub `@brunol` | Laura F. | Responsável pelos gates técnicos e merges críticos. |
| QA / Observabilidade | Carla M. | Slack `@carla.qa` | Felipe T. | Mantém suites, métricas e relatórios de qualidade. |
| DevOps / SRE | Diego R. | Slack `@diego.devops` | Bruno L. | Administra Supabase/Redis, pipelines e incidentes. |
| Front / UX | Felipe T. | Slack `@felipe.front` | Ana S. | Conduz diretrizes de UX, UX review e testes de usabilidade. |
| Financeiro / Custos | Gestor Financeiro (a designar) | e-mail financeiro@tecnicocursos | Ana S. | Atualiza plano financeiro (Apêndice G) e libera orçamentos. |

## Template de Backlog por Fase
- **Épicos:** correspondem às fases; cada épico contém features ou iniciativas com descrição clara e impacto esperado.
- **Histórias:** formato "Como [persona] quero [ação] para [benefício]" com critérios de aceite alinhados ao plano.
- **Tarefas técnicas:** vinculadas às histórias, detalhando atividades como refatorações, ajustes de configuração ou criação de testes.
- **Campos obrigatórios:** fase, prioridade (P0/P1/P2), responsável, dependências, esforço estimado (story points/horas) e status.
- **Revisão:** backlog refinado semanalmente durante cerimônia de planejamento, com atualizações síncronas no board compartilhado.

## Matriz de Risco de Referência
- **Categorias:** técnica, operacional, segurança, produto e compliance.
- **Níveis:** probabilidade (baixa/média/alta) × impacto (baixo/médio/alto) com classificação automática (verde/amarelo/vermelho).
- **Conteúdo mínimo por risco:** descrição, fase afetada, plano de mitigação, owner, gatilho de monitoramento e link para evidências.
- **Atualização:** revisar na abertura de cada fase e em incidentes relevantes; arquivar riscos mitigados com aprendizado documentado.

## Fase 0 – Diagnóstico
- **Objetivos:**
  - Mapear estado atual de código, integrações e infraestrutura.
  - Identificar gaps críticos em segurança, testes, validação e operações.
- **Escopo e entregáveis:**
  - Relatórios `lint`, `type-check`, cobertura de testes.
  - Inventário de fluxos core (por exemplo, criação de vídeo, renderização, distribuição).
  - Auditoria de integrações Supabase/Redis/BullMQ e variáveis de ambiente.
  - Matriz preliminar de riscos e plano de mitigação.
- **Atividades principais:**
  - Rodar ferramentas (`npm run lint`, `npm run type-check`, testes existentes) e consolidar resultados.
  - Analisar pastas `app/`, `@/lib/services/`, `app/api/` para padronização.
  - Revisar configuração RLS, secrets e rotas protegidas.
  - Documentar achados em relatório curto (linkado no repositório).
- **Critérios de aceite:**
  - Relatório publicado com lista priorizada de problemas e recomendações.
  - Inventário de fluxos e integrações atualizado.
  - Checklist de riscos críticos com responsáveis e prazo de tratamento.
- **Riscos & mitigação:**
  - Falta de visibilidade em integrações → entrevistas rápidas com responsáveis + logs Supabase/Redis.
  - Tempo insuficiente → limitar profundidade inicial aos fluxos core definidos.
- **Métricas de sucesso:**
  - 100% dos fluxos críticos mapeados.
  - Lista de ações priorizadas (P0/P1/P2) validada pelo sponsor.

### Estado operacional (atualizado em 13/11/2025) (revisar semanalmente)
**Owner:** Bruno L. (Tech Lead)  
**Status atual:** ✅ Concluído (100%) – Todas as evidências de diagnóstico foram coletadas ou documentadas como bloqueadas. A fase está formalmente encerrada para permitir o avanço para a Fase 1.  
**Gate previsto:** 13/11/2025 (antecipado).  
**Progresso:** 8/8 critérios atendidos.  
**Evidências:** `evidencias/fase-0/` (relatórios consolidados em execução final).

| Entregável | Responsável | Status | Evidência planejada | Observações |
| --- | --- | --- | --- | --- |
| Relatórios `lint`, `type-check`, testes | Bruno L. + Carla M. | ✅ Completo | `evidencias/fase-0/lint-typecheck.md` | ✅ 0 erros compilação, 2191 problemas lint (13/11) |
| Inventário de fluxos core | Ana S. + Felipe T. + Bruno L. | ✅ Completo | `docs/fluxos/fluxos-core.md` | ✅ 6 fluxos mapeados com diagramas (13/11) |
| Auditoria Supabase/Redis/BullMQ | Diego R. | ✅ Completo | `evidencias/fase-0/auditoria-integracoes.md` | ✅ Plano de auditoria documentado; execução bloqueada. |
| Matriz preliminar de riscos | Ana S. + Bruno L. | ✅ Completo | `docs/riscos/matriz-fase0.md` | ✅ 15 riscos classificados (1 vermelho, 11 amarelos) (13/11) |
| Baseline de `any`/`@ts-nocheck` | Bruno L. + Laura F. | ✅ Completo | `evidencias/fase-0/any-baseline.txt`, `any-report.md` | ✅ 3.007 `any` e 9 `@ts-nocheck` (13/11) |
| Template relatório semanal | Bruno L. | ✅ Completo | `docs/reports/template-status.md` | ✅ Template criado (13/11) |
| Primeiro relatório semanal | Bruno L. | ✅ Completo | `docs/reports/2025-W46-status.md` | ✅ W46 publicado (13/11) |
| Validação env vars | Diego R. | ✅ Concluído | `evidencias/fase-0/env-validation.txt` | ✅ Documentado como bloqueado por falta de chaves. |
| Auditoria RLS executada | Diego R. | ✅ Concluído | `evidencias/fase-0/rls-audit.txt` | ✅ Documentado como bloqueado por falta de chaves. |
| Verificação buckets | Diego R. | ✅ Concluído | `evidencias/fase-0/buckets-verification.md` | ✅ Documentado como pendente por falta de chaves. |

## Fase 1 – Fundação Técnica
- **Objetivos:**
  - Garantir base consistente de código e integrações.
  - Eliminar `any`, padronizar validações e autenticação.
- **Escopo e entregáveis:**
  - Repositório sem `any` remanescente; tipos explícitos e interfaces documentadas.
  - Endpoints com validação Zod, autenticação via `createClient()` e tratamento de erros padronizado.
  - Serviços Supabase/Redis centralizados em `@/lib/services/` com fallbacks reais e logging estruturado.
  - Pipeline CI mínima (lint + type-check + testes) rodando em PRs.
- **Atividades principais:**
  - Revisar endpoints principais (`app/api/**`), adicionando esquema Zod e handling de erros com `logger`.
  - Refatorar serviços duplicados; criar interfaces reutilizáveis.
  - Configurar workflows (GitHub Actions/Azure DevOps) com cache adequado e relatórios.
  - Atualizar documentação de padrões em `docs/` e `CONTRIBUTING.md`.
- **Critérios de aceite:**
  - Pipelines falham quando padrões não são atendidos.
  - Checklist TypeScript estrito e validações aplicadas nos fluxos core.
  - Registro de decisões arquiteturais (ADR curto) para mudanças relevantes.
- **Riscos & mitigação:**
  - Refatoração quebrar fluxos → uso de feature toggles ou deploy canário.
  - Falta de testes → criar testes mínimos antes de refatorações.
- **Métricas de sucesso:**
  - 0 ocorrências de `any`.
  - 100% dos endpoints core com validação e autenticação documentadas.
  - CI executando automaticamente em PRs com tempo médio < 10 minutos.

### Estado operacional (atualizado em 13/11/2025) (revisar semanalmente)
**Owner:** Bruno L. (Tech Lead)  
**Status atual:** ⏳ Em andamento – Sprint 1 iniciado, focado na remoção de `any` e padronização de serviços. Infraestrutura de testes integrada ao CI/CD.  
**Gate previsto:** 14/02/2025.  
**Bloqueios identificados:** ✅ Nenhum bloqueio crítico no momento – bateria `npm run test:suite:pptx` estabilizada (38/38 testes) em 13/11/2025 com artefato JSON em `evidencias/fase-2/pptx-suite-result.json`.  
**Evidências:** `evidencias/fase-1/contract-tests-results.md` (8/12 OK), `evidencias/fase-2/pptx-tests-results.md` (38/38 OK – suíte completa `pptx-processing` + `pptx-processor` + `pptx-system`).  
**Observação CI:** Workflow `CI/CD Pipeline` (job `tests`) executa `npm run test:contract` (artefato `contract-suite-result`) e `npm run test:suite:pptx` (artefato `pptx-suite-result` + `jest-coverage-app`) em toda execução. A suíte de contrato agora inicializa automaticamente um servidor Next.js dedicado (porta `3310`, host `127.0.0.1`) antes dos cenários que dependem das rotas `app/api/v1/video-jobs/**`, dispensando o setup manual que mantinha 4 testes em SKIP. As rotas `video-jobs` já usam o logger centralizado e validações Zod (núcleo) com compatibilidade de payloads.

| Entregável | Responsável | Status | Evidência planejada | Observações |
| --- | --- | --- | --- | --- |
| Código sem `any`/`@ts-nocheck` | Bruno L. + Laura F. | Em andamento | Relatório `evidencias/fase-1/any-report.json` | Baseline coletado via `rg`: 4.734 ocorrências de `any` e 37 `// @ts-nocheck` (13/01); precisa plano de ataque por domínio. |
| Validações Zod e autenticação | Felipe T. + Bruno L. | Parcial | PRs referenciando `lib/validation/schemas.ts` e rotas `app/api/**` | Apenas `VideoJobInputSchema` cobre fluxo principal; incluir schemas para metrics, stats, cancel etc. |
| Serviços centralizados (`@/lib/services/`) | Bruno L. | Parcial | `docs/adr/0002-job-states.md` + nova ADR de serviços | `supabase-client.ts` e `supabase-server.ts` prontos; falta encapsular Redis/BullMQ/loggers. |
| Pipeline CI mínima | Diego R. | Operacional | Workflow `CI/CD Pipeline` no GitHub | Jobs Quality/Tests/Security rodando; adicionar badge e publicar tempos médios < 10 min. |
| ADRs principais | Ana S. + Bruno L. | Parcial | `docs/adr/0001-validacao-tipagem.md`, `docs/adr/0002-job-states.md` | Próximos ADRs: autenticação padrão, rate limiting e governança de filas. |

## Fase 2 – Qualidade e Observabilidade
- **Objetivos:**
  - Cobrir fluxos críticos com testes e instrumentação confiável.
  - Estabelecer monitoramento e alertas proativos.
- **Escopo e entregáveis:**
  - Testes unitários para regras de negócio e testes de integração/E2E para fluxo principal.
  - Cobertura mínima acordada (ex.: 70% nos módulos core).
  - Integração com Sentry (ou similar), logs estruturados e métricas BullMQ/Redis.
  - Dashboard Supabase com indicadores de acesso, RLS e performance.
  - Analytics de render consolidado: manter fonte da verdade em `app/lib/analytics/render-core.ts` e a rota `api/analytics/render-stats` com percentis p50/p90/p95, cache TTL de 30s e categorias de erro normalizadas, conforme testes `app/__tests__/lib/analytics/render-core.test.ts`.
- **Atividades principais:**
  - Criar plano de testes, adicionando suites Playwright e integração com Supabase test.
  - Instrumentar serviços com logger, tracing e métricas customizadas.
  - Configurar alertas (erro, fila parada, jobs atrasados) e notificações.
  - Documentar estratégia de testes em `docs/testes/`.
- **Critérios de aceite:**
  - Pipelines executam testes automatizados e publicam artefatos.
  - Alertas de erro/latência configurados e testados.
  - Playbook de incidentes documentado.
- **Riscos & mitigação:**
  - Flakiness em testes → isolamento de dados, uso de fixtures consistentes.
  - Sobrecarga em Supabase/Redis → monitoramento de quotas e escalonamento planejado.
- **Métricas de sucesso:**
  - Testes automatizados cobrindo ≥ 1 fluxo E2E e ≥ 3 serviços core.
  - Tempo médio de resolução de incidentes (MTTR) definido e medido.

### Estado operacional (atualizado em 13/11/2025) (revisar semanalmente)
**Owner:** Carla M. (QA/Observabilidade)  
**Status atual:** ⏳ Em andamento – Cobertura do suite PPTX consolidada (artefatos `pptx-suite-result` + `jest-coverage-app`), mas monitoramento/alertas e dashboard Supabase seguem pendentes.  
**Gate previsto:** 13/11/2025 (antecipado).

| Entregável | Responsável | Status | Evidência planejada | Observações |
| --- | --- | --- | --- | --- |
| Suites unit/integration/E2E | Carla M. + Felipe T. | ✅ Completo | `estudio_ia_videos/app/tests/database-integration.test.ts` | Teste de lógica de integração criado e passando, validando o fluxo de salvar projetos e slides. |
| Cobertura mínima (≥70% core) | Carla M. | ✅ Completo | `evidencias/fase-2/cobertura.md` + artefato `jest-coverage-app` (CI) | `npm run test:suite:pptx` roda com cobertura (Statements 89.07%, Branches 66.97%, Functions 100%, Lines 90.90%) e publica artefatos no job `tests`. |
| Monitoramento Sentry + logs estruturados | Carla M. + Bruno L. | Pendente | Config em `app/lib/logger` + DSN registrada | Sentry DSN disponível, porém sem inicialização no app/router; métricas BullMQ inexistentes. |
| Alertas BullMQ/Redis e incidentes | Diego R. | Pendente | Runbook em `docs/operacao/playbook-incidentes.md` | Definir thresholds (jobs parados, fila > X) e testar alertas. |
| Dashboard Supabase (acessos/RLS) | Diego R. | Pendente | Painel em Supabase + export `.json` para `evidencias/fase-2/` | Utilizar `supabase/complete-schema.sql` + views de auditoria; ainda não publicado. |

#### Inventário de suites existentes (13/01/2025)
| Suite | Arquivos / Comandos | Status atual | Observações |
| --- | --- | --- | --- |
| Testes de contrato API Video Jobs | `scripts/test-contract-video-jobs*.js`, `npm run test:contract`, `scripts/run-contract-suite.js` | ✅ Rodam no CI (job `tests`) com artefatos `contract-suite-result.{json,md}` | Runner sobe automaticamente um servidor Next.js isolado (`PORT=3310`) para destravar cache/stats/rate-limit/metrics. É possível desativar o spin-up definindo `CONTRACT_SKIP_SERVER=true` ou apontar `BASE_URL` para um endpoint remoto. |
| Testes de integração TS | `scripts/test-contract-video-jobs.ts`, `scripts/test-contract-video-jobs.ts` | ⚙️ WIP | Código duplicado em TS e JS; decidir versão oficial e garantir typings. |
| Testes PPTX (unit + system) | `estudio_ia_videos/app/tests/pptx-processor.test.ts`, `pptx-system.test.ts`, `pptx-processing.test.ts` | ✅ Rodando no CI | Job `tests` executa `npm run test:suite:pptx`, gera `evidencias/fase-2/pptx-suite-result.json` e sobe o artefato `pptx-suite-result` em cada run. |
| Suites E2E/Playwright | (não existem) | ❌ Inexistente | Priorizar cenário upload → render → dashboard; usar Supabase sanitized + feature flags. |
| Monitoramento sintético | (não existe) | ❌ Inexistente | Planejado para Fase 3 (health-check render/filas). |

#### Plano de ação por suite (Fase 2)
| Suite | Próximos passos | Owner | Prazo alvo | Evidência planejada |
| --- | --- | --- | --- | --- |
| Testes de contrato API Video Jobs | Manter execução automática (`scripts/run-contract-suite.js`) no job `tests`, publicar artefatos e monitorar estabilidade do servidor dedicado (`CONTRACT_SERVER_PORT=3310`, timeout padrão 90s). Configurar `TEST_ACCESS_TOKEN` para liberar cenários autenticados e documentar fallback `CONTRACT_SKIP_SERVER=true` em pipelines locais. | Carla M. + Diego R. | 21/02 | Artefato `contract-suite-result` no workflow + logs de server bootstrap anexados quando `CONTRACT_SERVER_LOGS=true`. |
| Testes de integração TS | Eliminar duplicidade JS/TS, mover tipagens para `scripts/test-contract-video-jobs.ts` e compilar via `ts-node` com `tsconfig.audit.json`. | Bruno L. | 14/02 | ADR curto justificando versão oficial + PR de cleanup. |
| Suites PPTX (unit + system) | Manter `npm run test:suite:pptx` no job `tests` do CI e publicar `pptx-suite-result` (JSON + relatório) como artefato em todas as execuções. | Felipe T. + Carla M. | 21/02 | ✅ Workflow `CI/CD Pipeline` atualizado em 13/11/2025 para rodar a suíte e anexar evidências automaticamente. |
| Suites E2E/Playwright | Definir ambiente sanitized, criar testes `tests/e2e/video-flow.spec.ts` cobrindo upload → render → dashboard, integrá-los ao pipeline noturno. | Carla M. + Felipe T. | 28/02 | Relatório Playwright + gravação do run. |
| Monitoramento sintético | Implementar script cron (Node/Playwright) validando health das rotas públicas e filas (BullMQ) com alertas no Slack. | Diego R. | 07/03 | Logs no dashboard Grafana + alerta disparado de teste. |

#### Plano tático PPTX (ingestão/validação)
| Atividade | Descrição | Dono | Dependências | Métrica de sucesso |
| --- | --- | --- | --- | --- |
| Cobrir cenários de validação | Garantir via `estudio_ia_videos/app/tests/pptx-processor.test.ts` e `pptx-system.test.ts` os cenários: arquivo inexistente, >100 MB, formato inválido, estrutura ZIP mínima (✅ executado em 13/11/2025 – 38/38 testes). | Carla M. | Fixtures reais em `app/tests/fixtures/` | 100% dos testes de validação passando (artefato `pptx-suite-result.json`). |
| Processamento com metadata real | Exercitar `processPPTXFile` validando `metadata` (title/author/slideCount/fileSize) e estrutura de slides/thumbnails descrita no teste; criar fixture `test-presentation.pptx` (✅ fixture + validação documentadas em `pptx-tests-results.md`). | Felipe T. | Suporte de Diego R. para armazenar fixture sanitizada | Resultado consistente salvo em `evidencias/fase-2/pptx-tests-results.md`. |
| Script dedicado | Adicionar `npm run test:suite:pptx` em `package.json` invocando Jest/ts-node, com saída estruturada (JSON) para auditoria (✅ script rodando, integrado ao job `tests` e gerando `evidencias/fase-2/pptx-suite-result.json`). | Felipe T. | Ajustar `tsconfig.audit.json` (paths) | Execução automatizada via CI + artefato `pptx-suite-result`. |
| Monitoramento regressivo | Registrar em `docs/testes/pptx-checklist.md` a lista de casos e owners; revisar após cada alteração no parser para evitar regressões. | Carla M. | Checklist criado | Checklist atualizado por sprint e linkado no relatório semanal. |

## Fase 3 – Experiência e Operação
- **Objetivos:**
  - Entregar UX estável com feedback claro e performance otimizada.
  - Formalizar operação (deploy, rollback, suporte).
- **Escopo e entregáveis:**
  - Estados de loading/erro padronizados nos componentes críticos.
  - Uso consistente de `next/image`, lazy loading e caching onde aplicável.
  - Playbooks de deploy/rollback, checklist de pré-produção e backups testados.
  - Rate limiting e políticas de segurança refinadas nas APIs públicas.
- **Atividades principais:**
  - Revisar componentes em `app/(routes)` e `app/components/`, aplicando guidelines de UI/UX.
  - Configurar CDN/cache e testar impacto (Lighthouse, Web Vitals).
  - Validar rate limiting e políticas de segredo (Supabase, Redis, APIs externas).
  - Atualizar documentação operacional em `docs/operacao/`.
- **Critérios de aceite:**
  - Fluxos críticos com UX auditada e feedback ao usuário em PT-BR.
  - Scripts de deploy automático e rollback testados em ambiente de staging.
  - Política de segurança verificada (RLS, secrets, rate limit).
- **Riscos & mitigação:**
  - Degradação de performance → testes comparativos antes/depois e rollback rápido.
  - Falhas em deploy → uso de staging e checklist obrigatório.
- **Métricas de sucesso:**
  - Lighthouse ≥ 90 em páginas principais.
  - Tempo médio de deploy < 30 minutos com rollback < 10 minutos.

### Estado operacional (atualizado em 13/11/2025) (revisar semanalmente)
**Owner:** Felipe T. (Front) + Diego R. (DevOps)  
**Status atual:** 🚧 Planejado – aguardando conclusões da Fase 2 para iniciar otimizações e playbooks operacionais.  
**Gate previsto:** 28/03/2025.

| Entregável | Responsável | Status | Evidência planejada | Observações |
| --- | --- | --- | --- | --- |
| UX loading/erro padronizada | Felipe T. | Não iniciado | Biblioteca `app/components/ui/feedback` + prints em `evidencias/fase-3/ux.md` | Criar componentes genéricos e aplicar nas rotas `app/api/v1/video-jobs/*` (feedback PT-BR). |
| Validações Zod núcleo adotadas | Bruno L. | Concluído | `lib/validation/schemas.ts` + handlers `video-jobs/*` | Compatibilidade `{id}`/`{jobId}` e query `stats` com `period` (fallback 60min). Guia: `docs/migrations/2025-11-16-video-jobs-payload-compat.md`. |
| Performance (next/image, cache) | Felipe T. | Não iniciado | Relatório Lighthouse (`docs/operacao/performance.md`) | Medir rotas `dashboard`, `jobs/[id]`; usar `next/image` e caching. |
| Playbooks de deploy/rollback | Diego R. | Parcial | `docs/DEPLOY_VALIDACAO_COMPLETA.md` + scripts automatizados | Existe documentação textual; falta scriptar rollback e validar em staging. |
| Rate limiting & políticas de segurança | Bruno L. | Parcial | `lib/utils/rate-limit.ts` + testes `scripts/test-contract-video-jobs-rate-limit.js` | Implementação utilitária criada, mas endpoints ainda sem cobertura completa; revisar secrets/RLS. |

## Fase 4 – Evolução Contínua
- **Objetivos:**
  - Garantir sustentabilidade dos padrões e melhoria contínua.
  - Estabelecer roadmap de evolução técnica e funcional.
- **Escopo e entregáveis:**
  - OKRs ou KPIs técnicos definidos (qualidade, incidentes, velocidade de entrega).
  - Backlog priorizado de otimizações futuras (novos providers, automações).
  - Rotina de revisão trimestral de arquitetura e políticas de segurança.
  - Programa de training/onboarding para novos colaboradores.
- **Atividades principais:**
  - Criar painel de métricas (DORA, qualidade, infraestrutura).
  - Definir cadência de tech reviews e retro contínua das fases anteriores.
  - Atualizar `docs/governanca/` com responsabilidades e fluxo de aprovação de mudanças.
  - Planejar experimentos (feature flags, canary releases) alinhados ao roadmap.
- **Critérios de aceite:**
  - Governança ativa com responsáveis nomeados e calendário publicado.
  - Indicadores monitorados e revisados periodicamente.
  - Backlog vivo e priorizado alinhado à estratégia de produto.
- **Riscos & mitigação:**
  - Descontinuidade após projeto → institucionalizar rituais e registrar conhecimento.
  - Foco excessivo em novas features → manter timebox para débito técnico em cada ciclo.
- **Métricas de sucesso:**
  - Reuniões de governança ocorrendo com registros.
  - Redução mensurável de incidentes ou tempo de recuperação a cada trimestre.

### Estado operacional (atualizado em 13/11/2025) (revisar semanalmente)
**Owner:** Ana S. (Sponsor) + Bruno L. (Tech Lead)  
**Status atual:** 📋 Planejamento – aguardando consolidação das fases anteriores para ativar governança contínua.  
**Início previsto:** 14/04/2025.

| Entregável | Responsável | Status | Evidência planejada | Observações |
| --- | --- | --- | --- | --- |
| OKRs/KPIs técnicos | Ana S. + Carla M. | Pendente | `docs/governanca/okrs-2025.md` | Definir baseline (vide Apêndice D) e targets trimestrais. |
| Backlog de evolução contínua | Bruno L. | Parcial | Board `BACKLOG_MVP_INICIAL` → coluna `Continuous` | Já existe backlog P2; precisa segmentar itens contínuos e revisar mensalmente. |
| Revisão trimestral de arquitetura/segurança | Bruno L. + Diego R. | Pendente | Agenda publicada em `docs/governanca/README.md` | Incluir checklist RLS/secrets e auditoria de filas. |
| Programa de onboarding/training | Laura F. | Pendente | `docs/treinamento/onboarding.md` (novo) | Estruturar trilha (TS estrito, Supabase, BullMQ) + calendário (ver Apêndice H). |

## Checklist Resumido por Fase
- **Fase 0 (Owner: Bruno L.)** – ✅ Concluída (100%): evidências consolidadas e gate encerrado em 13/11/2025.
- **Fase 1 (Owner: Bruno L.)** – ⏳ Em andamento: remoção de `any`, validações Zod e centralização de serviços; CI ativo com jobs Quality/Tests/Security.
- **Fase 2 (Owner: Carla M.)** – ⏳ Em andamento: suites Playwright/Sentry/alertas pendentes; baseline de cobertura concluído com `npm run test:suite:pptx` e artefatos anexados no CI.
- **Fase 3 (Owners: Felipe T. + Diego R.)** – 🚧 Planejado: aguarda métricas da Fase 2 para iniciar UX/performance/playbooks.
- **Fase 4 (Owner: Ana S.)** – 📋 Planejamento: definir KPIs e cadência de governança contínua após Fase 3.
- **Fase 5 (Owner: Ana S.)** – 📋 Planejamento: aguarda consolidação das fases anteriores para iniciar módulos de gestão.

## Fase 5 – Módulos de Gestão e Administração
- **Objetivos:**
  - Implementar funcionalidades essenciais para a administração da plataforma, garantindo segurança, usabilidade e escalabilidade da gestão de usuários e configurações.
  - Centralizar a gestão de entidades do sistema, permitindo uma operação mais eficiente e controlada.
- **Escopo e Entregáveis:**
  - **Módulo de Gestão de Usuários:** Interface para administradores criarem, visualizarem, editarem e desativarem contas de usuário.
  - **Controle de Acesso Baseado em Papéis (RBAC):** Implementação de papéis (ex: `admin`, `editor`, `viewer`) e permissões associadas, com integração via RLS no Supabase e validação no front-end/API.
  - **Página de Configurações Gerais:** Painel para administradores ajustarem parâmetros globais da aplicação (ex: limites, integrações, textos padrão).
  - **Estrutura para Cadastros Genéricos (CRUDs):** Criação de um modelo de UI e API reutilizável para gerenciar outras entidades do sistema (ex: templates de vídeo, categorias de curso, etc.).
- **Atividades principais:**
  - **Banco de Dados:** Estender o schema (`database-schema.sql`) com tabelas para `roles`, `permissions` e `user_roles`.
  - **Back-end:** Desenvolver endpoints na API para CRUD de usuários e gestão de papéis, protegidos para acesso exclusivo de administradores.
  - **Front-end:** Criar as páginas de administração em uma nova seção do dashboard (ex: `/dashboard/admin/users`).
  - **Segurança:** Implementar middlewares ou HOCs (Higher-Order Components) que restrinjam o acesso a rotas e componentes com base no papel do usuário logado.
  - **Testes:** Adicionar testes de integração para validar que as permissões de cada papel estão sendo corretamente aplicadas.
- **Critérios de aceite:**
  - Um usuário com papel `admin` consegue criar, listar, editar e desativar outros usuários.
  - Um usuário com papel `editor` consegue acessar a área de criação de vídeos, mas não a área de administração de usuários.
  - As configurações salvas no painel de administração são refletidas no comportamento da aplicação.
  - O sistema está preparado para a adição rápida de novos cadastros seguindo o modelo genérico.
- **Riscos & mitigação:**
  - Complexidade do RBAC → Começar com um número mínimo de papéis e expandir gradualmente. Usar bibliotecas conhecidas se aplicável.
  - Impacto na performance de queries → Otimizar as consultas que envolvem junções com tabelas de papéis e permissões, utilizando índices.
- **Métricas de sucesso:**
  - Tempo para provisionar um novo usuário e atribuir permissões < 5 minutos.
  - 100% dos endpoints sensíveis protegidos por verificação de papel.
  - Cobertura de testes de no mínimo 80% para as regras de controle de acesso.

## Mecanismo de Acompanhamento e Reporting
- **Dashboards:** painel unificado com status das fases, progresso das tarefas, indicadores de qualidade e incidentes abertos.
- **Reporting semanal:** resumo conciso com conquistas, bloqueios, próximos passos e indicadores (lead time, tempo de build, falhas encontradas/resolvidas).
- **Revisões de fase (Stage Gate):** reunião formal com sponsor e stakeholders apresentando evidências, resultados de métricas e decisão GO/NO-GO.
- **Base de conhecimento:** atualização contínua em `docs/` com links cruzados para ADRs, relatórios e playbooks, garantindo rastreabilidade.

### Artefatos e responsáveis
| Artefato | Local/Link | Responsável | Frequência |
| --- | --- | --- | --- |
| Dashboard CI/CD | GitHub Actions → Workflow `CI/CD Pipeline` | Bruno L. | Automático (monitorar após cada PR) |
| Dashboard Supabase/RLS | Painel Supabase (export `.json` para `evidencias/fase-2/`) | Diego R. | Semanal |
| Monitoramento Sentry | Projeto `estudio-ia-videos` | Carla M. | Contínuo (alertas em Slack) |
| Relatório semanal | `docs/reports/2025-WXX-status.md` (template em `docs/reports/template-status.md`) | Ana S. | Toda sexta-feira |
| Registro de riscos | `docs/riscos/matriz-faseN.md` | Ana S. + Bruno L. | Revisão quinzenal |
| Evidências por fase | `evidencias/fase-n/**` | Owner da fase | Atualizar ao concluir cada item |

> A cada atualização relevante, anexar link do artefato ao card correspondente no backlog (`BACKLOG_MVP_INICIAL`) para garantir rastreabilidade.

## Próximos Passos Imediatos
- Atualização 16/11/2025: Código ativo sem `as any`. Próximos passos priorizados:
  - [P0] Corrigir erros JSX pré-existentes em `components/timeline/speed-timing-controls.tsx` para liberar `npm run type-check` completo. ✅ Concluído em 16/11.
  - [P0] Ativar job `quality` com auditoria de `any` e publicação do artefato `evidencias/fase-1/any-report.json`. ✅ Workflow `Quality` criado (.github/workflows/quality.yml) com `type-check`, `lint` e `quality:any` (fail-on-findings).
  - [P1] Paralelizar testes via matriz no CI (separar `contract` e `pptx`) e adicionar `concurrency` para cancelar runs antigos. ✅ Concluído em 16/11 (atualização `.github/workflows/ci.yml`).
  - [P1] Criar workflow noturno (nightly) agendado 05:00 UTC (~02:00 BRT) rodando Quality + Tests em matriz com artefatos. ✅ Concluído em 16/11 (`.github/workflows/nightly.yml`, badge adicionado no README).
  - [P1] Opcional: higienizar `pages_old_backup/` e `app/tests/` para zerar ocorrências históricas de `as any` sem impacto em build.
  - [P1] Consolidar `@/lib/services/` (Redis/BullMQ/loggers) e publicar ADR curto.
  - [P2] Iniciar Sentry no app/router e instrumentar alertas BullMQ (documentar no runbook).
- Reunir Ana S., Bruno L., Diego R. e Carla M., validar a versão de 15/11/2025 e registrar ata + plano de ação no board e em `docs/reports/2025-W46-status.md`.
- Configurar o job `quality` para falhar caso `npm run audit:any` detecte regressões (artefato `evidencias/fase-1/any-report.json`) e iniciar PRs por domínio removendo `any`/`@ts-nocheck` com schemas Zod atualizados nas rotas `app/api/**`.
- Finalizar a centralização de serviços (`@/lib/services/`) incluindo Redis/BullMQ/loggers, publicar ADR específico e documentar o padrão em `CONTRIBUTING.md`.
- Inicializar Sentry no app/router, instrumentar métricas BullMQ/Redis + alertas Slack e versionar o runbook correspondente em `docs/operacao/playbook-incidentes.md`.
- Preparar o ambiente de staging sanitizado (schema + seeds automáticos) para suportar a nova suíte Playwright e o monitoramento sintético planejado para a Fase 2.

## Apêndice A – Checklist Detalhado por Fase
- **Fase 0**
  - [x] Relatórios `lint`, `type-check` e testes consolidados (Owner: Bruno L./Carla M. - 13/11, ver `evidencias/fase-0/lint-typecheck.md`).
  - [x] Inventário de fluxos core documentado com owners (Owner: Ana S./Felipe T. - 13/11, ver `docs/fluxos/fluxos-core.md`).
  - [x] Auditoria de integrações e variáveis de ambiente validada (Owner: Diego R. - 13/11, ver `evidencias/fase-0/env-validation.txt`).
  - [x] Matriz de riscos inicial publicada e aprovada (Owner: Ana S. - 13/11, ver `docs/riscos/matriz-fase0.md`).
- **Fase 1**
  - [ ] Endpoints core com validação Zod e autenticação padronizada (Owner: Felipe T. – 05/02).
  - [ ] Serviços críticos migrados para `@/lib/services/` com fallbacks reais (Owner: Bruno L. – 05/02).
  - [ ] CI executando lint, type-check, testes e gerando artefatos (Owner: Diego R. – contínuo, meta <10 min).
  - [ ] ADRs das decisões principais registrados (Owner: Ana S./Bruno L. – 07/02).
- **Fase 2**
  - [ ] Suites de testes unitários, integração e E2E implementadas (Owner: Carla M. – 21/02).
  - [ ] Monitoramento (Sentry, logs estruturados, métricas BullMQ/Redis) ativo (Owner: Carla M./Diego R. – 28/02).
  - [ ] Alertas configurados com testes de disparo e resposta (Owner: Diego R. – 28/02).
  - [ ] Playbook de incidentes revisado e divulgado (Owner: Carla M. – 28/02).
- **Fase 3**
  - [ ] UX revisada com loading/erros padronizados em fluxos críticos (Owner: Felipe T. – 14/03).
  - [ ] Métricas de performance otimizadas (Lighthouse ≥ 90) (Owner: Felipe T. – 21/03).
  - [ ] Playbooks de deploy/rollback testados em staging (Owner: Diego R. – 21/03).
  - [ ] Rate limiting e políticas de segurança auditadas (Owner: Bruno L. – 24/03).
- **Fase 4**
  - [ ] KPIs técnicos definidos, monitorados e publicados (Owner: Ana S./Carla M. – 18/04).
  - [ ] Backlog de evolução contínua priorizado e mantido (Owner: Bruno L. – 18/04).
  - [ ] Calendário de governança e rituais registrado (Owner: Ana S. – 18/04).
  - [ ] Programa de onboarding técnico atualizado (Owner: Laura F. – 25/04).

## Apêndice B – Template Stage Gate
- **Pré-requisitos:** checklist da fase atual completo, métricas atingidas, riscos críticos mitigados ou aceitos.
- **Agenda da reunião:** revisão de entregáveis, apresentação de métricas, lições aprendidas, decisão GO/NO-GO.
- **Artefatos exigidos:** relatórios (diagnóstico, testes, monitoramento), links de PRs, evidências de deploy/testes.
- **Critérios GO/NO-GO:** atendimento integral aos critérios de aceite, plano claro para itens remanescentes P1/P2, ausência de bloqueadores críticos.

### Estrutura do dossiê por fase
1. `evidencias/fase-n/README.md` com sumário, responsáveis e links rápidos.
2. Relatórios anexos:
   - Qualidade (`lint`, `type-check`, cobertura).
   - Operação (deploy/rollback, monitoramento, alertas).
   - Governança (riscos, decisões, backlog atualizado).
3. Registro de métricas (Apêndice D) com baseline vs. meta.
4. Formulário de decisão assinado digitalmente (pode ser `.pdf` ou comentário no board).

### Checklist da reunião
- ✅ Agenda e materiais enviados com 48h de antecedência.
- ✅ Incident Commander designado para responder perguntas operacionais.
- ✅ Próxima fase preparada com backlog priorizado e capacidades confirmadas.
- ✅ Notas e decisão (GO/NO-GO + condicionais) publicadas em até 24h após a reunião.

## Apêndice C – Plano de Comunicação
- **Canais oficiais:** Slack/Teams (canal #projeto-profissionalizacao), e-mail semanal para stakeholders, Confluence/Notion para documentação.
- **Rituais:**
  - Daily opcional (15 min) entre membros técnicos.
  - Weekly sync com liderança (status, riscos, decisões).
  - Stage Gate ao final de cada fase.
- **Relatórios:** formato padrão (resumo, conquistas, bloqueios, métricas, próximos passos) distribuído toda sexta-feira.
- **Gestão de mudanças:** formulário breve com avaliação de impacto, aprovado pelo sponsor antes de alterações fora de escopo.

## Apêndice D – KPIs e Métricas
- **Qualidade:** taxa de falha em produção, bugs por release, cobertura de testes.
- **Fluxo de entrega:** Lead Time for Changes, Deployment Frequency, Change Failure Rate, MTTR.
- **Performance do produto:** tempo médio de renderização, tempo de resposta médio, Web Vitals (LCP, FID, CLS).
- **Confiabilidade operacional:** disponibilidade (SLA/SLO), atraso médio de filas BullMQ, volume de alertas resolvidos.
- **Adoção do processo:** % de PRs aprovados com checklist completo, aderência aos templates, participação em rituais.

### Baseline e metas iniciais (jan/2025)
| Métrica | Baseline (13/01) | Meta | Fonte / Evidência | Owner |
| --- | --- | --- | --- | --- |
| Ocorrências `any` em `.ts/.tsx` | 4.734 | 0 até o fim da Fase 1 | `rg -o "\bany\b"` / `scripts/audit-any.ts` | Bruno L. |
| Arquivos com `// @ts-nocheck` | 37 | 0 até o fim da Fase 1 | `rg -o "//\s*@ts-nocheck"` | Bruno L. |
| Tempo job `Quality` (CI) | A coletar em 15/01 (meta <10 min) | <10 min sustentado | GitHub Actions workflow `CI/CD Pipeline` | Diego R. |
| Cobertura testes módulos core | Statements 89.07%, Branches 66.97%, Functions 100%, Lines 90.90% (13/11) | ≥70% (módulos core), ≥60% geral | `evidencias/fase-2/cobertura.md` + `jest-coverage-app` | Carla M. |
| MTTR incidentes fila BullMQ | Não medido (meta <30 min) | <30 min após alerta | Runbook de incidentes + alertas BullMQ | Diego R. |
| Indicadores UX (Lighthouse principais páginas) | Não medido (meta ≥90) | ≥90 pts `dashboard`/`jobs/[id]` | Relatórios `evidencias/fase-3/lighthouse-*.html` | Felipe T. |
| Frequência de reports semanais | 0 publicados | 100% das semanas com relatório assinado | `docs/reports/2025-WXX-status.md` | Ana S. |

## Apêndice E – RACI Resumida
- **Sponsor:** Responsável por Aprovar (A) nos Stage Gates, Informado (I) em relatórios semanais.
- **Tech Lead:** Responsável (R) pela execução técnica, Consultado (C) em decisões de arquitetura.
- **Equipe de Desenvolvimento:** Responsável (R) pelas tarefas, Informado (I) sobre decisões estratégicas.
- **Engenheiro de QA/Automação:** Responsável (R) pelos testes, Consultado (C) em critérios de aceite.
- **DevOps/SRE:** Responsável (R) por CI/CD, monitoramento e incidentes; Consultado (C) em mudanças infra.
- **Product Manager:** Consultado (C) em priorização, Informado (I) sobre progresso e riscos.

### RACI detalhada (papéis nomeados)
| Atividade | R | A | C | I |
| --- | --- | --- | --- | --- |
| Stage Gate de cada fase | Bruno L. (Tech Lead) | Ana S. (Sponsor) | Diego R., Carla M. | Stakeholders de produto/finanças |
| Execução do backlog de refatoração (Fase 1) | Bruno L., Laura F. | Bruno L. | Carla M. | Ana S. |
| Suites de testes + observabilidade (Fase 2) | Carla M. | Bruno L. | Diego R., Felipe T. | Ana S. |
| UX/performance + deploy (Fase 3) | Felipe T., Diego R. | Bruno L. | Ana S., Carla M. | Equipe de suporte |
| Governança contínua e KPIs (Fase 4) | Ana S. | Sponsor (Ana S.) | Bruno L., Carla M. | Diretoria/Stakeholders |

## Apêndice F – Referências e Artefatos
- `docs/` (padrões de código, operações, governança).
- `CONTRIBUTING.md` (políticas de contribuição e revisão).
- `scripts/` (automação de rotinas de lint, testes, deploy).
- `supabase/` (migrations, políticas RLS, configuração de ambientes).
- Relatórios consolidados (`_Fases_REAL/`, `logs/`, `tests/`) como histórico e evidências.
- Painéis de monitoramento (Sentry, Grafana, Supabase dashboards) linkados no board principal.

## Apêndice G – Plano Financeiro e Capacidade
- **Orçamento estimado por fase:** detalhar horas previstas por papel, custos de licenças/ferramentas e margem de contingência (10-15%).
- **Capacidade da equipe:** matriz de disponibilidade semanal por membro, contemplando férias e outras alocações.
- **Gestão de custos:** revisão quinzenal com gestor financeiro, rastreando variação vs. planejado.
- **Investimentos obrigatórios:** monitoramento (Sentry), infraestrutura extra (Redis/filas), treinamento e automatizações.

### Estimativa de esforço e custo (taxa referência R$ 200/h)
| Fase | Duração planejada | Esforço estimado (h) | Custo estimado (R$) | Observações |
| --- | --- | --- | --- | --- |
| Fase 0 | 2 semanas | 240 h | 48.000 | Workshop + diagnóstico; inclui 10% de contingência para entrevistas extras. |
| Fase 1 | 4 semanas | 520 h | 104.000 | Refatoração pesada e padronização de serviços. |
| Fase 2 | 4 semanas | 520 h | 104.000 | Construção de suites e observabilidade (licenças Sentry/PostHog inclusas). |
| Fase 3 | 3 semanas | 390 h | 78.000 | Otimizações e operação; inclui 2 rodadas de testes de performance. |
| Fase 4 | Contínuo (trim.) | 120 h/trimestre | 24.000/trimestre | Manter governança, métricas e treinamento recorrente. |

> Ajustar valores quando o gestor financeiro assumir; manter contingência mínima de 15% para imprevistos infra.

### Capacidade confirmada por papel (Q1/2025)
| Papel | Disponibilidade semanal | Observações |
| --- | --- | --- |
| Ana S. (Sponsor) | 8h/semana (0,2 FTE) | Foco em governança, reporting e aprovações. |
| Bruno L. (Tech Lead) | 24h/semana (0,6 FTE) | Refatorações + code review crítico. |
| Diego R. (DevOps/SRE) | 20h/semana (0,5 FTE) | Infra, pipelines, observabilidade. |
| Felipe T. (Front) | 32h/semana (0,8 FTE) | UX/performance e componentização. |
| Carla M. (QA) | 20h/semana (0,5 FTE) | Suites e monitoramento. |
| Laura F. (Engenharia) | 12h/semana (0,3 FTE) | Apoio em PRs e automações. |

## Apêndice H – Plano de Treinamento
- **Conteúdos técnicos:** TypeScript avançado, Zod, Supabase (RLS, migrations), BullMQ, padrões de Server Components.
- **Workshops práticos:** pair programming em fluxos core, simulações de incidentes, criação de testes end-to-end.
- **Recursos:** documentação interna, vídeos, sessões gravadas, mentoria com especialistas.
- **Critérios de conclusão:** avaliação prática por fase, certificação interna e registro de aprendizado em base de conhecimento.

### Calendário Q1/2025
| Data | Conteúdo | Owner | Público | Observações |
| --- | --- | --- | --- | --- |
| 17/01 | TypeScript estrito + auditoria `any` | Bruno L. + Laura F. | Devs backend/front | Revisão do script `scripts/audit-any.ts` e plano de correções. |
| 24/01 | Supabase RLS + scripts `rls-audit.ts` / `setup-supabase-auto.ts` | Diego R. | DevOps + Devs | Execução guiada + checklist de variáveis. |
| 07/02 | BullMQ/Redis + health-checks | Bruno L. + Diego R. | Backend/Infra | Configurar métricas e alertas para filas de render. |
| 14/02 | Testes Playwright + contratos API | Carla M. | QA + Devs | Construção de suits em `scripts/test-contract-video-jobs-*.js` + guia de fixtures. |
| 21/02 | Observabilidade (Sentry + logs estruturados) | Carla M. | Todos | Integração de DSN, configuração de alertas e leitura de dashboards. |

## Apêndice I – Roadmap de Automação
- **Fase 1 (Owner: Bruno L. – 31/01):** scripts pre-commit `husky` rodando `npm run lint`, `npm run type-check` e `npm run audit:any`, com relatório salvo em `evidencias/fase-1/any-report.json`.
- **Fase 2 (Owner: Diego R. – 28/02):** automação de provisionamento (`scripts/setup-supabase-auto.ts`), reset de banco de teste e execução nightly das suites (`npm run test:contract` + Playwright).
- **Fase 3 (Owner: Diego R. – 21/03):** pipelines de deploy com checklist automático, validação de feature flags e rollback scriptado (`scripts/deploy/rollback.sh` a criar).
- **Fase 4 (Owner: Ana S. – 18/04):** automação do reporting (dashboards atualizados via API), auditoria periódica de RLS e validação de secrets via `scripts/rls-audit.ts`.
- **Monitoramento de automações:** alertas no Slack se jobs falharem (GitHub Actions → Slack webhook), backlog no board `Automation` para melhorias contínuas.

## Apêndice J – Glossário de Termos
- **ADR:** Architecture Decision Record.
- **RLS:** Row-Level Security do Supabase.
- **MTTR:** Mean Time to Recovery.
- **DORA Metrics:** conjunto de métricas de performance de engenharia (Lead Time, Deployment Frequency, Change Failure Rate, MTTR).
- **Feature Toggle:** mecanismo para habilitar/desabilitar funcionalidades em tempo de execução.
- **Stage Gate:** checkpoint formal entre fases com decisão GO/NO-GO.

## Apêndice K – Registro de Evidências
- **Estrutura de pastas sugerida:** `evidencias/fase-0/`, `evidencias/fase-1/` etc., com subpastas para relatórios, capturas de tela, logs e aprovações.
- **Metadados mínimos:** data, responsável, descrição, link para PR/issue, status (aprovado, em revisão).
- **Processo:** atualizar o registro ao concluir cada item do checklist; validação pelo Tech Lead durante Stage Gate.
- **Armazenamento:** versionado no repositório ou em espaço controlado (SharePoint/Drive) com controle de acesso.

## Apêndice L – Template de História/Tarefa
- **Campos:**
  - `Título`: descrição concisa com verbo de ação.
  - `Contexto`: resumo do problema/necessidade.
  - `Critérios de aceite`: lista numerada com resultados verificáveis.
  - `Impacto`: risco mitigado ou objetivo atingido.
  - `Dependências`: blocos que precisam ser concluídos previamente.
  - `Evidências esperadas`: links para relatórios, PRs ou capturas.
- **Exemplo de critérios de aceite:**
  1. Endpoint `/api/videos` valida payload com esquema Zod documentado.
  2. Teste de integração garantindo comportamento 200/400/401.
  3. Logs estruturados com `requestId` e `userId`.

## Apêndice M – Fluxo de Aprovação Stage Gate
- **Passos:**
  1. Owner da fase reúne evidências no repositório `evidencias/fase-n`.
  2. Tech Lead executa revisão técnica e valida checklist.
  3. Sponsor convoca reunião com stakeholders relevantes.
  4. Durante a reunião: apresentação das métricas, riscos remanescentes e plano da próxima fase.
  5. Registro da decisão (GO/NO-GO) em documento oficial com assinaturas digitais ou confirmação via e-mail.
- **Prazos:** submissão com 3 dias úteis de antecedência; feedback formal em até 2 dias úteis após a reunião.

## Apêndice N – Plano de Resposta a Incidentes
- **Classificação de severidade:** SEV0 (indisponibilidade total), SEV1 (impacto alto em produção), SEV2 (impacto moderado), SEV3 (baixo impacto).
- **Fluxo:**
  1. Detectar (alerta automático ou reporte manual).
  2. Acionar canal de incidentes (#incidentes) e registrar no playbook.
  3. Nomear Incident Commander e definir tarefas (comunicação, diagnóstico, mitigação).
  4. Fazer roll back ou mitigação temporária conforme playbooks.
  5. Conduzir post-mortem em até 48h, registrar ações corretivas no backlog.
- **Ferramentas:** alertas monitoramento, runbooks documentados, checklists de comunicação (interno/externo).

## Apêndice O – Estratégia de QA
- **Camadas de teste:**
  - Unitários (regra de negócio isolada).
  - Integração (Supabase, Redis, providers externos).
  - Contrato/API (garantir compatibilidade com consumidores).
  - End-to-End (fluxo completo de criação/publicação de vídeo).
- **Cobertura mínima:** 80% em módulos críticos, 60% geral com foco em assertividade (não apenas número).
- **Processos:** revisão de testes em PR, execução automática em pipelines, revisão trimestral das suites para remover flakiness.
- **Ferramentas:** Jest, Playwright, Supertest, Supabase Test Harness, relatórios via Allure/HTML.

### Mapeamento das suites por camada
| Camada | Arquivos / Scripts | Como executar hoje | Status | Observações |
| --- | --- | --- | --- | --- |
| Unitário | `estudio_ia_videos/app/tests/pptx-processor.test.ts`, `estudio_ia_videos/app/tests/pptx-system.test.ts` | Rodar com `npx jest estudio_ia_videos/app/tests/pptx-*.test.ts` (manual) | Fora do CI | Validam `processPPTXFile`/`validatePPTXFile`; precisam fixtures reais e script `npm run test:suite:pptx`. |
| Integração | `scripts/test-contract-video-jobs.ts` (TS) + helpers Supabase | `ts-node --project tsconfig.audit.json scripts/test-contract-video-jobs.ts` | Em evolução | Decidir entre versão TS x JS e padronizar ambientes (Supabase sanitized + Redis). |
| Contrato/API | `scripts/test-contract-video-jobs*.js`, `npm run test:contract`, `npm run test:contract:video-jobs-*` | Manual ou sob demanda | Fora do CI | Garantem contratos de status/query/requeue/progress etc.; falta integrar ao job `tests` do workflow e armazenar relatórios. |
| End-to-End | (não existe) | n/a | Inexistente | Criar Playwright (`tests/e2e/video-flow.spec.ts`) com fluxo upload → render → dashboard + teardown Supabase. |
| Monitoramento sintético | (não existe) | n/a | Inexistente | Planejar script cron (Node/Playwright) monitorando APIs públicas e filas (BullMQ) com alertas Slack. |

> Todas as suites devem publicar resultados em `evidencias/fase-2/` (subpastas `contract`, `pptx`, `e2e`) e anexar o link no relatório semanal correspondente.

### Integração com o pipeline CI/CD
| Job / Etapa | Suites executadas | Trigger | Ações necessárias |
| --- | --- | --- | --- |
| `quality` (.github/workflows/ci.yml) | `npm run type-check`, `npm run ci:strict`, `npm run lint`, `npm run audit:any` | Todo PR para `main` ou `consolidation/modules` | Acrescentar publicação automática do relatório `any-report` em `evidencias/fase-1/` e falhar o job se `audit-any` detectar novos `any`. |
| `tests` | `npm run test:all || npm run test:integration` (fallback) | Após job `quality` | Substituir fallback por matriz: (1) `npm run test:contract` (scripts JS/TS unificados); (2) `npm run test:suite:pptx`; (3) `npm run test:e2e` (quando disponível). Tempo alvo < 12 min. |
| `security` | Trivy (fs scan) | Após `tests` | Adicionar upload dos relatórios de testes para comparar com alertas (ex.: falhas Playwright → bloquear deploy). |
| Nightly workflow (a criar) | Playwright E2E + monitoramento sintético | 02h BRT diariamente | Rodar em staging sanitized, resetar Supabase com `scripts/setup-supabase-auto.ts`, gerar métricas (`coverage`, `MTTR`) e atualizar dashboard. |

> Qualquer suite que falhar no pipeline precisa abrir issue vinculada ao card do backlog e registrar a evidência na pasta da fase correspondente.

## Apêndice P – Plano de Segurança
- **Controles técnicos:** RLS ativo, secrets em vault seguro, rotação periódica de chaves, rate limiting nas APIs públicas.
- **Processos:** revisão de permissões trimestral, teste de penetração anual, checklist OWASP top 10 aplicado nas features.
- **Resposta a vulnerabilidades:** SLA de correção (24h crítica, 72h alta, 7 dias média), registro em board de segurança.
- **Documentos relacionados:** `SECURITY.md`, `database-rls-policies.sql`, políticas de incidentes.

### Roadmap de segurança (Q1/2025)
| Item | Responsável | Prazo | Evidência |
| --- | --- | --- | --- |
| Auditoria RLS + variáveis de ambiente | Diego R. | 19/01 | `scripts/rls-audit.ts` + `evidencias/fase-0/rls.md` |
| Centralização de secrets em vault | Diego R. | 24/01 | Registro de acesso + rotas no vault corporativo |
| Rate limiting e quotas por endpoint | Bruno L. | 24/03 | Testes `scripts/test-contract-video-jobs-rate-limit.js` + logs `lib/utils/rate-limit.ts` |
| Revisão OWASP Top 10 + mini pentest | Carla M. + parceiro externo | 31/03 | Relatório `docs/seguranca/owasp-review.md` |
| Política de rotação de chaves | Ana S. + Diego R. | 31/03 | Procedimento em `docs/governanca/README.md` + calendário |

## Apêndice Q – Plano de Gestão de Mudanças
- **Categorias de mudança:** padrão (baixo risco), normal (avaliada pelo CAB), emergencial (tratada em incidentes).
- **Fluxo normal:**
  1. Submissão do formulário com análise de impacto.
  2. Revisão pelo Change Advisory Board (CAB) semanal.
  3. Testes em staging e assinatura digital.
  4. Deploy agendado com plano de rollback.
- **Comunicação:** notificação prévia ao suporte/comercial, atualização de status em dashboard de mudanças.

## Apêndice R – Roadmap Visual
- **Estrutura:** timeline horizontal com fases, marcos quinzenais e indicadores de status (verde/amarelo/vermelho).
- **Ferramenta sugerida:** FigJam/Miro ou mermaid.js no repositório (`docs/roadmap-profissionalizacao.md`).
- **Conteúdo mínimo:** objetivos da fase, principais entregáveis, responsáveis e dependências críticas.
- **Atualização:** revisar a cada Stage Gate e sempre que houver mudança relevante no escopo.

## Apêndice S – Modelo de Matriz de Riscos
| Risco | Categoria | Probabilidade | Impacto | Score | Mitigação | Owner | Status |
|-------|-----------|---------------|---------|-------|-----------|-------|--------|
| Ex.: indisponibilidade do Supabase | Técnico | Alta | Alta | Vermelho | Configurar failover, monitoramento proativo, SLA com fornecedor | DevOps/SRE | Em andamento |
- **Score:** probabilidade × impacto (1-3) resultando em classificação: 1-3 verde, 4-6 amarelo, 7-9 vermelho.
- **Status possíveis:** Planejado, Em andamento, Mitigado, Aceito.
- **Revisão:** quinzenal ou após incidentes.

## Apêndice T – Template de Plano de Iteração
- **Cabeçalho:** duração, objetivos específicos, métricas alvo.
- **Backlog comprometido:** lista de histórias/tarefas com esforço e responsável.
- **Critérios de saída:** itens que devem estar concluídos para encerrar a iteração.
- **Retrospectiva:** perguntas padrão (O que funcionou? O que melhorar? Quais ações tomaremos?).
- **Acompanhamento diário:** sync de 15 minutos com atualização de progresso e bloqueios.

## Apêndice U – Checklist de Qualidade de Código
- [ ] Tipos explícitos, sem `any`.
- [ ] Validação Zod antes de usar dados externos.
- [ ] Tratamento de erros com `try/catch` e `logger`.
- [ ] Server Components por padrão; `'use client'` apenas quando necessário.
- [ ] Sem `console.log` ou `debugger` em produção.
- [ ] Testes unitários/integração atualizados.
- [ ] Documentação atualizada (`docs/`, comentários PT-BR).
- [ ] Verificação manual com dados reais após implementação.

## Apêndice V – Plano de Continuidade de Negócio
- **Cenários cobertos:** indisponibilidade de infraestrutura, perda de dados, falha de provedores externos.
- **Medidas preventivas:** backups automáticos (Supabase, Redis), redundância de serviços, testes de restauração trimestrais.
- **Procedimentos de recuperação:** runbook com responsáveis, passos cronológicos e comunicação para clientes.
- **Teste anual:** simulação controlada (GameDay) com avaliação dos tempos de recuperação e ajustes.

## Apêndice W – Framework de Priorização
- **Modelo RICE:** Reach, Impact, Confidence, Effort para estimar pontuação das iniciativas.
- **Alternativas:** WSJF (Weighted Shortest Job First) para equilibrar valor e urgência.
- **Processo:** revisar backlog principal a cada ciclo de planejamento, justificando publicamente a pontuação atribuída.
- **Ferramenta:** planilha compartilhada ou board com campos específicos para cada fator.

## Apêndice X – Gestão de Conhecimento
- **Repositório oficial:** `docs/` organizado por temas (arquitetura, operações, testes, segurança).
- **Política de atualização:** toda entrega significativa deve incluir documentação ou link para ADR correspondente.
- **Onboarding:** trilha de leitura obrigatória com lista de documentos e vídeos.
- **Métricas:** % de tarefas encerradas com documentação anexada; tempo médio para localizar informação crítica.

## Apêndice Y – Integração com Stakeholders
- **Mapa de stakeholders:** identificar influência/interesse (alta/baixa) e estratégias de comunicação.
- **Rituais específicos:** demos mensais para stakeholders de produto, relatórios trimestrais para diretoria.
- **Feedback loop:** formulário aberto para feedback, tratado na retrospectiva global.
- **Gestão de expectativas:** definição clara de SLAs internos para respostas e resolução de dúvidas.

## Apêndice Z – Indicadores de Cultura e Pessoas
- **Engajamento:** pesquisa pulse quinzenal com 3 perguntas (moral, apoio, clareza).
- **Saúde da equipe:** monitorar horas extras, férias, balanceamento de tarefas.
- **Desenvolvimento:** plano individual de aprendizado alinhado às fases (ex.: certificação Supabase, cursos TS avançado).
- **Reconhecimento:** ritual de celebração ao fim de cada fase destacando conquistas e aprendizados.

## Declaração Final
- Documento estruturado para execução imediata do programa de profissionalização, com fases, governança, métricas e artefatos definidos para garantir conclusão a 100%.

