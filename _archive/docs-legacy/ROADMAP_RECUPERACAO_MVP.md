# 🛠️ Plano de Recuperação do MVP Video Técnico Cursos v7

## 0. Contexto

- Build atual falha: imports quebrados, módulos inexistentes, dependências ausentes, tipagem inconsistente.
- Objetivo: entregar MVP real (upload → slides → render → dashboard básico) totalmente funcional, com build/testes verdes e deploy reproduzível.
- Decisão validada: remover demos fictícias, reconstruir módulos críticos e alinhar dependências ao escopo real.
- Artefatos criados: `docs/recovery/MVP_SCOPE_LOCK.md`, `docs/recovery/INVENTARIO_FUNCIONAIS.md`, `docs/recovery/BACKLOG_MVP_INICIAL.md`.

---

## 1. Fase 0 — Alinhamento Inicial (Duração alvo: 1 dia útil)

| Tarefa | Responsável | Saída Esperada |
|--------|-------------|----------------|
| 0.1 Workshop MVP (2h) | Produto + Tech Lead | Escopo mínimo revisado (páginas, APIs, fluxos obrigatórios) registrado em `MVP_SCOPE_LOCK.md` |
| 0.2 Inventário técnico | Engenharia (2 devs) | Lista "Manter / Arquivar" + dependências externas em `INVENTARIO_FUNCIONAIS.md` |
| 0.3 Go/No-Go decisão | Stakeholders principais | Assinatura do backlog inicial (`BACKLOG_MVP_INICIAL.md`) |

**Entregáveis**: Documento `MVP_SCOPE_LOCK.md`, planilha de dependências, backlog priorizado no tracker (Jira/Linear). Sem esses artefatos aprovados, Fase 1 não inicia.

---

## 2. Fase 1 — Higiene & Setup (Duração alvo: 3 dias úteis)

### 2.1 Limpeza de Código
- Remover/arquivar rotas e componentes fora do escopo MVP (criar diretório `archive/legacy` se necessário).
- Ajustar aliases `@/` para refletir estruturas reais; adicionar ESLint rule para impedir imports inexistentes.
- Script `npm run verify:imports` (usa `ts-node` + AST) conferindo se cada import resolve.

### 2.2 Dependências & Ambiente
- Instalar libs obrigatórias: `supabase-js`, `stripe`, `web-push`, `bullmq`, `ioredis`, `react-window`, `ffmpeg-static`, `@google-cloud/text-to-speech` (avaliar se entra no MVP).
- Gerar `.env.staging` e `.env.production` com variáveis mínimas, documentadas em `docs/env/README.md`.
- Provisionar Supabase (schemas + RLS + seeds) via `npm run setup:supabase`, Redis (queue) e storage (S3/Supabase buckets).

### 2.3 Base de Tests/CI
- Configurar scripts: `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`.
- Montar pipeline CI (GitHub Actions/Vercel) com gating em PR.

**Entregáveis**: Branch `cleanup/mvp-base`, CI passando lint + typecheck, documentação de ambiente atualizada.

---

## 3. Fase 2 — Núcleo Funcional (Duração alvo: 7-10 dias úteis)

### 3.1 Upload & Parsing de PPTX
- Reescrever `lib/pptx-processor` com fluxo real (JSZip + fast-xml-parser) e cobertura de testes.
- Página de upload (dropzone) → API `/api/v1/pptx/process` → estado em Zustand.
- Testes de unidade (parser) + integração (API).

### 3.2 Editor de Slides Simplificado
- Timeline funcional (ordenar slides, editar título/texto) com persistência Supabase (`slides.order_index`).
- Revisar componentes: `SlideTimeline`, `EditorCanvas`, `Sidebar` – garantir exports corretos.
- Testes Playwright básicos (arrastar slide, salvar ordem).

### 3.3 Fila de Renderização
- Implementar `lib/queue/render-queue` usando BullMQ + Redis.
- Worker `scripts/render-worker.ts` que consome filas e chama Remotion/FFmpeg (mock de vídeo simples na primeira entrega).
- API `POST /api/render/jobs` (criar job), `GET /api/render/jobs/:id` (status), webhook/cron para atualizações.
- Logging estruturado (`lib/logger`), testes de integração com Redis em memória (ioredis-mock se necessário).

### 3.4 Dashboard Básico
- Página `/dashboard` listando projetos + status de render (dados de Supabase).
- Gráfico simples (React Query + Chart minimal) mostrando quantidade de renders e últimos eventos.
- Retirar componentes complexos (analytics avançado, compliance) para fases futuras.

**Entregáveis**: MVP navegável com fluxo upload → editar → render → visualizar status. Build + testes passando.

---

## 4. Fase 3 — Qualidade & Hardening (Duração alvo: 5 dias úteis)

### 4.1 Tipagem & Segurança
- Introduzir tipos Zod em rotas API + validação de input.
- Garantir RLS efetiva (consultar `database-rls-policies.sql`, ajustar se necessário).
- Implementar `lib/auth` com NextAuth + Supabase Auth (login e sessão guard). Página login + middleware.

### 4.2 Observabilidade
- Integrar Sentry (server/client) com DSN real; criar dashboards de logs (JSON Lines) e health checks.
- Adicionar monitoramento de fila (Bull Board ou painel custom) para dev.

### 4.3 Testes Ampliados
- Cobertura metas: unit ≥70%, integração ≥60% (prioridade em módulos críticos), 3 cenários e2e Playwright.
- Testes de carga minimal (`artillery.yml`) para API de render (10 req/s por 1 min).

**Entregáveis**: Relatório `QA_SIGNOFF.md`, métricas de cobertura, ensaios de monitoramento documentados.

---

## 5. Fase 4 — Deploy & Pós-Go-Live (Duração alvo: 3 dias úteis)

### 5.1 Staging
- Deploy em ambiente staging (Vercel ou similar) com Supabase + Redis dedicados.
- Execução do checklist `_Fases_REAL/CHECKLIST_DEPLOY.md` atualizado.
- Smoke tests manuais documentados.

### 5.2 Produção
- Configurar domínio, SSL, backups automáticos (Supabase + Redis snapshot), alertas Uptime.
- Deploy controlado (feature flags para funcionalidades avançadas).
- Plano de rollback atualizado com restore testado.

### 5.3 Pós-Go-Live (24h)
- Monitorar métricas (erros, filas, consumo recursos) a cada 1h.
- Registrar incidentes/ajustes em `POST_DEPLOY_REPORT.md`.

**Entregáveis**: Produção ativa, monitoramento operando, relatório pós-deploy.

---

## 6. Riscos & Mitigações

| Risco | Impacto | Mitigação |
|-------|----------|-----------|
| Sobrecarga de escopo | Alto | Escopo MVP trancado na Fase 0; change requests vão para backlog pós-Go-Live |
| Falta de recursos especializados | Médio | Escalar devs/QA adicionais; priorizar módulos core |
| Integrações externas instáveis | Médio | Mocks com feature flags; fallback manual |
| Debt pré-existente esquecido | Alto | Checklist de remoção, code freeze antes do merge |

---

## 7. Governance & Comunicação

- Daily stand-up curto (15 min) com foco em bloqueios.
- Status semanal resumido em `STATUS_SPRINT.md`.
- Artefatos versionados (roadmap, escopo, reports) sob `docs/recovery/`.
- Revisões técnicas obrigatórias antes de merges críticos.

---

## 8. Critérios de Aceite MVP

1. `npm run build`, `npm run lint`, `npm run test` e suíte Playwright passam no main.
2. Fluxo upload → edição → render → download conclui um vídeo simples em staging e produção.
3. Dashboard mostra status de projetos e jobs, dados persistidos no Supabase com RLS ativo.
4. Monitoramento e logs configurados; alertas acionam responsáveis.
5. Documentação atualizada: README principal, guia de deploy, runbooks.

Quando esses critérios forem validados e o relatório pós-deploy estiver aprovado, o projeto estará oficialmente "100% funcional e real" para o escopo MVP.
