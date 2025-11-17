# 🎯 Guia de Implementação RBAC

## Visão Geral

Sistema completo de controle de acesso baseado em papéis (RBAC) com:
- 4 roles predefinidos
- 24 permissões granulares
- RLS policies no Supabase
- APIs de administração
- UI de gerenciamento

---

## 📋 Checklist de Implementação

### 1. Preparação ✅

- [x] Schema SQL criado (`database-rbac-seed.sql`)
- [x] RLS policies criadas (`database-rbac-rls.sql`)
- [x] APIs de admin implementadas
- [x] UI de gerenciamento criada (`/dashboard/admin/roles`)
- [x] Script de aplicação desenvolvido

### 2. Aplicação no Banco de Dados

```bash
# Opção 1: Via script automatizado (recomendado)
npm run rbac:apply

# Opção 2: Manual via Supabase SQL Editor
# 1. Acesse https://supabase.com/dashboard/project/SEU_PROJECT/sql
# 2. Copie e execute database-rbac-seed.sql
# 3. Copie e execute database-rbac-rls.sql
```

### 3. Verificação

```sql
-- Verificar roles criadas
SELECT * FROM roles ORDER BY name;

-- Verificar permissões
SELECT * FROM permissions ORDER BY name;

-- Verificar associações role-permission
SELECT 
  r.name as role,
  p.name as permission
FROM role_permissions rp
JOIN roles r ON r.id = rp.role_id
JOIN permissions p ON p.id = rp.permission_id
ORDER BY r.name, p.name;

-- Verificar políticas RLS
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### 4. Teste das Funcionalidades

#### 4.1 Atribuir Role a Usuário

```typescript
// Via API
const response = await fetch('/api/admin/users/USER_ID/roles', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ role: 'admin' })
});
```

#### 4.2 Verificar Permissões

```sql
-- Ver roles de um usuário
SELECT 
  u.id,
  u.email,
  r.name as role
FROM users u
LEFT JOIN user_roles ur ON ur.user_id = u.id
LEFT JOIN roles r ON r.id = ur.role_id
WHERE u.id = 'USER_ID';

-- Verificar permissões de um usuário
SELECT user_has_permission('USER_ID', 'users.edit');
```

#### 4.3 Testar RLS

```sql
-- Como usuário normal (deve ver apenas próprio registro)
SET ROLE authenticated;
SET request.jwt.claims.sub TO 'USER_ID';
SELECT * FROM users; -- Deve ver apenas 1 registro

-- Como admin (deve ver todos)
SET ROLE authenticated;
SET request.jwt.claims.sub TO 'ADMIN_USER_ID';
SELECT * FROM users; -- Deve ver todos
```

---

## 🎭 Roles e Permissões

### Roles Padrão

| Role | Descrição | Uso Típico |
|------|-----------|------------|
| **admin** | Acesso total ao sistema | Administradores da plataforma |
| **editor** | Criar e editar conteúdo | Criadores de cursos e vídeos |
| **viewer** | Somente leitura | Consumidores de conteúdo |
| **moderator** | Gestão de conteúdo e usuários | Moderadores e gestores |

### Matriz de Permissões

| Permissão | admin | editor | viewer | moderator |
|-----------|-------|--------|--------|-----------|
| **users.*** | ✅ | ❌ | ❌ | ✅ view/edit |
| **projects.*** | ✅ | ✅ | ✅ view | ✅ |
| **videos.*** | ✅ | ✅ | ✅ view | ✅ |
| **courses.*** | ✅ | ✅ | ✅ view | ✅ |
| **modules.*** | ✅ | ✅ | ✅ view | ✅ |
| **analytics.*** | ✅ | ❌ | ❌ | ✅ |
| **settings.*** | ✅ | ❌ | ❌ | ❌ |

---

## 🔧 Integração no Código

### Verificar Permissão em API Route

```typescript
import { createServerClient } from '@/lib/services';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const supabase = createServerClient();
  
  // Obter usuário atual
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verificar permissão
  const { data: hasPermission } = await supabase
    .rpc('user_has_permission', {
      user_id: user.id,
      permission_name: 'analytics.view'
    });

  if (!hasPermission) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Continuar com lógica...
}
```

### Verificar Role em Componente

```typescript
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/services';

export function AdminPanel() {
  const [isAdmin, setIsAdmin] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function checkRole() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .rpc('user_role')
        .eq('user_id', user.id);

      setIsAdmin(data?.some(r => r.role === 'admin') || false);
    }

    checkRole();
  }, []);

  if (!isAdmin) {
    return <div>Acesso negado</div>;
  }

  return <div>Painel administrativo...</div>;
}
```

---

## 📊 Monitoramento

### Métricas Importantes

```sql
-- Distribuição de roles
SELECT r.name, COUNT(ur.user_id) as user_count
FROM roles r
LEFT JOIN user_roles ur ON ur.role_id = r.id
GROUP BY r.name
ORDER BY user_count DESC;

-- Usuários sem roles
SELECT u.id, u.email
FROM users u
LEFT JOIN user_roles ur ON ur.user_id = u.id
WHERE ur.role_id IS NULL;

-- Logs de mudança de roles (se implementado)
SELECT * FROM audit_logs
WHERE event_type = 'role_assigned'
ORDER BY created_at DESC
LIMIT 100;
```

---

## 🚨 Troubleshooting

### Problema: Usuário não consegue acessar recurso

**Diagnóstico:**
```sql
-- 1. Verificar roles do usuário
SELECT * FROM user_roles WHERE user_id = 'USER_ID';

-- 2. Verificar permissões da role
SELECT p.name
FROM role_permissions rp
JOIN permissions p ON p.id = rp.permission_id
WHERE rp.role_id = (
  SELECT role_id FROM user_roles WHERE user_id = 'USER_ID' LIMIT 1
);

-- 3. Testar função de permissão
SELECT user_has_permission('USER_ID', 'PERMISSION_NAME');
```

**Solução:**
- Atribuir role adequada via `/dashboard/admin/roles`
- Ou via API: `POST /api/admin/users/{id}/roles`

### Problema: RLS bloqueando operação legítima

**Diagnóstico:**
```sql
-- Verificar políticas ativas
SELECT * FROM pg_policies
WHERE tablename = 'NOME_DA_TABELA';

-- Testar política manualmente
SET ROLE authenticated;
SET request.jwt.claims.sub TO 'USER_ID';
SELECT * FROM TABELA; -- Deve funcionar se RLS estiver correto
```

**Solução:**
- Revisar `database-rbac-rls.sql`
- Ajustar lógica das policies
- Re-aplicar com `npm run rbac:apply`

---

## 🔄 Manutenção

### Adicionar Nova Permissão

1. **Adicionar ao seed:**
```sql
-- Em database-rbac-seed.sql
INSERT INTO permissions (name, description) 
VALUES ('new_resource.action', 'Descrição da permissão');

-- Associar a roles relevantes
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'admin' AND p.name = 'new_resource.action';
```

2. **Re-aplicar:**
```bash
npm run rbac:apply
```

### Adicionar Nova Role

1. **Adicionar ao seed:**
```sql
INSERT INTO roles (name, description)
VALUES ('new_role', 'Descrição da nova role');

-- Atribuir permissões
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'new_role' 
  AND p.name IN ('permission1', 'permission2');
```

2. **Atualizar RLS se necessário**

3. **Re-aplicar:**
```bash
npm run rbac:apply
```

---

## 📚 Referências

- **Schema:** `database-schema.sql` (tabelas base)
- **Seeds:** `database-rbac-seed.sql` (dados iniciais)
- **RLS:** `database-rbac-rls.sql` (políticas de segurança)
- **APIs:** `estudio_ia_videos/app/api/admin/**`
- **UI:** `estudio_ia_videos/app/dashboard/admin/roles/page.tsx`
- **Script:** `scripts/apply-rbac-schema.ts`

---

## ✅ Checklist Pós-Implementação

- [ ] Schema aplicado com sucesso
- [ ] Roles e permissões verificadas no banco
- [ ] Políticas RLS ativas e testadas
- [ ] Usuário admin criado e testado
- [ ] UI de gerenciamento acessível
- [ ] APIs de admin respondendo corretamente
- [ ] Documentação atualizada
- [ ] Equipe treinada no novo sistema

---

**Última atualização:** 17/11/2025  
**Versão:** 1.0.0  
**Status:** ✅ Pronto para produção
