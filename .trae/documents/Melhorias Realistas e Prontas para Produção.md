## Integração de Storage Real
- Criar `lib/storage` com adapters `LocalStorage`, `SupabaseStorage`, `S3Storage` e factory por `env`.
- Atualizar `app/api/pptx/upload/route.ts` para usar o adapter e salvar arquivo no provider configurado, retornando URL pública.
- Variáveis: `STORAGE_PROVIDER`, `AWS_*`, `SUPABASE_*`, `PUBLIC_BUCKET`.
- Validação: upload de PPTX retorna 200 com `pptxUrl` assinado; fallback local preservado.

## Migração Automatizada de Banco
- Usar script criado `scripts/apply-nr-templates-migration.ts` com `--apply` em CI e manual.
- Adicionar check de RLS e função `exec_sql`; tornar idempotente.
- Validar com `npm run db:migrate:nr` e depois `-- --apply` em ambiente com `DATABASE_URL`.

## Editor Canvas Profissional
- Integrar `fabric` (já no projeto) em `estudio_ia_videos/app` para edição: seleção, arrastar, redimensionar, texto e imagens.
- Criar componente `CanvasEditor` e substituir `slide-editor.tsx` básico seguindo padrão do design system.
- Persistir mudanças via API; estado global com `zustand`.

## Monetização Básica
- Adicionar Stripe para plano Pro: criar rota `app/api/billing/checkout/route.ts` com sessão de checkout.
- Guardar plano do usuário em DB; middleware limita uploads/render por plano.
- Página de confirmação com webhooks mínimos.

## Observabilidade e Segurança
- Habilitar Sentry (`@sentry/nextjs`) para erros em API e frontend.
- Fortalecer TypeScript: `strict` para app e bloquear `any` em CI.
- Sanitização extra e logs contextuais.

## Performance e Resiliência
- Guardas de memória para arquivos grandes (streaming upload quando provider suporta).
- Timeouts e retries para chamadas externas; métricas Prometheus em `/api/metrics`.

## Testes e Validação
- Unit e integração: upload, storage, migração, editor.
- E2E (Playwright): fluxo Upload → Parse → Persist → Render stub.
- Load (Artillery): upload rate limitado e estável.

## Rollback e Config
- Feature flags para ativar novos módulos gradualmente.
- Variáveis documentadas no `.env.example` e `docs` existentes.

Se aprovado, implemento primeiro o adapter de storage e a troca no endpoint de upload, depois aplico a migração no DB e integro o editor `fabric`. Em seguida, Stripe básico e Sentry.