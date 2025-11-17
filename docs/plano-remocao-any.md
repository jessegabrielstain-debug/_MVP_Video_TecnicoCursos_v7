# Plano de Remoção de `any` e `@ts-nocheck`

**Status:** Em Andamento  
**Data Início:** 15/11/2025  
**Owner:** Bruno L. (Tech Lead) + Laura F.  
**Baseline:** 4.734 ocorrências de `any` e 37 `@ts-nocheck` (13/01/2025)

## Estratégia de Ataque por Domínio

### Priorização (P0 → P2)

#### P0: APIs e Serviços Core (Fase 1 - até 05/02)
- [ ] `app/api/**/*.ts` - Endpoints públicos
- [ ] `lib/services/**/*.ts` - Serviços centralizados
- [ ] `lib/validation/**/*.ts` - Schemas Zod
- [ ] `lib/supabase/**/*.ts` - Clientes DB

**Meta:** 0 `any` em rotas de API e serviços críticos

#### P1: Lógica de Negócio (Fase 1 - até 14/02)
- [ ] `lib/pptx/**/*.ts` - Processamento PPTX
- [ ] `lib/queue/**/*.ts` - Filas BullMQ
- [ ] `lib/render-jobs/**/*.ts` - Jobs de renderização
- [ ] `lib/video/**/*.ts` - Composição de vídeo

**Meta:** Tipos explícitos em 80% da lógica de negócio

#### P2: UI e Componentes (Fase 2 - até 21/02)
- [ ] `app/dashboard/**/*.tsx` - Páginas dashboard
- [ ] `components/**/*.tsx` - Componentes React
- [ ] `lib/stores/**/*.ts` - Estados Zustand
- [ ] `lib/hooks/**/*.ts` - Custom hooks

**Meta:** Reduzir `any` em 50% na camada de UI

### Categorias de `any` Identificadas

1. **Props de Componentes** (estimado 30%)
   ```typescript
   // ❌ Antes
   function Component(props: any) { }
   
   // ✅ Depois
   interface ComponentProps {
     title: string;
     onClose: () => void;
   }
   function Component({ title, onClose }: ComponentProps) { }
   ```

2. **Event Handlers** (estimado 20%)
   ```typescript
   // ❌ Antes
   const handleClick = (e: any) => { }
   
   // ✅ Depois
   const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => { }
   ```

3. **API Responses** (estimado 25%)
   ```typescript
   // ❌ Antes
   const data: any = await fetch(...)
   
   // ✅ Depois
   const data: ApiResponse = await fetch(...)
   // ou usar schema Zod para validação
   ```

4. **Third-Party Libraries** (estimado 15%)
   ```typescript
   // ❌ Antes
   import lib from 'legacy-lib'; // tipos ausentes
   const result: any = lib.method()
   
   // ✅ Depois
   import lib from 'legacy-lib';
   const result = lib.method() as LibMethodResult
   // ou criar declaração de tipos em types/legacy-lib.d.ts
   ```

5. **Generic Utilities** (estimado 10%)
   ```typescript
   // ❌ Antes
   function mapData(items: any[]) { }
   
   // ✅ Depois
   function mapData<T>(items: T[]): MappedResult<T> { }
   ```

## Arquivos com `@ts-nocheck` (37 total)

### Estratégia de Resolução

1. **Análise Individual**: Identificar motivo do bypass (15/11 - 17/11)
2. **Correção Progressiva**: Remover comentário e corrigir erros (18/11 - 24/11)
3. **Validação**: Garantir que `npm run type-check` passa (25/11)

### Arquivos Prioritários (P0)
```bash
# Executar para listar:
Get-ChildItem -Recurse -Include *.ts,*.tsx -Path estudio_ia_videos/app | 
  Select-String -Pattern '// @ts-nocheck' -List | 
  Select-Object -ExpandProperty Path
```

## Checklist de Execução

### Semana 1 (15/11 - 22/11)
- [x] Criar `lib/validation/schemas.ts` com schemas Zod completos
- [ ] Auditar `app/api/**` e criar interfaces para requests/responses
- [ ] Remover `any` de `lib/services/**` (redis, bullmq, logger)
- [ ] Documentar top 10 arquivos com mais `any` em `evidencias/fase-1/any-hotspots.md`

### Semana 2 (23/11 - 29/11)
- [ ] Criar tipos para `lib/pptx/**` (PPTXSlide, PPTXMetadata, etc.)
- [ ] Remover `any` de `lib/queue/setup.ts` e `lib/render-jobs/**`
- [ ] Criar declarações de tipos para bibliotecas sem @types
- [ ] Atualizar `tsconfig.json` para `strict: true` (incremental)

### Semana 3 (30/11 - 06/12)
- [ ] Tratar `any` em componentes React prioritários
- [ ] Configurar `eslint` rule `@typescript-eslint/no-explicit-any` em `warn`
- [ ] Executar `npm run type-check` e documentar progresso
- [ ] Publicar relatório semanal com métricas

## Métricas de Progresso

| Data | Ocorrências `any` | `@ts-nocheck` | % Redução | Responsável |
|------|-------------------|---------------|-----------|-------------|
| 13/01 | 4.734 | 37 | 0% | Baseline |
| 15/11 | 4.455 | 34 | 5,9% | Agent (schemas, services) |
| 22/11 | TBD | TBD | TBD | Bruno L. |
| 29/11 | TBD | TBD | TBD | Laura F. |
| 06/12 | TBD | TBD | TBD | Bruno L. |
| **Meta Final** | **0** | **0** | **100%** | Fase 1 |

## Ferramentas e Scripts

### Contador Automático
```powershell
# Script: scripts/count-any.ps1
$anyCount = Get-ChildItem -Recurse -Include *.ts,*.tsx -Path estudio_ia_videos/app |
  Select-String -Pattern '\bany\b' -AllMatches |
  Measure-Object -Property Matches -Sum |
  Select-Object -ExpandProperty Sum

$noCheckCount = Get-ChildItem -Recurse -Include *.ts,*.tsx -Path estudio_ia_videos/app |
  Select-String -Pattern '// @ts-nocheck' |
  Measure-Object |
  Select-Object -ExpandProperty Count

Write-Output "any: $anyCount | @ts-nocheck: $noCheckCount"
```

### ESLint Rule (incrementar severidade)
```json
{
  "rules": {
    "@typescript-eslint/no-explicit-any": "warn" // → "error" após Fase 1
  }
}
```

### CI Check (adicionar ao workflow)
```yaml
- name: Check for any/ts-nocheck
  run: |
    ANY_COUNT=$(git grep -oh '\bany\b' -- '*.ts' '*.tsx' | wc -l)
    if [ $ANY_COUNT -gt 0 ]; then
      echo "::warning::Found $ANY_COUNT occurrences of 'any'"
    fi
```

## Referências

- [Fase 1 - Plano de Implementação](./plano-implementacao-por-fases.md#fase-1--fundação-técnica)
- [ADR 0001 - Validação e Tipagem](./adr/0001-validacao-tipagem.md)
- [Baseline `any` Report](../evidencias/fase-0/any-report.md)
