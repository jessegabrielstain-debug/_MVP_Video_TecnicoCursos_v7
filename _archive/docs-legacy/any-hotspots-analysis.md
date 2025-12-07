# Hotspots de `any` - Priorização para Remoção

**Gerado:** 15/11/2025  
**Baseline:** 4.455 ocorrências  
**Meta:** 0 ocorrências

## Top 30 Arquivos Críticos

### Camada: Archive/Legacy (30% do total)
Arquivos legados com maior concentração de `any`. **Estratégia:** Refatorar ou remover se não utilizados.

| # | Arquivo | Ocorrências | Prioridade | Estratégia |
|---|---------|-------------|------------|------------|
| 1 | `archive/legacy/lib-pre-cleanup-20251015/supabase/types.ts` | 51 | P2 | Avaliar se ainda usado; se não, deletar. Se sim, migrar para `types/supabase.ts` |
| 3 | `archive/legacy/lib-pre-cleanup-20251015/graphql/resolvers.ts` | 34 | P2 | Verificar dependências GraphQL; provavelmente pode deletar |
| 6 | `archive/legacy/lib-pre-cleanup-20251015/pptx-parser-animaker.ts` | 26 | P2 | Duplicado? Conferir vs `lib/pptx/pptx-parser.ts` |
| 8 | `archive/legacy/lib-pre-cleanup-20251015/logging-system-advanced.ts` | 23 | P2 | Substituído por `lib/services/logger-service.ts` - deletar |
| 9 | `archive/legacy/lib-pre-cleanup-20251015/pptx/handlers/content-handlers.ts` | 23 | P2 | Avaliar vs handlers atuais em `lib/pptx/` |
| 10 | `archive/legacy/lib-pre-cleanup-20251015/integration/module-adapters.ts` | 22 | P2 | Verificar se ainda necessário |
| 11 | `archive/legacy/lib-pre-cleanup-20251015/pptx/parsers/text-parser.ts` | 22 | P2 | Duplicado de `lib/pptx/parsers/text-parser.ts` - deletar |
| 12 | `archive/legacy/lib-pre-cleanup-20251015/optimization/performance-optimizer.ts` | 21 | P2 | Verificar se lógica foi portada |
| 13 | `archive/legacy/lib-pre-cleanup-20251015/lms/scorm-engine.ts` | 21 | P2 | Funcionalidade SCORM não implementada - deletar |
| 14 | `archive/legacy/app-pre-cleanup-20251015/api/avatars/vidnoz/render/route.ts` | 21 | P2 | Endpoint Vidnoz legado - verificar vs API unificada |

**Ação Rápida:** Auditar `archive/legacy/**` inteiro. Se nenhum import ativo, deletar pasta completa (~300+ ocorrências economizadas).

---

### Camada: Testes (20% do total)
Testes com uso excessivo de `any` para mocks e tipos Jest.

| # | Arquivo | Ocorrências | Prioridade | Estratégia |
|---|---------|-------------|------------|------------|
| 2 | `__tests__/lib/effects/advanced-effects.test.ts` | 41 | P1 | Criar tipos para mocks de effects, substituir `as any` por types |
| 4 | `__tests__/lib/video/video-effects.test.ts` | 29 | P1 | Tipar mocks ffmpeg, substituir `expect.any()` por matchers específicos |
| 5 | `__tests__/api.timeline.features.test.ts` | 27 | P1 | Criar tipos para requests/responses de timeline |
| 11 | `__tests__/lib/export/rendering-pipeline-advanced.test.ts` | 23 | P1 | Tipar estado do pipeline e mocks |

**Padrão comum:**
```typescript
// ❌ Antes
const req = makeRequest('POST', '/api/endpoint', { data: 'value' }) as any

// ✅ Depois
interface MockRequest extends Request {
  json(): Promise<{ data: string }>;
}
const req = makeRequest('POST', '/api/endpoint', { data: 'value' }) as MockRequest
```

---

### Camada: API Routes (15% do total)
Rotas de API com tipos insuficientes para request/response.

| # | Arquivo | Ocorrências | Prioridade | Estratégia |
|---|---------|-------------|------------|------------|
| 7 | `api/v1/timeline/multi-track/analytics/route.ts` | 23 | **P0** | Usar `AnalyticsQuerySchema` de `lib/validation/schemas.ts` |
| 15 | `api/unified/route.ts` | 20 | **P0** | Tipar handlers unificados com schemas Zod |
| 16 | `api/v1/timeline/multi-track/bulk/route.ts` | 19 | **P0** | Criar `BulkOperationSchema` |
| 20 | `api/v1/timeline/multi-track/route.ts` | 16 | **P0** | Usar `TimelineSchema` existente |

**Estratégia P0 (Crítico - Fase 1):**
1. Identificar request/response types de cada endpoint
2. Criar schemas Zod se não existentes em `lib/validation/schemas.ts`
3. Substituir `any` por tipos inferidos do schema: `z.infer<typeof Schema>`
4. Adicionar validação com `validateData()` helper

---

### Camada: Components (10% do total)
Componentes React com props/eventos sem tipagem.

| # | Arquivo | Ocorrências | Prioridade | Estratégia |
|---|---------|-------------|------------|------------|
| 8 | `components/canvas/canvas-editor-professional-sprint28.tsx` | 23 | P1 | Criar `CanvasEditorProps`, tipar callbacks de eventos |
| 17 | `components/canvas/advanced-canvas-editor.tsx` | 17 | P1 | Consolidar tipos comuns em `types/canvas.ts` |
| 18 | `components/canvas/canvas-editor-ssr-fixed.tsx` | 17 | P1 | Verificar se arquivo é usado ou pode deletar |

**Padrão comum:**
```typescript
// ❌ Antes
const handleClick = (e: any) => { }

// ✅ Depois
import { MouseEvent } from 'react';
const handleClick = (e: MouseEvent<HTMLButtonElement>) => { }
```

---

### Camada: Hooks (5% do total)

| # | Arquivo | Ocorrências | Prioridade | Estratégia |
|---|---------|-------------|------------|------------|
| 5 | `hooks/useWorkflowAutomation.ts` | 28 | P1 | Criar `WorkflowState`, `WorkflowAction` types |

---

### Camada: Types (5% do total)

| # | Arquivo | Ocorrências | Prioridade | Estratégia |
|---|---------|-------------|------------|------------|
| 19 | `types/supabase.ts` | 19 | **P0** | Gerar tipos a partir do schema DB com Supabase CLI |

**Ação Prioritária:**
```bash
npx supabase gen types typescript --project-id <project-id> > types/supabase-generated.ts
```
Atualizar imports para usar tipos gerados.

---

## Plano de Execução (Ordem)

### Sprint 1 (15/11 - 22/11) - P0: APIs Core
- [ ] `api/v1/timeline/multi-track/**` (4 arquivos, ~80 any)
- [ ] `api/unified/route.ts` (20 any)
- [ ] `types/supabase.ts` (19 any) → gerar tipos oficiais
- [ ] **Meta:** -120 any | Progresso: 97,3% restantes

### Sprint 2 (23/11 - 29/11) - P1: Testes + Components
- [ ] `__tests__/lib/effects/advanced-effects.test.ts` (41 any)
- [ ] `__tests__/lib/video/video-effects.test.ts` (29 any)
- [ ] `__tests__/api.timeline.features.test.ts` (27 any)
- [ ] `components/canvas/**` (3 arquivos, ~57 any)
- [ ] `hooks/useWorkflowAutomation.ts` (28 any)
- [ ] **Meta:** -180 any | Progresso: 93,3% restantes

### Sprint 3 (30/11 - 06/12) - P2: Limpeza Archive
- [ ] Auditar `archive/legacy/**` completo
- [ ] Deletar arquivos não referenciados
- [ ] Migrar lógica essencial se houver
- [ ] **Meta:** -300 any | Progresso: 86,6% restantes

### Sprint 4 (07/12 - 14/12) - P1: Restante
- [ ] Atacar arquivos com 10-15 any
- [ ] Varredura final com linter
- [ ] **Meta:** -150 any | Progresso: 83,3% restantes

### Sprint 5 (15/12 - 21/12) - Ajustes Finais
- [ ] Resolver edge cases
- [ ] Habilitar ESLint `@typescript-eslint/no-explicit-any: error`
- [ ] Configurar `strict: true` em `tsconfig.json`
- [ ] **Meta:** 0 any | **100% completo**

---

## Ferramentas de Apoio

### Comando Rápido: Contar any por diretório
```powershell
Get-ChildItem -Recurse -Include *.ts,*.tsx -Path estudio_ia_videos/app |
  Where-Object { $_.FullName -notmatch 'node_modules' } |
  Select-String -Pattern '\bany\b' |
  Group-Object { Split-Path (Split-Path $_.Path) -Leaf } |
  Sort-Object Count -Descending |
  Select-Object Name, Count
```

### ESLint Config (incrementar severidade)
```json
{
  "rules": {
    "@typescript-eslint/no-explicit-any": [
      "warn",  // Fase 1-3
      { "ignoreRestArgs": true }
    ]
    // → "error" após Sprint 5
  }
}
```

### Pre-commit Hook (futuro)
```yaml
- repo: local
  hooks:
    - id: no-any-typescript
      name: Block new 'any' types
      entry: bash -c 'git diff --cached --name-only | grep -E "\.(ts|tsx)$" | xargs grep -n "\bany\b" && exit 1 || exit 0'
      language: system
```

---

## Referências
- [TypeScript Strict Mode](https://www.typescriptlang.org/tsconfig#strict)
- [Zod Type Inference](https://zod.dev/?id=type-inference)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
