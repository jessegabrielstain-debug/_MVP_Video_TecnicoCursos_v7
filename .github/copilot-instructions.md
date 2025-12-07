## 🤖 Instruções para Agentes AI - MVP Vídeos TécnicoCursos v7

**Princípio Base:** Atue como Engenheiro de Software Sênior. Construa software de nível de produção, robusto, seguro e escalável. Rejeite atalhos de "protótipo" ou "MVP descartável". Eleve a qualidade do código existente.

---

## 🏆 Padrões de Qualidade (Profissional vs Protótipo)

**Mentalidade:** Este é um sistema crítico de produção.
- **❌ Protótipo (PROIBIDO):**
  - Hardcoding de valores ou credenciais.
  - Tipagem `any` ou `// @ts-ignore` (salvo exceção crítica documentada).
  - Tratamento de erros genérico ou silencioso (`catch (e) { console.log(e) }`).
  - UI "crua" ou sem feedback visual de carregamento/erro.
  - Funções gigantes que fazem tudo.

- **✅ Profissional (OBRIGATÓRIO):**
  - **Tipagem:** TypeScript estrito. Interfaces explícitas em `types/`.
  - **Resiliência:** Tratamento de erros granular. Use `normalizeErrorMessage`. Feedback claro ao usuário (Toasts/Alerts).
  - **Arquitetura:** Separação clara: UI (Components) ↔ State (Zustand) ↔ Logic (Lib/Core) ↔ Data (API/Supabase).
  - **Performance:** Memoização onde necessário (`useMemo`, `useCallback`). Queries otimizadas.
  - **Código:** Limpo, documentado (JSDoc em funções complexas), testável.

---

## 🏗️ Arquitetura Core

**Pipeline de vídeo:** PPTX upload → parse local (JSZip + fast-xml-parser) → estado Zustand → editor visual → render queue (BullMQ) → Remotion composição → FFmpeg encoding → storage Supabase.

**Stack:** Next.js 14 App Router + TypeScript + Supabase (Postgres + Auth + Storage) + Redis (BullMQ) + Remotion + FFmpeg.

**Monorepo:** Raiz contém `scripts/` (automação) + SQL schemas; `estudio_ia_videos/` contém Next.js app.

---

## 📁 Estrutura Crítica

```
├── estudio_ia_videos/app/          # Next.js app (UI, API routes, lib)
│   ├── api/render/                 # 15+ rotas de render (jobs, export, queue, stats)
│   ├── lib/
│   │   ├── analytics/render-core.ts   # Lógica pura (testável) de métricas
│   │   ├── pptx-processor.ts          # Parser PPTX (JSZip)
│   │   ├── queue/                     # BullMQ setup + workers
│   │   └── stores/                    # Zustand (editor-store, unified-project-store)
│   ├── components/pptx/            # Upload, preview, editor de slides
│   └── __tests__/lib/analytics/    # Testes unitários (Jest)
├── scripts/                        # Automação (TS/JS executáveis)
│   ├── setup-supabase-auto.ts      # Setup completo DB (~15s)
│   ├── health-check.ts             # Healthcheck sistema
│   └── test-supabase-integration.ts # 19 testes integração
├── database-schema.sql             # Schema completo (CREATE IF NOT EXISTS)
├── database-rls-policies.sql       # Políticas RLS (auth.uid() isolation)
└── docker-compose.yml              # Redis + Postgres (dev/local)
```

---

## 🚀 Workflows Essenciais

### 1️⃣ Setup Inicial (First Time)
```powershell
# Raiz do projeto
npm install                        # Instalar deps raiz
npm run setup:supabase            # Schema + RLS + seed + buckets (~15s)
npm run validate:env              # Verificar .env

# App Next.js
cd estudio_ia_videos
npm install
npm run dev                       # Porta 3000
```

### 2️⃣ Desenvolvimento Diário
```powershell
# Terminal 1: App Next.js
cd estudio_ia_videos
npm run dev

# Terminal 2: Redis (se render local)
npm run redis:start              # Docker Compose

# Terminal 3: Worker render (se necessário)
cd scripts
node render-worker.js
```

### 3️⃣ Testes
```powershell
# Raiz: testes integração Supabase (19 testes)
npm run test:supabase

# App: testes unitários Jest
cd estudio_ia_videos
npm test                         # Todos os testes
npm test render-core             # Específico

# Contracts API (raiz)
npm run test:contract:video-jobs
```

### 4️⃣ Deploy/CI
```powershell
npm run type-check               # TypeScript (ignora build errors - next.config)
npm run audit:any                # Auditoria tipos `any`
npm run health                   # Healthcheck pré-deploy
```

---

## 🗄️ Database & RLS

**Tabelas principais:** `users`, `projects`, `slides`, `render_jobs`, `analytics_events`, `nr_courses`, `nr_modules`, `roles`, `permissions`.

**RLS Pattern:**
- Isolamento: `auth.uid() = user_id` para dados privados
- Público: `SELECT true` para `nr_courses`, `nr_modules` (conteúdo educacional)
- Admin: função `is_admin()` (verifica role) para mutações em conteúdo público

**Provisionar:** `npm run setup:supabase` ou `node scripts/execute-supabase-sql.js` (usa `DIRECT_DATABASE_URL` do .env). Arquivos idempotentes (ignore warnings "already exists").

**Schema changes:** Sempre atualizar `database-schema.sql` E `database-rls-policies.sql`. Rodar setup novamente é seguro (IF NOT EXISTS).

---

## 🎨 Frontend Patterns

**State Management:**
- **Client state:** Zustand (`editor-store.ts`, `unified-project-store.ts`) - slides, TTS status, UI state
- **Server state:** React Query (chamadas API Supabase)
- **Drag & Drop:** `@dnd-kit` para reordenar slides (persiste `order_index`)

**UI Components:** Radix UI + Tailwind + `class-variance-authority` (cva). Todos em `components/ui/`.

**Routing:** App Router Next.js 14. API routes em `api/`. Middleware em `middleware.ts` (auth checks).

**Exemplo Zustand:**
```ts
// app/lib/stores/editor-store.ts
import { create } from 'zustand';
import { devtools, immer } from 'zustand/middleware';

const useEditorStore = create()(devtools(immer((set) => ({
  slides: [],
  setSlides: (slides) => set({ slides }),
  updateSlide: (id, data) => set((state) => {
    const slide = state.slides.find(s => s.id === id);
    if (slide) Object.assign(slide, data);
  })
}))))
```

---

## 🎬 Render Pipeline

**Fluxo:** POST `/api/render/start` → cria `render_job` → BullMQ adiciona job → worker processa → Remotion gera frames → FFmpeg codifica → upload bucket `videos` → atualiza job status.

**Principais rotas API:**
- `POST /api/render/start` - Inicia render
- `GET /api/render/jobs?status=processing` - Lista jobs
- `GET /api/render/progress?jobId=X` - Progresso
- `POST /api/render/cancel/[jobId]` - Cancela

**Worker:** `scripts/render-worker.js` (BullMQ consumer). Requer Redis rodando.

**Status enum:** `pending`, `queued`, `processing`, `completed`, `failed`, `cancelled`.

---

## 🧪 Testing Patterns

**Unit tests (Jest):**
- Lógica pura extraída em `*-core.ts` (ex: `analytics/render-core.ts`)
- Testes em `__tests__/lib/` espelham estrutura `lib/`
- Exemplo: `render-core.test.ts` testa `computeBasicStats`, `computePerformanceMetrics`

**Integration tests:**
- `scripts/test-supabase-integration.ts` - 19 testes DB+RLS+Storage
- `scripts/test-contract-video-jobs*.js` - Contract tests API

**Config Jest:** `jest.config.cjs` na raiz. Ignora `/e2e/`, `/archive/`. Setup em `estudio_ia_videos/app/jest.setup.js`.

**Run:**
```bash
npm test                           # Todos
npm test render-core              # Específico
npm test -- --coverage            # Com coverage
```

---

## 📝 Convenções de Código

**TypeScript & Qualidade:**
- **Objetivo:** Eliminar `ignoreBuildErrors` e `// @ts-nocheck`. Todo código novo DEVE ser estritamente tipado.
- **Linting:** Respeite o ESLint. Não desabilite regras sem justificativa técnica forte.
- **Imports:** Use alias `@/` (ex: `@/lib/utils`). Evite caminhos relativos longos (`../../`).

**SQL & Dados:**
- **Segurança:** RLS é mandatório. Nunca confie no client. Valide inputs com Zod nas API Routes.
- **Idempotência:** Scripts de migração devem ser re-executáveis sem erro (`IF NOT EXISTS`).

**API Routes (Next.js):**
- **Padrão:** Validação (Zod) → Auth Check (Supabase) → Lógica Core (Lib) → Resposta Padronizada.
- **Erros:** Retorne status HTTP corretos (400, 401, 403, 404, 500) com mensagens úteis (mas seguras).

**Logging:**
- **Produção:** Use o logger estruturado (`scripts/logger.ts`). NUNCA use `console.log` para erros em produção.
- **Contexto:** Logs devem incluir `jobId`, `userId` ou contexto relevante para debug.

---

## 📊 Analytics & Métricas

**Pattern:** Lógica de cálculo em `*-core.ts` (funções puras), rotas consomem.

**Exemplo:** `app/lib/analytics/render-core.ts` exporta `computeBasicStats`, `computePerformanceMetrics`, `computeErrorAnalysis`. Rota `api/analytics/render-stats` importa e usa.

**Cache:** In-memory TTL 30s em rotas analytics (header `X-Cache: HIT|MISS`).

**Normalização erros:** Categorias semânticas (timeout, ffmpeg, network, storage, auth, resource, validation, unknown) via `normalizeErrorMessage`.

---

## 🔧 Environment & Secrets

**Mínimo .env.local:**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
DIRECT_DATABASE_URL=postgresql://...  # Para scripts
```

**Gerar:** `create-env.ps1` (PowerShell) ou copiar `.env.example`.

**Validar:** `npm run validate:env` (verifica vars obrigatórias).

**Secrets:** NUNCA commitar. `.gitignore` cobre `.env*` exceto `.env.example`.

---

## 🚨 Anti-Patterns & Gotchas

❌ **Não fazer (Risco de Refatoração Imediata):**
- Criar tabelas "na mão" sem script SQL correspondente no versionamento.
- Usar `SUPABASE_SERVICE_ROLE_KEY` no client-side (falha de segurança grave).
- Misturar lógica de negócio complexa dentro de componentes UI (extraia para `lib/` ou hooks).
- "Engolir" erros em Promises (sempre trate o `.catch` ou use try/catch).
- Deixar estados de loading infinitos na UI (sempre trate `finally`).

✅ **Fazer (Padrão Ouro):**
- **Test First/Test Conscious:** Escreva código pensando "como vou testar isso?". Extraia lógica pura.
- **Atomicidade:** Commits e funções pequenas e focadas.
- **Feedback:** O usuário sempre deve saber o que está acontecendo (Loading, Sucesso, Erro).
- **Limpeza:** Remova código morto, comentários obsoletos e imports não usados.

---

## 🔍 Debugging & Troubleshooting

**Healthcheck:**
```bash
npm run health                    # Score 0-100, breakdown por subsistema
```

**DB Connection:**
```bash
npm run test:supabase             # Testa conectividade + RLS
scripts/diagnose-database.ts      # Debug queries
```

**Render stuck:**
```bash
# Ver jobs travados
curl http://localhost:3000/api/render/jobs?status=processing

# Logs worker
pm2 logs render-worker            # Se usando PM2
```

**Redis down:**
```bash
npm run redis:start               # Sobe container Docker
npm run redis:logs                # Ver logs
```

---

## 📚 Documentação de Referência

- **Schemas:** `database-schema.sql` (450 linhas), `database-rls-policies.sql`
- **Scripts README:** `scripts/README.md` (detalhes de cada script)
- **API Contracts:** `scripts/test-contract-video-jobs*.js` (exemplos requests/responses)
- **Analytics:** Atualização recente em `.github/copilot-instructions.md` (seção final deste arquivo)

## 🔎 Atualização (Analytics Render)
- Lógica de métricas de render extraída para `app/lib/analytics/render-core.ts` (funções puras: computeBasicStats, computePerformanceMetrics, computeErrorAnalysis, computeQueueStats).
- Rota `api/analytics/render-stats` agora delega ao core → facilite manutenção e testes.
- Novos testes unitários em `app/__tests__/lib/analytics/render-core.test.ts` asseguram cálculo de tempos, filas e erros.
- Padrão: adicionar novas métricas primeiro no core (puro), depois consumir na rota.
 - Percentis (p50/p90/p95) incluídos em `computePerformanceMetrics`.
 - Cache in-memory (TTL 30s) na rota (`X-Cache: HIT|MISS`).
 - Limite de linhas (MAX_ROWS=5000) com flag `metadata.truncated` quando truncado.
 - Normalização semântica de erros (categorias: timeout, ffmpeg, network, storage, auth, resource, validation, unknown) via `normalizeErrorMessage` + `computeErrorCategories`.
 - Resposta da rota inclui `error_analysis` (bruto agrupado por prefixo) e `error_categories` (normalizado semântico) quando `includeErrors=true`.
 - Testes ampliados para cobrir categorias de erros e percentis.
 - Dívida técnica: remover `// @ts-nocheck` da rota após estabilizar tipagem com enums compartilhados de status.
