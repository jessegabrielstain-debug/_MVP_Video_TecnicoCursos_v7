# ADR 0001 — Padronização de Validação e Tipagem

Data: 2025-11-12
Status: Proposto
Decisores: Tech Lead, Equipe de Desenvolvimento

## Contexto
Há ocorrência extensiva de `any` e uso de `// @ts-nocheck` em trechos do projeto, reduzindo a segurança de tipos e dificultando evolução. Falta padronização para validação de entrada em endpoints/serviços.

## Decisão
- Adotar TypeScript estrito progressivamente (script `type-check:strict` e meta de habilitar `strict: true` em 3 sprints).
- Proibir `any` em runtime via ESLint (`@typescript-eslint/no-explicit-any`). Permissão temporária mediante `// @deprecated-any` com justificativa.
- Padronizar validação com Zod em `lib/validation/schemas.ts`, aplicada nos endpoints core.
- Centralizar criação do cliente Supabase em `lib/services/supabase-client.ts` com tipos explícitos.

## Alternativas consideradas
- Manter validações ad-hoc: descartado por inconsistência e risco.
- Migrar direto para strict absoluto: risco de quebra ampla sem cobertura de testes.

## Consequências
- Ligeiro aumento de esforço inicial, redução significativa de bugs e retrabalho.
- Lint/CI podem falhar até regularizar pontos críticos; adoção faseada prevista no plano.

## Métricas de sucesso
- 0 ocorrências de `any` em runtime em 3 sprints.
- 100% dos endpoints core validando input com Zod.
- CI com `type-check` e `lint` estáveis (<10 min).
