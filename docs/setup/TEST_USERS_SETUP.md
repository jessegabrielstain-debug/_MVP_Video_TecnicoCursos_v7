# 🧪 Setup de Usuários de Teste E2E

## Visão Geral
Para executar os testes E2E de RBAC, precisamos criar 4 usuários de teste no Supabase com diferentes roles:
- **admin**: Acesso completo ao sistema
- **editor**: Pode criar e editar projetos/vídeos
- **viewer**: Apenas visualização (read-only)
- **moderator**: Pode moderar conteúdo

## Opção 1: Criação Manual via Supabase Dashboard ⚡ (Recomendado)

### Passo 1: Acessar Supabase Dashboard
1. Abra [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Vá em **Authentication** → **Users**

### Passo 2: Criar 4 Usuários
Clique em **Add User** e crie cada um dos seguintes:

#### Usuário 1: Admin
```
Email: test-admin@tecnicocursos.local
Password: Admin@Test2024!
Auto Confirm: ✅ Yes
```

#### Usuário 2: Editor
```
Email: test-editor@tecnicocursos.local
Password: Editor@Test2024!
Auto Confirm: ✅ Yes
```

#### Usuário 3: Viewer
```
Email: test-viewer@tecnicocursos.local
Password: Viewer@Test2024!
Auto Confirm: ✅ Yes
```

#### Usuário 4: Moderator
```
Email: test-moderator@tecnicocursos.local
Password: Moderator@Test2024!
Auto Confirm: ✅ Yes
```

### Passo 3: Aplicar Roles (SQL Editor)

Após criar os 4 usuários, execute no **SQL Editor**:

```sql
-- 1. Criar tabelas RBAC (se não existirem)
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource TEXT NOT NULL,
  action TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(resource, action)
);

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS user_roles (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, role_id)
);

-- 2. Criar roles
INSERT INTO roles (name, description) VALUES
  ('admin', 'Administrador com acesso total ao sistema'),
  ('editor', 'Editor que pode criar e modificar projetos e vídeos'),
  ('viewer', 'Visualizador com acesso somente leitura'),
  ('moderator', 'Moderador que pode gerenciar conteúdo')
ON CONFLICT (name) DO NOTHING;

-- 3. Criar permissões básicas
INSERT INTO permissions (resource, action, description) VALUES
  ('projects', 'create', 'Criar novos projetos'),
  ('projects', 'read', 'Visualizar projetos'),
  ('projects', 'update', 'Editar projetos'),
  ('projects', 'delete', 'Deletar projetos'),
  ('videos', 'create', 'Criar novos vídeos'),
  ('videos', 'read', 'Visualizar vídeos'),
  ('videos', 'update', 'Editar vídeos'),
  ('videos', 'delete', 'Deletar vídeos'),
  ('users', 'read', 'Visualizar usuários'),
  ('users', 'update', 'Editar usuários'),
  ('analytics', 'read', 'Visualizar analytics'),
  ('admin', 'access', 'Acessar painel administrativo')
ON CONFLICT (resource, action) DO NOTHING;

-- 4. Atribuir permissões aos roles
-- Admin: todas as permissões
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'admin'
ON CONFLICT DO NOTHING;

-- Editor: criar/ler/atualizar projetos e vídeos
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'editor'
  AND p.resource IN ('projects', 'videos')
  AND p.action IN ('create', 'read', 'update')
ON CONFLICT DO NOTHING;

-- Viewer: apenas leitura
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'viewer'
  AND p.action = 'read'
ON CONFLICT DO NOTHING;

-- Moderator: ler/atualizar/deletar projetos e vídeos
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'moderator'
  AND p.resource IN ('projects', 'videos', 'users')
  AND p.action IN ('read', 'update', 'delete')
ON CONFLICT DO NOTHING;

-- 5. Atribuir roles aos usuários de teste
-- IMPORTANTE: Substitua os UUIDs pelos IDs reais dos usuários criados
-- Você pode obter os IDs executando: SELECT id, email FROM auth.users;

-- Exemplo (AJUSTE OS UUIDs):
INSERT INTO user_roles (user_id, role_id)
SELECT 
  u.id as user_id,
  r.id as role_id
FROM auth.users u
CROSS JOIN roles r
WHERE 
  (u.email = 'test-admin@tecnicocursos.local' AND r.name = 'admin')
  OR (u.email = 'test-editor@tecnicocursos.local' AND r.name = 'editor')
  OR (u.email = 'test-viewer@tecnicocursos.local' AND r.name = 'viewer')
  OR (u.email = 'test-moderator@tecnicocursos.local' AND r.name = 'moderator')
ON CONFLICT DO NOTHING;
```

### Passo 4: Verificar Setup
Execute para confirmar:

```sql
-- Ver todos os usuários com seus roles
SELECT 
  u.email,
  r.name as role,
  r.description
FROM auth.users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
WHERE u.email LIKE '%@tecnicocursos.local'
ORDER BY u.email;
```

Resultado esperado:
```
test-admin@tecnicocursos.local     | admin     | Administrador com acesso total
test-editor@tecnicocursos.local    | editor    | Editor que pode criar e modificar
test-viewer@tecnicocursos.local    | viewer    | Visualizador com acesso somente leitura
test-moderator@tecnicocursos.local | moderator | Moderador que pode gerenciar conteúdo
```

## Opção 2: Script Automatizado (DATABASE_URL necessária)

Se você tiver `DATABASE_URL` ou `DIRECT_DATABASE_URL` configurada em `estudio_ia_videos/app/.env.local`:

```bash
npm run rbac:apply
```

## Credenciais de Teste

| Role      | Email                              | Senha               |
|-----------|------------------------------------|---------------------|
| Admin     | test-admin@tecnicocursos.local     | Admin@Test2024!     |
| Editor    | test-editor@tecnicocursos.local    | Editor@Test2024!    |
| Viewer    | test-viewer@tecnicocursos.local    | Viewer@Test2024!    |
| Moderator | test-moderator@tecnicocursos.local | Moderator@Test2024! |

## Após Setup Completo

Execute os testes E2E:

```bash
# Testes RBAC (25 testes)
npm run test:e2e:rbac

# Testes de fluxo de vídeo (15 testes)
npx playwright test tests/e2e/video-flow.spec.ts

# Todos os testes E2E
npx playwright test
```

## Troubleshooting

### Erro: "User already exists"
- Ignore - os usuários já foram criados

### Erro: "Role not found"
- Execute a parte de criação de roles do SQL acima

### Erro: "Invalid login credentials"
- Verifique se os usuários foram criados com "Auto Confirm: Yes"
- Resete a senha no dashboard se necessário

### Testes falhando
- Verifique se NEXT_PUBLIC_SUPABASE_URL está configurada em `.env.local`
- Verifique se SUPABASE_SERVICE_ROLE_KEY está configurada (para limpeza de teste)
- Confirme que os 4 usuários existem e estão confirmados

## Limpeza (Opcional)

Para remover os usuários de teste:

```sql
-- Remover roles atribuídos
DELETE FROM user_roles 
WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE email LIKE '%@tecnicocursos.local'
);

-- Remover usuários (Supabase Dashboard → Authentication → Users → Delete)
```

## Próximos Passos

✅ Usuários criados
✅ Roles atribuídas
✅ Permissões configuradas

Agora você pode:
1. **Executar testes E2E**: `npm run test:e2e:rbac`
2. **Testar manualmente**: Login com cada usuário e validar permissões
3. **Ver relatório HTML**: `npx playwright show-report`

---

**Nota de Segurança**: Esses usuários são APENAS para testes locais/staging. Nunca use essas credenciais em produção.
