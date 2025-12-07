# 📋 PLANO DE IMPLEMENTAÇÃO EM FASES
## MVP Vídeos TécnicoCursos v7

**Data:** 05/12/2025  
**Versão:** 1.0  
**Status:** Em Execução

---

## 📊 DIAGNÓSTICO ATUAL

| Métrica | Valor Atual | Meta |
|---------|-------------|------|
| Score Ambiente | ✅ 100/100 | 95/100 |
| Tipos `any` | 137 | < 20 |
| `@ts-nocheck` | 1 arquivo | 0 |
| Vulnerabilidades | ✅ 0 | 0 |
| Cobertura Testes | ~70% | > 85% |

---

## 🎯 FASE 1: ESTABILIZAÇÃO CRÍTICA
**Duração:** 1-2 dias | **Prioridade:** 🔴 URGENTE

### 1.1 Correção de Vulnerabilidades
```bash
# Executar fix automático
npm audit fix

# Verificar resultado
npm audit
```

**Pacotes afetados:**
- [ ] `@sentry/nextjs` → atualizar para versão segura
- [ ] `@sentry/node` → atualizar junto com nextjs
- [ ] `body-parser` → verificar dependência indireta

### 1.2 Configuração de Ambiente
```bash
# Gerar NEXTAUTH_SECRET
openssl rand -base64 32

# Adicionar ao .env.local
NEXTAUTH_SECRET=<valor_gerado>
NEXTAUTH_URL=http://localhost:3000
```

### 1.3 Correção TypeScript Config
**Arquivo:** `estudio_ia_videos/app/tsconfig.json`
```json
{
  "compilerOptions": {
    "ignoreDeprecations": "6.0",
    // ... resto da config
  }
}
```

### ✅ Critérios de Conclusão Fase 1
- [x] 0 vulnerabilidades high/critical
- [x] Ambiente score > 90/100 (✅ 100/100)
- [x] TypeScript sem warnings de deprecação

---

## 🎯 FASE 2: TIPAGEM ESTRITA - CORE
**Duração:** 3-5 dias | **Prioridade:** 🔴 ALTA

### 2.1 Queue System (Prioridade Máxima)
**Arquivos alvo:**
```
estudio_ia_videos/app/lib/queue/
├── queue-manager.ts      (6 any) → TIPAR
├── render-queue.ts       (2 any) → TIPAR  
└── types.ts              (3 any) → TIPAR
```

**Interfaces a criar:**
```typescript
// lib/queue/types.ts
export interface QueueJob<T = unknown> {
  id: string;
  type: string;
  data: T;
  status: JobStatus;
  result?: JobResult;
  createdAt: Date;
  updatedAt: Date;
}

export interface JobResult {
  success: boolean;
  output?: string;
  error?: string;
  duration?: number;
}

export type JobStatus = 'pending' | 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
```

### 2.2 Stores (Estado Global)
**Arquivos alvo:**
```
estudio_ia_videos/app/lib/stores/
├── timeline-store.ts     (6 any) → TIPAR
├── editor-store.ts       (1 any) → TIPAR
└── unified-project-store.ts (1 any) → TIPAR
```

**Interfaces a criar:**
```typescript
// lib/stores/types.ts
export interface Collaborator {
  id: string;
  userId: string;
  name: string;
  avatar?: string;
  role: 'owner' | 'editor' | 'viewer';
  cursor?: CursorPosition;
  lastActive: Date;
}

export interface TimelineElement {
  id: string;
  type: 'video' | 'audio' | 'text' | 'image';
  trackId: string;
  startTime: number;
  duration: number;
  data: ElementData;
}
```

### 2.3 Video Render Engine
**Arquivos alvo:**
```
estudio_ia_videos/app/lib/
├── video-render-engine.ts    (5 any) → TIPAR
└── video-render-pipeline.ts  (2 any) → TIPAR
```

### ✅ Critérios de Conclusão Fase 2
- [x] Queue system 100% tipado
- [x] Stores 100% tipados
- [x] Render engine tipado
- [x] Redução de 50+ any (137 → ~85) ✅

---

## 🎯 FASE 3: TIPAGEM ESTRITA - WEBSOCKETS & SERVICES
**Status:** ✅ Concluída
**Duração:** 3-4 dias | **Prioridade:** 🟡 MÉDIA

### 3.1 WebSocket System
**Arquivos alvo:**
```
estudio_ia_videos/app/lib/websocket/
└── timeline-websocket.ts  (10 any) → TIPAR

estudio_ia_videos/app/server/
└── socket.ts              (5 any) → TIPAR
```

**Interfaces a criar:**
```typescript
// lib/websocket/types.ts
export interface WebSocketMessage<T = unknown> {
  event: TimelineEvent;
  data: T;
  timestamp: number;
  userId: string;
  projectId: string;
}

export interface CursorMoveData {
  x: number;
  y: number;
  elementId?: string;
}

export interface SelectionChangeData {
  selectedIds: string[];
  range?: TimeRange;
}
```

### 3.2 Services Layer
**Arquivos alvo:**
```
estudio_ia_videos/app/lib/services/
├── avatar/synthesia-service.ts  (1 any) → TIPAR
└── monitoring-service.ts        (1 any) → TIPAR

estudio_ia_videos/app/lib/tts/
├── manager.ts                   (1 any) → TIPAR
└── slide-narration-service.ts   (1 any) → TIPAR
```

### 3.3 Subtitles & Transcription
**Arquivos alvo:**
```
estudio_ia_videos/app/lib/subtitles/
└── transcription-service.ts  (3 any) → TIPAR
```

### ✅ Critérios de Conclusão Fase 3
- [x] WebSocket 100% tipado
- [x] Services layer tipado
- [x] Redução para ~40 any

---

## 🎯 FASE 4: TIPAGEM ESTRITA - UI & COMPONENTS
**Duração:** 2-3 dias | **Prioridade:** 🟡 MÉDIA

### 4.1 Pages com Any
**Arquivos alvo:**
```
estudio_ia_videos/app/
├── studio-unified/page.tsx       (4 any) → TIPAR
├── signup/page.tsx               (1 any) → TIPAR
├── video-studio/page.tsx         (1 any) → TIPAR
├── templates/create/page.tsx     (1 any) → TIPAR
└── pptx-upload-production-test/  (3 any) → TIPAR
```

### 4.2 Components
**Arquivos alvo:**
```
estudio_ia_videos/app/src/components/
├── AvatarLibrary.tsx      (1 any) → TIPAR
└── MetricsDashboard.tsx   (1 any) → TIPAR
```

### 4.3 Type Definitions
**Arquivos alvo:**
```
estudio_ia_videos/app/types/
├── editor.ts        (4 any) → TIPAR
├── timeline.ts      (3 any) → TIPAR
├── sprint10.ts      (5 any) → TIPAR
└── pptx-types.ts    (1 any) → TIPAR
```

### ✅ Critérios de Conclusão Fase 4
- [ ] Pages principais tipadas
- [ ] Components críticos tipados
- [ ] Type definitions limpas
- [ ] Redução para ~20 any

---

## 🎯 FASE 5: SCRIPTS & CLEANUP
**Duração:** 2 dias | **Prioridade:** 🟢 BAIXA

### 5.1 Scripts de Automação
**Arquivos alvo:**
```
scripts/
├── render-worker-bull.ts   (7 any) → TIPAR
├── monitoring.ts           (2 any) → TIPAR
├── backup-db.ts            (1 any) → TIPAR
├── migrate-db.ts           (2 any) → TIPAR
└── governanca/update-kpis.ts (3 any) → TIPAR
```

### 5.2 Remover @ts-nocheck
**Arquivo:**
```
estudio_ia_videos/app/scripts/initialize-unified-system.ts
```
- [ ] Analisar erros de tipo
- [ ] Criar interfaces necessárias
- [ ] Remover diretiva @ts-nocheck

### 5.3 Limpeza Final
- [ ] Remover código morto
- [ ] Atualizar imports não usados
- [ ] Consolidar types duplicados

### ✅ Critérios de Conclusão Fase 5
- [ ] 0 arquivos com @ts-nocheck
- [ ] Scripts tipados
- [ ] < 20 any restantes (casos justificados)

---

## 🎯 FASE 6: TESTES & DOCUMENTAÇÃO
**Duração:** 3-4 dias | **Prioridade:** 🟢 BAIXA

### 6.1 Cobertura de Testes
**Áreas prioritárias:**
```
# Aumentar cobertura em:
- lib/queue/          → 90% coverage
- lib/stores/         → 85% coverage
- lib/analytics/      → 90% coverage
- api/render/         → 80% coverage
```

### 6.2 Testes de Integração
```bash
# Criar/atualizar testes
npm run test:integration

# Contract tests
npm run test:contract:video-jobs
```

### 6.3 Documentação Técnica
- [ ] Atualizar `copilot-instructions.md`
- [ ] Documentar novas interfaces
- [ ] Criar guia de contribuição

### ✅ Critérios de Conclusão Fase 6
- [ ] Cobertura > 85%
- [ ] Testes de integração passando
- [ ] Documentação atualizada

---

## 📅 CRONOGRAMA ESTIMADO

```
Semana 1 (05-11/12):
├── Fase 1: Estabilização Crítica  [██████████] 100%
└── Fase 2: Tipagem Core           [██████░░░░]  60%

Semana 2 (12-18/12):
├── Fase 2: Tipagem Core           [██████████] 100%
└── Fase 3: WebSockets & Services  [████░░░░░░]  40%

Semana 3 (19-25/12):
├── Fase 3: WebSockets & Services  [██████████] 100%
└── Fase 4: UI & Components        [██████░░░░]  60%

Semana 4 (26/12-01/01):
├── Fase 4: UI & Components        [██████████] 100%
├── Fase 5: Scripts & Cleanup      [██████████] 100%
└── Fase 6: Testes & Docs          [████░░░░░░]  40%

Semana 5 (02-08/01):
└── Fase 6: Testes & Docs          [██████████] 100%
```

---

## 📊 MÉTRICAS DE PROGRESSO

### Dashboard de Acompanhamento

| Fase | Status | Any Restantes | Progresso |
|------|--------|---------------|-----------|
| Fase 1 | ✅ Concluída | 137 | ██████████ 100% |
| Fase 2 | ✅ Concluída | ~85 | ██████████ 100% |
| Fase 3 | 🔄 Em Andamento | - | ░░░░░░░░░░ 0% |
| Fase 4 | ⏳ Pendente | - | ░░░░░░░░░░ 0% |
| Fase 5 | ⏳ Pendente | - | ░░░░░░░░░░ 0% |
| Fase 6 | ⏳ Pendente | - | ░░░░░░░░░░ 0% |

### Comandos de Verificação
```bash
# Verificar any restantes
npm run audit:any

# Verificar TypeScript
npm run type-check

# Rodar testes
cd estudio_ia_videos && npm test

# Validar ambiente
npm run validate:env

# Healthcheck geral
npm run health
```

---

## 🚀 ENTREGÁVEIS POR FASE

### Fase 1
- [x] Auditoria sistemática concluída
- [x] Vulnerabilidades corrigidas (0 encontradas)
- [x] Ambiente 100/100 score

### Fase 2
- [x] `lib/queue/types.ts` expandido (130+ linhas de tipos)
- [x] `queue-manager.ts` refatorado (0 any)
- [x] `render-queue.ts` tipado
- [x] `timeline-store.ts` tipado (0 any)
- [x] `video-render-engine.ts` tipado (0 any)
- [x] `unified-project-store.ts` tipado (0 any)
- [x] `video-render-pipeline.ts` tipado (0 any)

### Fase 3
- [ ] `lib/websocket/types.ts` criado
- [ ] Real-time 100% tipado

### Fase 4
- [ ] Pages principais limpas
- [ ] Components tipados

### Fase 5
- [ ] 0 @ts-nocheck
- [ ] Scripts profissionais

### Fase 6
- [ ] Coverage report > 85%
- [ ] Docs atualizados

---

## 📝 NOTAS DE IMPLEMENTAÇÃO

### Padrão para Tipagem
```typescript
// ❌ EVITAR
function processData(data: any): any {
  return data.map((item: any) => item.value);
}

// ✅ CORRETO
interface DataItem {
  id: string;
  value: number;
}

function processData(data: DataItem[]): number[] {
  return data.map((item) => item.value);
}
```

### Padrão para Erros
```typescript
// ❌ EVITAR
} catch (error: any) {
  console.log(error.message);
}

// ✅ CORRETO
} catch (error) {
  const message = error instanceof Error ? error.message : 'Unknown error';
  console.error(message);
}
```

### Uso Justificado de Any
Casos onde `any` é aceitável (com comentário):
```typescript
// @deprecated-any: External API response não tipada
const response: any = await externalApi.getData();

// @deprecated-any: Dynamic component props
component: React.ComponentType<any>; 
```

---

## 👥 RESPONSABILIDADES

| Área | Responsável | Backup |
|------|-------------|--------|
| Queue/Render | Dev Backend | Tech Lead |
| Stores/State | Dev Frontend | Dev Backend |
| WebSockets | Dev Backend | DevOps |
| UI/Components | Dev Frontend | Designer |
| Scripts/CI | DevOps | Dev Backend |
| Testes | QA | Dev Frontend |

---

## 🔗 REFERÊNCIAS

- [Copilot Instructions](.github/copilot-instructions.md)
- [Database Schema](database-schema.sql)
- [RLS Policies](database-rls-policies.sql)
- [Scripts README](scripts/README.md)

---

**Última atualização:** 05/12/2025  
**Próxima revisão:** 12/12/2025
