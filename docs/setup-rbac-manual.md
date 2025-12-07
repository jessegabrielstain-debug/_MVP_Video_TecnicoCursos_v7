# Setup Manual RBAC - Supabase Dashboard

## 🎯 Objetivo
Criar sistema RBAC (Role-Based Access Control) com 4 roles e 14 permissions.

---

## 📋 Pré-requisitos

- [ ] Acesso ao Supabase Dashboard
- [ ] Permissão de admin no projeto
- [ ] SQL Editor disponível

---

## 🚀 Passo a Passo

### 1️⃣ Criar Schema RBAC (5 min)

1. Acesse **Supabase Dashboard** → Seu Projeto
2. Clique em **SQL Editor** (menu lateral)
3. Clique em **+ New Query**
4. Copie o conteúdo de `database-rbac-complete.sql` (350 linhas)
5. Cole no editor e clique em **RUN**
6. Aguarde conclusão (~10s)

**✅ Sucesso esperado:**
```
Query executed successfully
Rows affected: 0
```

**❌ Erros comuns:**
- `relation "roles" already exists` → OK, pode ignorar (idempotente)
- `permission denied` → Verificar se está usando service_role_key

---

### 2️⃣ Verificar Criação das Tabelas (2 min)

Execute no SQL Editor:

```sql
-- Verificar tabelas criadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('roles', 'permissions', 'role_permissions', 'user_roles')
ORDER BY table_name;
```

**✅ Resultado esperado:**
```
permissions
role_permissions
roles
user_roles
```

---

### 3️⃣ Verificar Roles Criadas (1 min)

```sql
SELECT id, name, description 
FROM roles 
ORDER BY name;
```

**✅ Resultado esperado:**
```
id   | name      | description
-----|-----------|--------------------
1    | admin     | Administrador total
2    | editor    | Criar/editar conteúdo
3    | moderator | Moderar conteúdo
4    | viewer    | Visualização apenas
```

---

### 4️⃣ Verificar Permissions Criadas (1 min)

```sql
SELECT id, name, description 
FROM permissions 
ORDER BY name;
```

**✅ Resultado esperado:** 14 permissions
```
analytics_admin
analytics_read
projects_admin
projects_delete
projects_read
projects_write
users_admin
users_delete
users_read
users_write
videos_admin
videos_delete
videos_read
videos_write
```

---

### 5️⃣ Criar Usuários de Teste (3 min)

1. Abra **SQL Editor** → **+ New Query**
2. Copie o conteúdo de `database-seed-test-users.sql`
3. **IMPORTANTE:** Edite os emails se quiser usar emails reais
4. Cole no editor e clique em **RUN**

**✅ Verificar criação:**
```sql
SELECT 
  u.email,
  r.name as role,
  ARRAY_AGG(p.name) as permissions
FROM auth.users u
JOIN user_roles ur ON ur.user_id = u.id::text
JOIN roles r ON r.id = ur.role_id
JOIN role_permissions rp ON rp.role_id = r.id
JOIN permissions p ON p.id = rp.permission_id
WHERE u.email LIKE '%@mvpvideo.test'
GROUP BY u.email, r.name
ORDER BY u.email;
```

**✅ Resultado esperado:**
```
email                      | role      | permissions
---------------------------|-----------|------------------
admin@mvpvideo.test        | admin     | {analytics_admin, projects_admin, ...}
editor@mvpvideo.test       | editor    | {projects_read, projects_write, ...}
moderator@mvpvideo.test    | moderator | {projects_read, videos_admin, ...}
viewer@mvpvideo.test       | viewer    | {analytics_read, projects_read, ...}
```

---

### 6️⃣ Testar Permissões (5 min)

#### Teste 1: Verificar se função helper funciona

```sql
-- Testar user_has_permission (deve retornar true)
SELECT user_has_permission(
  (SELECT id::text FROM auth.users WHERE email = 'admin@mvpvideo.test'),
  'projects_admin'
) as has_permission;
```

**✅ Esperado:** `true`

#### Teste 2: RLS em ação

```sql
-- Admin deve ver TODOS os projetos
SET request.jwt.claims TO '{"sub": "ID_DO_ADMIN_AQUI"}';
SELECT COUNT(*) FROM projects;

-- Viewer deve ver apenas seus projetos
SET request.jwt.claims TO '{"sub": "ID_DO_VIEWER_AQUI"}';
SELECT COUNT(*) FROM projects WHERE user_id = 'ID_DO_VIEWER_AQUI';
```

---

## 🧪 Testes E2E (Opcional, 10 min)

### Login com Usuários de Teste

1. Acesse sua aplicação: `http://localhost:3000`
2. Clique em **Login**
3. Use credenciais:
   - **Admin:** `admin@mvpvideo.test` / `senha123`
   - **Editor:** `editor@mvpvideo.test` / `senha123`
   - **Viewer:** `viewer@mvpvideo.test` / `senha123`

### Verificar Comportamento por Role

| Action | Admin | Editor | Viewer |
|--------|-------|--------|--------|
| Ver Dashboard | ✅ | ✅ | ✅ |
| Criar Projeto | ✅ | ✅ | ❌ |
| Editar Projeto Próprio | ✅ | ✅ | ❌ |
| Editar Projeto de Outros | ✅ | ❌ | ❌ |
| Deletar Projeto | ✅ | ❌ | ❌ |
| Ver Analytics | ✅ | ✅ | ✅ |
| Gerenciar Usuários | ✅ | ❌ | ❌ |

---

## 🔧 Troubleshooting

### Problema: "permission denied for table projects"

**Causa:** RLS policies não aplicadas corretamente

**Solução:**
```sql
-- Forçar recriação das policies
DROP POLICY IF EXISTS "users_select_own_projects" ON projects;
DROP POLICY IF EXISTS "admins_all_projects" ON projects;

-- Re-executar database-rbac-complete.sql (seção de policies)
```

---

### Problema: "function user_has_permission does not exist"

**Causa:** Funções helper não criadas

**Solução:**
```sql
-- Verificar se funções existem
SELECT proname 
FROM pg_proc 
WHERE proname IN ('user_has_role', 'user_has_permission', 'get_user_permissions');

-- Se não existir, re-executar database-rbac-complete.sql
```

---

### Problema: Usuários de teste não conseguem fazer login

**Causa:** Usuários criados via INSERT direto não passam por validação Supabase Auth

**Solução Alternativa:**
1. Acesse **Supabase Dashboard** → **Authentication** → **Users**
2. Clique em **Add User** (manualmente)
3. Preencha email/senha
4. Depois execute SQL para atribuir role:

```sql
INSERT INTO user_roles (user_id, role_id)
VALUES (
  'UUID_DO_USUARIO_AQUI',
  (SELECT id FROM roles WHERE name = 'admin')
);
```

---

## 📊 Queries Úteis de Monitoramento

### Usuários por Role
```sql
SELECT 
  r.name as role,
  COUNT(DISTINCT ur.user_id) as user_count
FROM roles r
LEFT JOIN user_roles ur ON ur.role_id = r.id
GROUP BY r.name
ORDER BY user_count DESC;
```

### Permissions por Role
```sql
SELECT 
  r.name as role,
  ARRAY_AGG(p.name ORDER BY p.name) as permissions
FROM roles r
JOIN role_permissions rp ON rp.role_id = r.id
JOIN permissions p ON p.id = rp.permission_id
GROUP BY r.name
ORDER BY r.name;
```

### Audit: Últimas Atribuições de Role
```sql
SELECT 
  ur.created_at,
  u.email,
  r.name as role_assigned
FROM user_roles ur
JOIN auth.users u ON u.id::text = ur.user_id
JOIN roles r ON r.id = ur.role_id
ORDER BY ur.created_at DESC
LIMIT 20;
```

---

## ✅ Checklist Final

- [ ] Tabelas `roles`, `permissions`, `role_permissions`, `user_roles` criadas
- [ ] 4 roles existem (admin, editor, moderator, viewer)
- [ ] 14 permissions existem
- [ ] Funções helper funcionando (`user_has_permission`, etc)
- [ ] RLS policies ativas em `projects`, `render_jobs`, etc
- [ ] Usuários de teste criados e com roles atribuídas
- [ ] Login funciona com usuários teste
- [ ] Permissões respeitadas na UI (admin vê mais que viewer)

---

## 📚 Recursos Adicionais

- **Documentação RBAC:** `docs/rbac-architecture.md`
- **SQL Completo:** `database-rbac-complete.sql`
- **Seed de Teste:** `database-seed-test-users.sql`
- **Queries Dashboard:** `docs/supabase-dashboard-queries.md`

---

_Tempo total estimado: 15-20 minutos_  
_Última atualização: 2025-11-17_
