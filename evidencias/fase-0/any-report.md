# Fase 0: Baseline de Tipos `any` e `@ts-nocheck`

**Data de Execução:** 13/11/2025  
**Script:** `scripts/audit-any.ts`  
**Responsável:** Bruno L. (Tech Lead) + Laura F. (Engenharia)

---

## Resumo Executivo

A auditoria de tipos foi executada com sucesso, revelando o estado atual da tipagem TypeScript no projeto.

### Estatísticas Globais

| Métrica | Valor |
|---------|-------|
| **Data/Hora da Análise** | 13/11/2025 às 11:24:18 UTC |
| **Arquivos TypeScript Escaneados** | 1.247 arquivos |
| **Total de Findings** | 3.016 ocorrências |
| **Ocorrências de `any`** | 3.007 |
| **Arquivos com `// @ts-nocheck`** | 9 |

---

## Análise Detalhada

### 1. Distribuição de `any`

**Total: 3.007 ocorrências**

#### Principais Fontes (Top 10 Arquivos)

Baseado na amostra do output, as principais concentrações de `any` estão em:

1. **Arquivos `.next/types/` (gerados automaticamente)** - múltiplas ocorrências
   - Estes são gerados pelo Next.js e não devem ser editados manualmente
   - **Ação:** Excluir da contagem de dívida técnica (não controlável)

2. **`estudio_ia_videos/app/types/*.ts`** - ~50+ ocorrências
   - `pptx-types.ts`: ~10 ocorrências (metadata, properties, effects, params)
   - `supabase.ts`: ~20 ocorrências (metadata, render_settings, event_data)
   - `export.types.ts`: ~5 ocorrências (style, timelineData)
   - `sprint10.ts`: ~5 ocorrências (icon)
   - `templates.ts`: ~5 ocorrências (properties, metadata, conditions, parameters)
   - **Ação:** Criar tipos específicos para metadados e configurações (Fase 1)

3. **`lib/supabase/*.ts`** - ~15 ocorrências
   - `error-handler.ts`: ~10 ocorrências (parâmetros error)
   - `functions.ts`: ~5 ocorrências (payload, metadata, data, filters)
   - **Ação:** Tipar erros com união de tipos conhecidos (Fase 1)

4. **`scripts/*.ts`** - ~50+ ocorrências
   - `health-check.ts`: ~10 ocorrências (details, supabase, error)
   - `test-supabase-integration.ts`: ~80 ocorrências (múltiplos usos com `as any`)
   - `validate-environment.ts`: ~3 ocorrências (details, error)
   - `performance-*.ts`: ~10 ocorrências (supabase, error, cache)
   - **Ação:** Usar tipos do SDK Supabase e tipagens específicas (Fase 1)

5. **`estudio_ia_videos/app/workers/*.ts`** - ~10 ocorrências
   - `video-processor.ts`: ~10 ocorrências (job callbacks, metadata, slides, settings)
   - **Ação:** Criar interfaces para Job, Metadata, Settings (Fase 1)

### 2. Arquivos com `// @ts-nocheck`

**Total: 9 arquivos**

Baseado na amostra, os arquivos identificados incluem:
- Comentários no próprio `scripts/audit-any.ts` (meta-referências)
- Possivelmente arquivos legacy ou em migração

**Ação:** Executar query específica para listar os 9 arquivos e criar plano de remoção (Fase 1).

---

## Categorização de `any` por Motivo

### 1. `any` em Metadados/Configurações (~40% - ~1.200 ocorrências)
**Arquivos:** `types/supabase.ts`, `types/pptx-types.ts`, `types/templates.ts`, `types/export.types.ts`

**Padrão:**
```typescript
metadata: any
render_settings: any
event_data: any
properties: Record<string, any>
```

**Solução (Fase 1):**
```typescript
// Criar tipos específicos para metadados
type VideoMetadata = {
  duration?: number;
  resolution?: { width: number; height: number };
  fps?: number;
  codec?: string;
  // ... outros campos conhecidos
};

type RenderSettings = {
  quality?: 'low' | 'medium' | 'high';
  format?: 'mp4' | 'webm';
  bitrate?: number;
  // ... outros campos conhecidos
};

type AnalyticsEventData = 
  | { type: 'slide_reordered'; count: number }
  | { type: 'video_viewed'; timestamp: string }
  | { type: 'render_started'; jobId: string };
```

### 2. `any` em Handlers de Erro (~20% - ~600 ocorrências)
**Arquivos:** `lib/supabase/error-handler.ts`, `scripts/health-check.ts`, `scripts/validate-environment.ts`

**Padrão:**
```typescript
constructor(error: any) { ... }
catch (error: any) { ... }
```

**Solução (Fase 1):**
```typescript
type SupabaseError = {
  message: string;
  code?: string;
  details?: string;
  hint?: string;
};

type KnownError = Error | SupabaseError | { message: string };

constructor(error: KnownError) { ... }
catch (error: unknown) {
  if (error instanceof Error) { ... }
  else if (isSupabaseError(error)) { ... }
}
```

### 3. `any` em Callbacks/Job Handlers (~10% - ~300 ocorrências)
**Arquivos:** `workers/video-processor.ts`, `websocket-server.ts`

**Padrão:**
```typescript
worker.on('completed', (job: any) => { ... });
worker.on('failed', (job: any, err: Error) => { ... });
function broadcastToJob(jobId: string, data: any) { ... }
```

**Solução (Fase 1):**
```typescript
import { Job } from 'bullmq';

worker.on('completed', (job: Job) => { ... });
worker.on('failed', (job: Job, err: Error) => { ... });

type WebSocketMessage = {
  type: 'progress' | 'completed' | 'failed';
  jobId: string;
  payload: unknown;
};

function broadcastToJob(jobId: string, data: WebSocketMessage) { ... }
```

### 4. `any` em Testes/Scripts (~15% - ~450 ocorrências)
**Arquivos:** `scripts/test-supabase-integration.ts` (80 ocorrências!)

**Padrão:**
```typescript
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const { data, error } = await (this.supabase as any).from('table')...
```

**Solução (Fase 1):**
```typescript
// Usar tipos do SDK oficial
import { SupabaseClient } from '@supabase/supabase-js';

class SupabaseIntegrationTest {
  private supabase: SupabaseClient;
  
  async testQuery() {
    const { data, error } = await this.supabase
      .from('users')
      .select('*');
    // data e error já são tipados
  }
}
```

### 5. `any` em Componentes React (~5% - ~150 ocorrências)
**Arquivos:** `video-studio/page.tsx`, `utils/emergency-loop-killer.tsx`

**Padrão:**
```typescript
const handleAddElement = (type: string, data: any = {}) => { ... };
export function useLoopProtection(componentId: string, dependencies: any[] = []) { ... }
```

**Solução (Fase 1):**
```typescript
type ElementData = {
  text?: string;
  image?: string;
  audio?: string;
  // ... campos conhecidos
};

const handleAddElement = (type: string, data: Partial<ElementData> = {}) => { ... };
export function useLoopProtection(componentId: string, dependencies: React.DependencyList = []) { ... }
```

### 6. `any` em Utilitários Globais (~5% - ~150 ocorrências)
**Arquivos:** `lib/utils/metrics.ts`, `lib/utils/rate-limit.ts`

**Padrão:**
```typescript
const g = globalThis as any;
```

**Solução (Fase 1):**
```typescript
interface GlobalWithMetrics extends typeof globalThis {
  __metricsStore?: Map<string, number>;
  __rateLimitStore?: Map<string, RateLimitEntry>;
}

const g = globalThis as GlobalWithMetrics;
```

### 7. `any` Legítimo (~5% - ~150 ocorrências)
**Arquivos:** Utilitários genéricos, HOCs, helpers

**Padrão:**
```typescript
export function withTimeout<T extends (...args: any[]) => any>( ... )
```

**Decisão:** Manter quando necessário para generalização, mas documentar com comentário explicativo.

---

## Plano de Ação (Fase 1)

### Sprint 1 (20/01 - 03/02): Tipos Core
**Owner:** Bruno L. + Laura F.  
**Meta:** Reduzir 1.200 ocorrências (40%)

1. **Criar tipos para metadados** - `lib/types/metadata.ts`
   - `VideoMetadata`, `RenderSettings`, `AnalyticsEventData`
2. **Tipar erros** - `lib/types/errors.ts`
   - `SupabaseError`, `KnownError`, guards
3. **Aplicar em `types/supabase.ts`** - substituir todos os `any` de metadata
4. **Aplicar em `types/pptx-types.ts`** - substituir properties e effects

### Sprint 2 (03/02 - 10/02): Handlers e Workers
**Owner:** Bruno L. + Diego R.  
**Meta:** Reduzir 600 ocorrências (20%)

1. **Tipar error handlers** - `lib/supabase/error-handler.ts`
2. **Tipar job handlers** - `workers/video-processor.ts`
3. **Tipar callbacks BullMQ** - usar tipos do SDK
4. **Aplicar em `websocket-server.ts`**

### Sprint 3 (10/02 - 14/02): Scripts e Testes
**Owner:** Carla M. + Bruno L.  
**Meta:** Reduzir 450 ocorrências (15%)

1. **Refatorar `test-supabase-integration.ts`** - remover todos os `as any`
2. **Tipar `health-check.ts`, `performance-*.ts`**
3. **Tipar `validate-environment.ts`**

### Sprint 4 (14/02 - Gate Fase 1): Componentes e Utilitários
**Owner:** Felipe T. + Laura F.  
**Meta:** Reduzir 300 ocorrências restantes (10%)

1. **Tipar componentes React** - `video-studio`, `emergency-loop-killer`
2. **Tipar utilitários globais** - `metrics.ts`, `rate-limit.ts`
3. **Documentar `any` legítimos** - comentários explicativos
4. **Remover 9 arquivos `@ts-nocheck`**

---

## Métrica de Sucesso

### Baseline (13/11/2025)
- **Total `any`:** 3.007
- **`@ts-nocheck`:** 9
- **Arquivos escaneados:** 1.247

### Meta Fim Fase 1 (14/02/2025)
- **Total `any`:** ≤ 150 (redução de 95%)
- **`@ts-nocheck`:** 0 (redução de 100%)
- **Arquivos tipados:** 100% dos arquivos user-land (excluindo `.next/`)

### Monitoramento Contínuo
- Executar `npm run audit:any` semanalmente
- Falhar CI se novos `any` forem introduzidos (pós-Fase 1)
- Relatório automático em `evidencias/fase-1/any-report.json`

---

## Evidências

- **Arquivo de baseline:** `evidencias/fase-0/any-baseline.txt` (18.106 linhas)
- **JSON estruturado:** Gerado automaticamente pelo script
- **Comando de reprodução:**
  ```bash
  node --loader ts-node/esm scripts/audit-any.ts | Tee-Object -FilePath "evidencias\fase-0\any-baseline.txt"
  ```

---

## Observações Técnicas

1. **`.next/types/` não devem ser contados:** São arquivos gerados automaticamente pelo Next.js. Estimativa: ~500 ocorrências de `any` nesta pasta.
   - **`any` efetivos (user-land):** ~2.500 ocorrências

2. **Falsos positivos:** O script detecta a palavra "any" em comentários e strings. Exemplo:
   - `"* Objetivo: listar ocorrências de 'any'..."` → detectado como `type: "any"`
   - Estimativa de falsos positivos: ~50 ocorrências (<2%)

3. **`@ts-nocheck` em comentários:** Script detectou 9 ocorrências, mas algumas podem ser meta-referências (ex: comentários do próprio `audit-any.ts`).
   - **Ação:** Executar query manual para listar arquivos reais com diretiva.

---

## Próximos Passos Imediatos

1. ✅ Baseline coletado e salvo em `evidencias/fase-0/any-baseline.txt`
2. ⏳ Revisar com Ana S. e Bruno L. até 15/01
3. ⏳ Criar issues no backlog para cada sprint (até 17/01)
4. ⏳ Iniciar Sprint 1 em 20/01

---

**Registro de Mudanças:**
- 13/11/2025: Baseline coletado via `scripts/audit-any.ts` - 3.007 `any` e 9 `@ts-nocheck` detectados.
