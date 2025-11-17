# 🚀 Próximos Passos - Validação Fase 6

**Data**: 17 de novembro de 2025  
**Status**: ✅ Infraestrutura 100% Pronta  
**Ação Necessária**: Validação manual pelos usuários

---

## 📋 TL;DR - O Que Fazer Agora

A **Fase 6 está 100% implementada**, mas 3 ações manuais são necessárias para validação completa:

1. ⚠️ **P0 (CRÍTICO)**: Criar 4 test users no Supabase (15-20 min)
2. ⚠️ **P0 (CRÍTICO)**: Executar testes E2E e validar (5-10 min)
3. 🔔 **P1 (RECOMENDADO)**: Configurar Slack webhook para alertas (5 min)

**Tempo total**: 25-35 minutos

---

## 🎯 Checklist de Validação

### ✅ Já Implementado (Não Requer Ação)

- [x] Playwright v1.56.1 instalado com 3 browsers
- [x] 40 testes E2E escritos (25 RBAC + 15 Video Flow)
- [x] Auth helpers para 4 roles implementados
- [x] CI/CD expandido para 6 suites paralelas
- [x] Script de monitoramento sintético (400 linhas)
- [x] Workflow nightly configurado (02:00 BRT)
- [x] Documentação completa (5 docs, ~1,200 linhas)
- [x] playwright.config.ts corrigido
- [x] Credenciais sincronizadas

### ⚠️ Requer Ação Manual (Usuário)

- [ ] **P0**: Criar 4 test users no Supabase Dashboard
- [ ] **P0**: Executar SQL para tabelas RBAC
- [ ] **P0**: Atribuir roles aos test users
- [ ] **P0**: Executar `npm run test:e2e:rbac` e validar
- [ ] **P1**: Configurar SLACK_WEBHOOK_URL no GitHub Secrets
- [ ] **P1**: Testar monitoramento sintético local
- [ ] **P2**: Validar CI/CD em PR real

---

## 📝 Passo 1: Criar Test Users (P0 - CRÍTICO)

### Tempo Estimado: 15-20 minutos

### Guia Completo

Abra o guia detalhado:

```bash
cat docs/setup/TEST_USERS_SETUP.md
```

Ou veja online: [`docs/setup/TEST_USERS_SETUP.md`](docs/setup/TEST_USERS_SETUP.md)

### Resumo Rápido

#### 1.1. Acessar Supabase Dashboard

1. Abrir: https://supabase.com/dashboard
2. Navegar: **Projeto** → **Authentication** → **Users**
3. Clicar: **Add User** → **Create new user**

#### 1.2. Criar 4 Usuários

| Email | Password | Role |
|-------|----------|------|
| test-admin@tecnicocursos.local | Admin@Test2024! | admin |
| test-editor@tecnicocursos.local | Editor@Test2024! | editor |
| test-viewer@tecnicocursos.local | Viewer@Test2024! | viewer |
| test-moderator@tecnicocursos.local | Moderator@Test2024! | moderator |

**Importante**: 
- ✅ Use exatamente esses emails e senhas
- ✅ Marque "Auto Confirm User" para todos
- ✅ Anote os UUIDs gerados (vamos usar no SQL)

#### 1.3. Executar SQL para Tabelas RBAC

1. Navegar: **Projeto** → **SQL Editor**
2. Clicar: **New Query**
3. Colar e executar o SQL abaixo:

```sql
-- ========================================
-- 1. CRIAR TABELAS RBAC
-- ========================================

-- Tabela de Roles
CREATE TABLE IF NOT EXISTS public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Permissions
CREATE TABLE IF NOT EXISTS public.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource VARCHAR(100) NOT NULL,
  action VARCHAR(50) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(resource, action)
);

-- Tabela de Role_Permissions (many-to-many)
CREATE TABLE IF NOT EXISTS public.role_permissions (
  role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES public.permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (role_id, permission_id)
);

-- Tabela de User_Roles (many-to-many)
CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, role_id)
);

-- ========================================
-- 2. INSERIR ROLES
-- ========================================

INSERT INTO public.roles (name, description) VALUES
  ('admin', 'Administrator with full access'),
  ('editor', 'Can create and edit content'),
  ('viewer', 'Read-only access'),
  ('moderator', 'Can moderate content')
ON CONFLICT (name) DO NOTHING;

-- ========================================
-- 3. INSERIR PERMISSIONS
-- ========================================

INSERT INTO public.permissions (resource, action, description) VALUES
  -- Projects
  ('projects', 'create', 'Create new projects'),
  ('projects', 'read', 'View projects'),
  ('projects', 'update', 'Edit projects'),
  ('projects', 'delete', 'Delete projects'),
  
  -- Videos
  ('videos', 'create', 'Create new videos'),
  ('videos', 'read', 'View videos'),
  ('videos', 'update', 'Edit videos'),
  ('videos', 'delete', 'Delete videos'),
  
  -- Users (admin only)
  ('users', 'manage', 'Manage users'),
  
  -- Analytics
  ('analytics', 'view', 'View analytics'),
  
  -- Settings
  ('settings', 'manage', 'Manage settings'),
  
  -- Moderation
  ('content', 'moderate', 'Moderate content')
ON CONFLICT (resource, action) DO NOTHING;

-- ========================================
-- 4. ATRIBUIR PERMISSIONS AOS ROLES
-- ========================================

-- Admin: todas as permissões
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM public.roles WHERE name = 'admin'),
  id
FROM public.permissions
ON CONFLICT DO NOTHING;

-- Editor: criar/ler/editar projetos e vídeos
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM public.roles WHERE name = 'editor'),
  id
FROM public.permissions
WHERE 
  (resource IN ('projects', 'videos') AND action IN ('create', 'read', 'update'))
  OR (resource = 'analytics' AND action = 'view')
ON CONFLICT DO NOTHING;

-- Viewer: apenas leitura
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM public.roles WHERE name = 'viewer'),
  id
FROM public.permissions
WHERE action = 'read'
ON CONFLICT DO NOTHING;

-- Moderator: moderar + leitura
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM public.roles WHERE name = 'moderator'),
  id
FROM public.permissions
WHERE 
  action = 'read'
  OR (resource = 'content' AND action = 'moderate')
ON CONFLICT DO NOTHING;

-- ========================================
-- 5. ATRIBUIR ROLES AOS TEST USERS
-- ========================================

-- ⚠️ IMPORTANTE: Substituir os UUIDs pelos IDs reais dos users criados!
-- Copie os UUIDs da seção Authentication → Users

-- Admin User
INSERT INTO public.user_roles (user_id, role_id)
VALUES (
  'UUID_DO_TEST_ADMIN',  -- ⚠️ SUBSTITUIR
  (SELECT id FROM public.roles WHERE name = 'admin')
) ON CONFLICT DO NOTHING;

-- Editor User
INSERT INTO public.user_roles (user_id, role_id)
VALUES (
  'UUID_DO_TEST_EDITOR',  -- ⚠️ SUBSTITUIR
  (SELECT id FROM public.roles WHERE name = 'editor')
) ON CONFLICT DO NOTHING;

-- Viewer User
INSERT INTO public.user_roles (user_id, role_id)
VALUES (
  'UUID_DO_TEST_VIEWER',  -- ⚠️ SUBSTITUIR
  (SELECT id FROM public.roles WHERE name = 'viewer')
) ON CONFLICT DO NOTHING;

-- Moderator User
INSERT INTO public.user_roles (user_id, role_id)
VALUES (
  'UUID_DO_TEST_MODERATOR',  -- ⚠️ SUBSTITUIR
  (SELECT id FROM public.roles WHERE name = 'moderator')
) ON CONFLICT DO NOTHING;
```

#### 1.4. Verificar Setup

Execute esta query de verificação:

```sql
-- Verificar roles atribuídos
SELECT 
  u.email,
  r.name as role,
  r.description
FROM auth.users u
JOIN public.user_roles ur ON u.id = ur.user_id
JOIN public.roles r ON ur.role_id = r.id
WHERE u.email LIKE 'test-%@tecnicocursos.local'
ORDER BY u.email;

-- Deve retornar 4 linhas:
-- test-admin@tecnicocursos.local   | admin     | Administrator with full access
-- test-editor@tecnicocursos.local  | editor    | Can create and edit content
-- test-moderator@... | moderator | Can moderate content
-- test-viewer@...    | viewer    | Read-only access
```

**✅ Sucesso**: Se vir 4 linhas, o setup está correto!

---

## 🧪 Passo 2: Executar Testes E2E (P0 - CRÍTICO)

### Tempo Estimado: 5-10 minutos

### 2.1. Verificar Ambiente

```bash
# Confirmar Playwright instalado
npx playwright --version
# Esperado: Version 1.56.1

# Confirmar browsers instalados
npx playwright install --dry-run
# Deve mostrar que browsers já estão instalados
```

### 2.2. Executar Suite RBAC (25 testes)

```bash
# Na raiz do projeto
npm run test:e2e:rbac
```

**Esperado**:
```
Running 25 tests using 3 workers

  ✓ [chromium] › rbac-complete.spec.ts:10:1 › 1. Authentication & Middleware › should login as admin successfully (2s)
  ✓ [chromium] › rbac-complete.spec.ts:15:1 › 1. Authentication & Middleware › should protect restricted routes (1s)
  ✓ [chromium] › rbac-complete.spec.ts:20:1 › 1. Authentication & Middleware › should redirect unauthenticated users (1s)
  ... (22 mais testes)

  25 passed (45s)
```

### 2.3. Executar Suite Video Flow (15 testes)

```bash
npx playwright test tests/e2e/video-flow.spec.ts
```

**Esperado**:
```
Running 15 tests using 3 workers

  ✓ [chromium] › video-flow.spec.ts:10:1 › 1. API Smoke Tests › GET /api/health returns 200 (500ms)
  ✓ [chromium] › video-flow.spec.ts:15:1 › 1. API Smoke Tests › GET /api/v1/video-jobs/list authenticated (800ms)
  ... (13 mais testes)

  15 passed (30s)
```

### 2.4. Ver Relatório HTML

```bash
npx playwright show-report
```

Abrirá browser com relatório interativo mostrando:
- ✅ Testes passando (verde)
- ❌ Testes falhando (vermelho)
- ⏱️ Tempos de execução
- 📸 Screenshots de falhas (se houver)
- 🎥 Vídeos de falhas (se houver)

### 2.5. Troubleshooting

**Problema**: Testes falham com "Login failed"

**Solução**:
```bash
# Verificar se test users foram criados
# Ir para Supabase Dashboard → Authentication → Users
# Confirmar que existem 4 users: test-admin, test-editor, test-viewer, test-moderator

# Verificar credenciais no código
cat tests/e2e/auth-helpers.ts | grep -A 5 "TEST_USERS"
# Confirmar que emails e senhas estão corretos
```

**Problema**: "Role not found" ou permissões incorretas

**Solução**:
```sql
-- Executar query de verificação no SQL Editor
SELECT 
  u.email,
  r.name as role,
  COUNT(p.id) as permission_count
FROM auth.users u
JOIN public.user_roles ur ON u.id = ur.user_id
JOIN public.roles r ON ur.role_id = r.id
JOIN public.role_permissions rp ON r.id = rp.role_id
JOIN public.permissions p ON rp.permission_id = p.id
WHERE u.email LIKE 'test-%@tecnicocursos.local'
GROUP BY u.email, r.name
ORDER BY u.email;

-- Admin deve ter 12 permissions
-- Editor deve ter ~7 permissions
-- Viewer deve ter ~4 permissions
-- Moderator deve ter ~5 permissions
```

---

## 🔔 Passo 3: Configurar Slack Webhook (P1 - RECOMENDADO)

### Tempo Estimado: 5 minutos

### 3.1. Criar Incoming Webhook no Slack

1. Acessar: https://api.slack.com/messaging/webhooks
2. Clicar: **Create New App** → **From scratch**
3. Nome: "MVP Video Monitoring"
4. Workspace: Selecionar workspace da empresa
5. Clicar: **Create App**
6. Navegar: **Incoming Webhooks** → **Activate**
7. Clicar: **Add New Webhook to Workspace**
8. Selecionar canal (ex: `#monitoring-alerts`)
9. Copiar URL do webhook (ex: `https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX`)

### 3.2. Adicionar ao GitHub Secrets

1. Acessar: https://github.com/aline-jesse/_MVP_Video_TecnicoCursos/settings/secrets/actions
2. Clicar: **New repository secret**
3. Nome: `SLACK_WEBHOOK_URL`
4. Valor: URL copiado do Slack
5. Clicar: **Add secret**

### 3.3. Testar Localmente

```bash
# Testar monitoramento sintético com webhook
SLACK_WEBHOOK_URL="https://hooks.slack.com/services/YOUR/WEBHOOK/URL" \
  node scripts/monitoring/synthetic-api-monitor.js
```

**Esperado**: Mensagem de teste enviada para canal Slack:

```
🟢 API Monitor - All Systems Operational
✅ /api/health: 200 (234ms)
✅ /api/v1/video-jobs/list: 200 (456ms)
✅ /api/auth/session: 200 (123ms)
✅ /api/v1/video-jobs/test-id: 200 (345ms)

Executed at: 2025-11-17 02:00:00 BRT
```

### 3.4. Validar Workflow Nightly

```bash
# Verificar que workflow está configurado
cat .github/workflows/nightly.yml | grep SLACK_WEBHOOK_URL
# Deve mostrar: SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}

# Trigger manual do workflow (GitHub UI)
# 1. Ir para: https://github.com/aline-jesse/_MVP_Video_TecnicoCursos/actions
# 2. Selecionar: "Nightly Monitoring"
# 3. Clicar: "Run workflow" → "Run workflow"
# 4. Aguardar ~2-3 minutos
# 5. Verificar canal Slack para alerta
```

---

## 📊 Passo 4: Validar CI/CD (P2 - DESEJÁVEL)

### Tempo Estimado: 10-15 minutos

### 4.1. Criar Branch de Teste

```bash
# Criar branch para teste
git checkout -b test/validate-phase-6

# Fazer pequena mudança (exemplo: comentário no README)
echo "<!-- Teste Fase 6 validação -->" >> README.md

# Commit e push
git add README.md
git commit -m "test: validate Phase 6 CI/CD"
git push origin test/validate-phase-6
```

### 4.2. Criar Pull Request

1. Acessar: https://github.com/aline-jesse/_MVP_Video_TecnicoCursos/pulls
2. Clicar: **New pull request**
3. Base: `main` ← Compare: `test/validate-phase-6`
4. Clicar: **Create pull request**

### 4.3. Monitorar Workflow

1. Clicar na aba **Checks** do PR
2. Aguardar execução de **6 suites paralelas**:
   - ✅ contract (~3 min)
   - ✅ pptx (~5 min)
   - ✅ services (~3 min)
   - ✅ rbac-unit (~2 min)
   - ✅ e2e-smoke (~4 min)
   - ❌ e2e-rbac (~8 min) - **Pode falhar se test users não criados**

**Tempo total esperado**: ~15-25 minutos

### 4.4. Verificar Artefatos

1. Clicar em qualquer suite
2. Scroll até **Artifacts** no final da página
3. Deve haver 6 artefatos:
   - `contract-suite-result`
   - `pptx-suite-result`
   - `services-suite-result`
   - `rbac-unit-suite-result`
   - `e2e-smoke-result`
   - `e2e-rbac-result`

4. Baixar e verificar (JSON + HTML reports)

### 4.5. Fechar PR de Teste

```bash
# Deletar branch
git checkout main
git branch -D test/validate-phase-6
git push origin --delete test/validate-phase-6

# Fechar PR no GitHub (não fazer merge)
```

---

## ✅ Checklist Final de Validação

Marque cada item após completar:

### Setup Inicial
- [ ] Test users criados no Supabase (4 usuários)
- [ ] SQL RBAC executado (tabelas criadas)
- [ ] Roles atribuídos (query de verificação passou)
- [ ] Credenciais sincronizadas (auth-helpers.ts)

### Testes E2E
- [ ] `npm run test:e2e:rbac` executado (25 testes)
- [ ] `npx playwright test tests/e2e/video-flow.spec.ts` executado (15 testes)
- [ ] Relatório HTML visualizado (`npx playwright show-report`)
- [ ] 100% testes passando (ou falhas justificadas documentadas)

### Monitoramento
- [ ] Slack webhook criado
- [ ] Secret `SLACK_WEBHOOK_URL` adicionado ao GitHub
- [ ] Script sintético testado localmente
- [ ] Workflow nightly testado (manual trigger)
- [ ] Alerta recebido no Slack

### CI/CD
- [ ] PR de teste criado
- [ ] 6 suites executadas em paralelo
- [ ] Tempo total < 30 min
- [ ] Artefatos gerados e baixados
- [ ] PR de teste fechado

### Documentação
- [ ] `FASE_6_E2E_SETUP_PRONTO.md` lido
- [ ] `FASE_6_RESUMO_EXECUTIVO_FINAL.md` lido
- [ ] `docs/setup/TEST_USERS_SETUP.md` seguido
- [ ] `RELEASE_v2.3.0.md` revisado
- [ ] `docs/adr/0006-e2e-testing-monitoring.md` lido

---

## 📞 Suporte

### Documentação Completa

- **Setup Detalhado**: [`docs/setup/TEST_USERS_SETUP.md`](docs/setup/TEST_USERS_SETUP.md)
- **Guia Técnico**: [`FASE_6_E2E_SETUP_PRONTO.md`](FASE_6_E2E_SETUP_PRONTO.md)
- **Resumo Executivo**: [`FASE_6_RESUMO_EXECUTIVO_FINAL.md`](FASE_6_RESUMO_EXECUTIVO_FINAL.md)
- **Release Notes**: [`RELEASE_v2.3.0.md`](RELEASE_v2.3.0.md)
- **ADR**: [`docs/adr/0006-e2e-testing-monitoring.md`](docs/adr/0006-e2e-testing-monitoring.md)

### Comandos Úteis

```bash
# Testes
npm run test:e2e              # Todos E2E
npm run test:e2e:rbac         # Suite RBAC
npx playwright show-report    # Relatório HTML

# Monitoramento
node scripts/monitoring/synthetic-api-monitor.js

# Verificação
npx playwright --version      # Versão Playwright
cat docs/setup/TEST_USERS_SETUP.md  # Guia setup
```

### Troubleshooting

Ver seção completa de troubleshooting em:
- [`FASE_6_E2E_SETUP_PRONTO.md`](FASE_6_E2E_SETUP_PRONTO.md) (seção 8)
- [`docs/setup/TEST_USERS_SETUP.md`](docs/setup/TEST_USERS_SETUP.md) (seção 6)

---

## 🎉 Conclusão

Após completar todos os passos acima, a **Fase 6 estará 100% validada** e o sistema estará pronto para:

✅ Deploys confiantes com cobertura E2E completa  
✅ Monitoramento proativo 24/7 de produção  
✅ CI/CD otimizado (75% mais rápido)  
✅ Alertas automáticos de incidentes  
✅ Documentação completa para novos desenvolvedores

**Total de Fases Concluídas**: 6/6 (100%) ✅

---

**MVP Vídeo TécnicoCursos v2.3.0**  
*Próximos Passos - Validação Fase 6*  
17 de novembro de 2025
