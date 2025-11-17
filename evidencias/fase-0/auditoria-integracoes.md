# Fase 0: Auditoria de Integrações - Supabase/Redis/BullMQ

**Data de Execução:** 13/11/2025  
**Responsável:** Diego R. (DevOps/SRE)  
**Status:** ⏳ Em andamento  
**Objetivo:** Validar configuração, conectividade e políticas de segurança das integrações críticas.

---

## 1. Auditoria Supabase

### 1.1. Informações do Projeto
- **Projeto ID:** `ofhzrdiadxigrvmrhaiz` (extraído de referências no código)
- **URL do Projeto:** `https://ofhzrdiadxigrvmrhaiz.supabase.co`
- **Região:** (a confirmar via dashboard Supabase)
- **Plano:** (a confirmar - Free/Pro/Enterprise)

### 1.2. Variáveis de Ambiente Requeridas
As seguintes variáveis são necessárias para operação completa:

| Variável | Status | Observação |
|----------|--------|------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ⚠️ A validar | URL pública do projeto |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ⚠️ A validar | Chave anônima (client-side) |
| `SUPABASE_SERVICE_ROLE_KEY` | ⚠️ A validar | Chave service role (server-only) |
| `DIRECT_DATABASE_URL` | ⚠️ A validar | Connection string PostgreSQL direto |

**Ação necessária:** Executar `scripts/validate-environment.ts` para verificar presença e validade das chaves.

### 1.3. Schema e Tabelas
Conforme `database-schema.sql`, as seguintes tabelas devem existir:

#### Tabelas Core
- [x] `users` (perfis de usuário estendidos)
- [x] `projects` (projetos de vídeo)
- [x] `slides` (slides normalizados de PPTX)
- [x] `render_jobs` (jobs de renderização)
- [x] `analytics_events` (eventos de tracking)
- [x] `nr_courses` (cursos - Nr sistema)
- [x] `nr_modules` (módulos de curso)

**Validação:** Executar query diagnóstico no Supabase SQL Editor:
```sql
SELECT 
    schemaname, 
    tablename, 
    tableowner 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
```

### 1.4. Row Level Security (RLS)
Conforme `database-rls-policies.sql`, as seguintes políticas devem estar ativas:

#### Status das Políticas
| Tabela | Política | Tipo | Status |
|--------|----------|------|--------|
| `users` | users_select_own | SELECT | ⚠️ A validar |
| `users` | users_update_own | UPDATE | ⚠️ A validar |
| `projects` | projects_isolation | ALL | ⚠️ A validar |
| `slides` | slides_isolation | ALL | ⚠️ A validar |
| `render_jobs` | jobs_isolation | ALL | ⚠️ A validar |
| `analytics_events` | events_select_own | SELECT | ⚠️ A validar |
| `analytics_events` | events_insert_own | INSERT | ⚠️ A validar |
| `nr_courses` | courses_public_select | SELECT | ⚠️ A validar |
| `nr_courses` | courses_admin_mutate | INSERT/UPDATE/DELETE | ⚠️ A validar |
| `nr_modules` | modules_public_select | SELECT | ⚠️ A validar |
| `nr_modules` | modules_admin_mutate | INSERT/UPDATE/DELETE | ⚠️ A validar |

**Validação:** Executar `scripts/rls-audit.ts` para verificar cobertura RLS:
```bash
npx ts-node --project tsconfig.audit.json scripts/rls-audit.ts
```

### 1.5. Storage Buckets
Os seguintes buckets devem estar criados:

| Bucket | Finalidade | Status | Políticas de Acesso |
|--------|-----------|--------|---------------------|
| `videos` | Vídeos renderizados finais | ⚠️ A validar | Público ou signed URLs |
| `avatars` | Avatares de usuários | ⚠️ A validar | Público leitura, escrita autenticada |
| `thumbnails` | Miniaturas de vídeos/slides | ⚠️ A validar | Público leitura |
| `assets` | Arquivos PPTX originais | ⚠️ A validar | Privado (owner only) |

**Validação:** Acessar Supabase Dashboard → Storage → verificar existência e políticas.

### 1.6. Funções e Triggers
Conforme schema, a seguinte função deve existir:

- [x] `is_admin()` - Verifica se usuário logado é administrador

**Validação:** Executar no SQL Editor:
```sql
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'is_admin';
```

### 1.7. Conectividade
**Testes necessários:**
1. Conexão via SDK JavaScript (`@supabase/supabase-js`)
2. Autenticação anônima (anon key)
3. Operação CRUD simples (ex: INSERT em `analytics_events`)
4. Query com RLS ativa (verificar isolamento)

**Script de teste:** Criar `scripts/test-supabase-connectivity.ts`

---

## 2. Auditoria Redis (Upstash)

### 2.1. Informações do Cluster
- **Provider:** Upstash Redis
- **Finalidade:** Fila BullMQ para jobs de renderização
- **Região:** (a confirmar)

### 2.2. Variáveis de Ambiente Requeridas
| Variável | Status | Observação |
|----------|--------|------------|
| `REDIS_URL` ou `UPSTASH_REDIS_REST_URL` | ⚠️ A validar | URL de conexão |
| `REDIS_TOKEN` ou `UPSTASH_REDIS_REST_TOKEN` | ⚠️ A validar | Token de autenticação |

### 2.3. Filas Configuradas
Conforme código, as seguintes filas devem existir:

| Fila | Finalidade | Arquivo Config |
|------|-----------|----------------|
| `render-queue` | Jobs de renderização de vídeo | `lib/queues/render-queue.ts` |

**Validação:** Verificar se arquivo `lib/queues/render-queue.ts` existe e está configurado corretamente.

### 2.4. Workers Ativos
| Worker | Arquivo | Status | Observação |
|--------|---------|--------|------------|
| Render Worker | `workers/render-worker.ts` | ⚠️ Manual | Precisa iniciar manualmente com `node workers/render-worker.ts` |

**Problema identificado:** Worker não tem auto-restart, health-check ou monitoramento ativo.

**Ação necessária:** 
- Criar script de inicialização com restart automático
- Implementar health-check endpoint
- Configurar monitoramento de filas (jobs parados, atrasados)

### 2.5. Conectividade
**Testes necessários:**
1. Conexão Redis via SDK
2. Criar job de teste na fila
3. Consumir job de teste
4. Verificar persistence de dados

**Script de teste:** Criar `scripts/test-redis-connectivity.ts`

---

## 3. Auditoria BullMQ

### 3.1. Configuração da Fila
Verificar em `lib/queues/render-queue.ts`:
- [x] Retry policy configurada
- [x] Timeout definido
- [x] Rate limiting (se aplicável)
- [ ] Dead Letter Queue (DLQ) para jobs falhados
- [ ] Métricas e observabilidade

### 3.2. Processamento de Jobs
Verificar em `workers/render-worker.ts`:
- [x] Handler de processamento implementado
- [x] Tratamento de erros
- [ ] Logging estruturado com `logger`
- [ ] Atualização de progresso (`job.updateProgress()`)
- [ ] Limpeza de recursos temporários

### 3.3. Métricas e Monitoramento
**Gaps identificados:**
- ❌ Não há dashboard BullMQ
- ❌ Não há alertas para filas paradas
- ❌ Não há métricas de throughput, latência
- ❌ Não há rastreamento de jobs com timeout

**Ação necessária:** Implementar na Fase 2
- Integrar BullMQ Board ou UI customizada
- Configurar alertas (Slack/e-mail)
- Exportar métricas para Grafana

---

## 4. Validação de Segurança

### 4.1. Secrets Management
| Secret | Tipo | Status | Risco |
|--------|------|--------|-------|
| Supabase Service Role Key | Alta sensibilidade | ⚠️ A validar armazenamento | Nunca expor no client |
| Redis Token | Média sensibilidade | ⚠️ A validar | Proteger em env server-only |
| Database URL | Alta sensibilidade | ⚠️ A validar | Apenas backend |

**Checklist:**
- [ ] Secrets não estão commitados no Git
- [ ] `.env.local` está em `.gitignore`
- [ ] Produção usa variáveis de ambiente do host (Vercel/Railway)
- [ ] Rotation policy definida (a cada 90 dias)

### 4.2. Rate Limiting
**Status atual:** Implementação utilitária em `lib/utils/rate-limit.ts`, mas endpoints não aplicam consistentemente.

**Ação necessária:**
- Revisar todos os endpoints `app/api/v1/**`
- Aplicar rate limit apropriado (ex: 10 req/min para `/video-jobs`)
- Testar com `scripts/test-contract-video-jobs-rate-limit.js`

### 4.3. CORS e CSP
**Validação necessária:**
- [ ] CORS configurado corretamente em `next.config.mjs`
- [ ] Content Security Policy (CSP) ativa
- [ ] Headers de segurança (HSTS, X-Frame-Options)

---

## 5. Resultados e Próximos Passos

### 5.1. Resumo de Gaps Críticos
| Gap | Severidade | Fase para Correção | Owner |
|-----|------------|-------------------|-------|
| Variáveis de ambiente não validadas | Alta | Fase 0 | Diego R. |
| RLS não auditada | Alta | Fase 0 | Diego R. |
| Buckets Supabase não criados | Alta | Fase 1 | Diego R. |
| Worker sem health-check/auto-restart | Média | Fase 2 | Diego R. + Bruno L. |
| Falta monitoramento BullMQ | Média | Fase 2 | Carla M. + Diego R. |
| Rate limiting inconsistente | Média | Fase 3 | Bruno L. |
| Secrets sem rotation policy | Baixa | Fase 4 | Ana S. + Diego R. |

### 5.2. Ações Imediatas (Fase 0)
1. **Executar `scripts/validate-environment.ts`** - validar env vars (até 15/01)
2. **Executar `scripts/rls-audit.ts`** - auditar políticas RLS (até 15/01)
3. **Verificar buckets Supabase** - criar se necessário (até 17/01)
4. **Criar scripts de teste de conectividade** - Supabase e Redis (até 17/01)
5. **Documentar configuração atual** - anexar screenshots e outputs ao relatório (até 19/01)

### 5.3. Evidências a Coletar
- [ ] Output de `validate-environment.ts`
- [ ] Output de `rls-audit.ts`
- [ ] Screenshot do Supabase Dashboard (tabelas + buckets)
- [ ] Screenshot do Redis/Upstash Dashboard (filas)
- [ ] Logs de testes de conectividade

### 5.4. Riscos Identificados
| Risco | Impacto | Probabilidade | Mitigação |
|-------|---------|---------------|-----------|
| RLS mal configurada → vazamento de dados | Alto | Média | Auditar RLS agora, testes de isolamento na Fase 2 |
| Worker render manual → jobs não processados | Alto | Alta | Health-check + auto-restart na Fase 2 |
| Falta monitoramento → incidentes não detectados | Médio | Alta | Alertas BullMQ/Redis na Fase 2 |
| Secrets expostos → comprometimento | Alto | Baixa | Auditoria Git history + rotation policy na Fase 1 |

---

## 6. Checklist de Conclusão

Para considerar esta auditoria concluída:
- [ ] Scripts `validate-environment.ts` e `rls-audit.ts` executados com sucesso
- [ ] Todos os buckets Supabase criados e políticas validadas
- [ ] Conectividade Supabase e Redis testada e documentada
- [ ] Gaps críticos (P0) documentados com plano de ação e owners
- [ ] Evidências anexadas em `evidencias/fase-0/`
- [ ] Relatório revisado por Bruno L. (Tech Lead)

---

**Registro de Mudanças:**
- 13/11/2025: Criação inicial do documento de auditoria.
- Pendente: Execução dos scripts e coleta de evidências.
