# 🛡️ Guia de Uso do Sistema RBAC

## Visão Geral

O sistema RBAC (Role-Based Access Control) fornece controle granular de acesso baseado em roles e permissões, integrado com Supabase RLS.

## Componentes Principais

### 1. Middleware de Autenticação

Protege automaticamente rotas `/dashboard/admin/**` e `/api/admin/**`:

```typescript
// estudio_ia_videos/app/middleware.ts
// Verifica autenticação e role admin usando função RLS is_admin()
```

**Comportamento:**
- Redireciona para `/login` se não autenticado
- Redireciona para `/dashboard` se não é admin
- Adiciona headers de segurança em todas as respostas

### 2. Hooks React

#### `usePermission(permission)`

Verifica se usuário tem permissão específica:

```tsx
import { usePermission } from '@/lib/hooks/use-rbac'

function DeleteButton({ videoId }) {
  const { hasPermission, loading } = usePermission('videos.delete')
  
  if (loading) return <Spinner />
  if (!hasPermission) return null
  
  return <button onClick={() => deleteVideo(videoId)}>Deletar</button>
}
```

#### `useIsAdmin()`

Verifica se usuário é administrador:

```tsx
import { useIsAdmin } from '@/lib/hooks/use-rbac'

function AdminMenu() {
  const { isAdmin, loading } = useIsAdmin()
  
  if (!isAdmin) return null
  
  return (
    <nav>
      <Link href="/dashboard/admin">Painel Admin</Link>
    </nav>
  )
}
```

#### `useRole()`

Obtém role atual do usuário:

```tsx
import { useRole } from '@/lib/hooks/use-rbac'

function UserBadge() {
  const { role, loading } = useRole()
  
  return <Badge>{role || 'viewer'}</Badge>
}
```

#### `useUserRoles()`

Obtém todos os roles do usuário:

```tsx
import { useUserRoles } from '@/lib/hooks/use-rbac'

function RolesList() {
  const { roles, loading } = useUserRoles()
  
  return (
    <div>
      {roles.map(role => <Badge key={role}>{role}</Badge>)}
    </div>
  )
}
```

#### `useHasRole(requiredRoles)`

Verifica se usuário tem pelo menos um dos roles:

```tsx
import { useHasRole } from '@/lib/hooks/use-rbac'

function EditorTools() {
  const { hasRole } = useHasRole(['admin', 'editor'])
  
  if (!hasRole) return <div>Sem acesso</div>
  
  return <VideoEditor />
}
```

### 3. HOCs (Higher-Order Components)

#### `withPermission(permission, Component, options)`

Protege componente por permissão:

```tsx
import { withPermission } from '@/lib/components/rbac'

const VideoEditor = ({ videoId }) => {
  return <div>Editor de vídeo {videoId}</div>
}

// Versão protegida
export default withPermission('videos.edit', VideoEditor, {
  fallback: () => <div>Sem permissão para editar vídeos</div>,
  loading: () => <Spinner />
})
```

#### `withRole(roles, Component, options)`

Protege componente por role:

```tsx
import { withRole } from '@/lib/components/rbac'

const AdminPanel = () => {
  return <div>Painel administrativo</div>
}

// Apenas admin e moderator
export default withRole(['admin', 'moderator'], AdminPanel, {
  fallback: () => <div>Acesso restrito</div>
})
```

#### `withAdminOnly(Component, options)`

Protege componente para admin apenas:

```tsx
import { withAdminOnly } from '@/lib/components/rbac'

const SystemSettings = () => {
  return <div>Configurações do sistema</div>
}

export default withAdminOnly(SystemSettings)
```

### 4. Componentes Gate

#### `<PermissionGate>`

Renderização condicional por permissão:

```tsx
import { PermissionGate } from '@/lib/components/rbac'

function VideoActions({ videoId }) {
  return (
    <div>
      <PermissionGate permission="videos.edit">
        <button>Editar</button>
      </PermissionGate>
      
      <PermissionGate 
        permission="videos.delete"
        fallback={<button disabled>Sem permissão</button>}
      >
        <button>Deletar</button>
      </PermissionGate>
    </div>
  )
}
```

#### `<RoleGate>`

Renderização condicional por role:

```tsx
import { RoleGate } from '@/lib/components/rbac'

function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>
      
      <RoleGate roles={['admin', 'editor']}>
        <EditorPanel />
      </RoleGate>
      
      <RoleGate 
        roles="viewer"
        fallback={<div>Assine para acessar</div>}
      >
        <ViewerContent />
      </RoleGate>
    </div>
  )
}
```

#### `<AdminGate>`

Renderização condicional para admin:

```tsx
import { AdminGate } from '@/lib/components/rbac'

function Settings() {
  return (
    <div>
      <h1>Configurações</h1>
      
      <AdminGate fallback={<div>Área restrita</div>}>
        <SystemConfiguration />
      </AdminGate>
    </div>
  )
}
```

## Roles e Permissões

### Roles Disponíveis

| Role | Descrição | Nível de Acesso |
|------|-----------|-----------------|
| `admin` | Administrador | Total |
| `editor` | Editor de conteúdo | Criar/editar conteúdo |
| `viewer` | Visualizador | Somente leitura |
| `moderator` | Moderador | Gerenciar usuários e conteúdo |

### Permissões por Domínio

#### Usuários (`users.*`)
- `users.read` - Visualizar usuários
- `users.create` - Criar usuários
- `users.update` - Atualizar usuários
- `users.delete` - Deletar usuários
- `users.manage_roles` - Gerenciar roles

#### Projetos (`projects.*`)
- `projects.read` - Visualizar projetos
- `projects.create` - Criar projetos
- `projects.update` - Atualizar projetos
- `projects.delete` - Deletar projetos

#### Vídeos (`videos.*`)
- `videos.read` - Visualizar vídeos
- `videos.create` - Criar vídeos
- `videos.edit` - Editar vídeos
- `videos.delete` - Deletar vídeos
- `videos.publish` - Publicar vídeos

#### Cursos (`courses.*`)
- `courses.read` - Visualizar cursos
- `courses.create` - Criar cursos
- `courses.update` - Atualizar cursos
- `courses.delete` - Deletar cursos

#### Módulos (`modules.*`)
- `modules.read` - Visualizar módulos
- `modules.create` - Criar módulos
- `modules.update` - Atualizar módulos
- `modules.delete` - Deletar módulos

#### Analytics (`analytics.*`)
- `analytics.view` - Visualizar analytics
- `analytics.export` - Exportar dados

#### Configurações (`settings.*`)
- `settings.read` - Visualizar configurações
- `settings.update` - Atualizar configurações

## Matriz Role × Permissões

| Permissão | Admin | Editor | Moderator | Viewer |
|-----------|:-----:|:------:|:---------:|:------:|
| users.read | ✅ | ❌ | ✅ | ❌ |
| users.create | ✅ | ❌ | ❌ | ❌ |
| users.update | ✅ | ❌ | ✅ | ❌ |
| users.delete | ✅ | ❌ | ❌ | ❌ |
| users.manage_roles | ✅ | ❌ | ❌ | ❌ |
| projects.* | ✅ | ✅ | ✅ | Read only |
| videos.* | ✅ | ✅ | ✅ | Read only |
| courses.* | ✅ | ✅ | Read only | Read only |
| modules.* | ✅ | ✅ | Read only | Read only |
| analytics.view | ✅ | ✅ | ✅ | ❌ |
| analytics.export | ✅ | ❌ | ❌ | ❌ |
| settings.* | ✅ | ❌ | ❌ | ❌ |

## Exemplos Práticos

### Proteger uma Página Inteira

```tsx
// app/dashboard/admin/settings/page.tsx
'use client'

import { AdminGate } from '@/lib/components/rbac'

function SettingsContent() {
  return <div>Configurações do sistema</div>
}

export default function SettingsPage() {
  return (
    <AdminGate>
      <SettingsContent />
    </AdminGate>
  )
}
```

### Proteger API Route

```typescript
// app/api/admin/users/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
  
  // Verificar se é admin
  const { data: isAdmin } = await supabase.rpc('is_admin', {
    user_id: user.id
  })
  
  if (!isAdmin) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }
  
  // Lógica da rota...
}
```

### Botões Condicionais

```tsx
import { usePermission } from '@/lib/hooks/use-rbac'

function VideoCard({ video }) {
  const { hasPermission: canEdit } = usePermission('videos.edit')
  const { hasPermission: canDelete } = usePermission('videos.delete')
  
  return (
    <div>
      <h3>{video.title}</h3>
      <div className="actions">
        {canEdit && <button>Editar</button>}
        {canDelete && <button>Deletar</button>}
      </div>
    </div>
  )
}
```

### Menu Dinâmico

```tsx
import { useIsAdmin, useHasRole } from '@/lib/hooks/use-rbac'

function Navigation() {
  const { isAdmin } = useIsAdmin()
  const { hasRole: canEdit } = useHasRole(['admin', 'editor'])
  
  return (
    <nav>
      <Link href="/dashboard">Dashboard</Link>
      {canEdit && <Link href="/dashboard/editor">Editor</Link>}
      {isAdmin && <Link href="/dashboard/admin">Admin</Link>}
    </nav>
  )
}
```

## Funções RLS do Supabase

### `user_has_permission(user_id, permission_name)`

Verifica se usuário tem permissão específica:

```sql
SELECT user_has_permission(auth.uid(), 'videos.edit');
```

### `is_admin(user_id)`

Verifica se usuário é administrador:

```sql
SELECT is_admin(auth.uid());
```

### `user_role(user_id)`

Retorna o role principal do usuário:

```sql
SELECT user_role(auth.uid());
```

## Boas Práticas

### 1. Sempre Verificar Permissões no Backend

Mesmo com proteção no frontend, sempre valide no backend:

```typescript
// ❌ Não confie apenas no frontend
<button onClick={deleteVideo}>Deletar</button>

// ✅ Frontend + Backend
const { hasPermission } = usePermission('videos.delete')
if (!hasPermission) return null

async function deleteVideo() {
  // API verifica permissão novamente
  const res = await fetch('/api/videos/delete', { method: 'DELETE' })
}
```

### 2. Use Loading States

Sempre trate estados de loading:

```tsx
const { hasPermission, loading } = usePermission('videos.edit')

if (loading) return <Skeleton />
if (!hasPermission) return null
return <EditButton />
```

### 3. Componha Permissões

Para lógicas complexas, componha múltiplas verificações:

```tsx
const { hasPermission: canEdit } = usePermission('videos.edit')
const { hasPermission: canPublish } = usePermission('videos.publish')
const { isAdmin } = useIsAdmin()

const canModerate = isAdmin || (canEdit && canPublish)
```

### 4. Fallbacks Informativos

Forneça feedback claro quando acesso negado:

```tsx
<PermissionGate 
  permission="users.delete"
  fallback={
    <Tooltip content="Apenas administradores podem deletar usuários">
      <button disabled>Deletar</button>
    </Tooltip>
  }
>
  <button onClick={handleDelete}>Deletar</button>
</PermissionGate>
```

### 5. Teste Diferentes Roles

Sempre teste com diferentes roles:

```typescript
// tests/e2e/rbac.spec.ts
test('admin pode acessar configurações', async ({ page }) => {
  await loginAsAdmin(page)
  await page.goto('/dashboard/admin/settings')
  await expect(page.locator('h1')).toContainText('Configurações')
})

test('editor não pode acessar configurações', async ({ page }) => {
  await loginAsEditor(page)
  await page.goto('/dashboard/admin/settings')
  await expect(page).toHaveURL('/dashboard?error=forbidden')
})
```

## Troubleshooting

### Permissão sempre retorna false

Verifique:
1. Usuário está autenticado?
2. Role foi atribuído corretamente?
3. Permissão existe na tabela `permissions`?
4. Associação existe em `role_permissions`?

```sql
-- Verificar roles do usuário
SELECT r.name 
FROM user_roles ur
JOIN roles r ON ur.role_id = r.id
WHERE ur.user_id = 'USER_ID';

-- Verificar permissões do role
SELECT p.name
FROM role_permissions rp
JOIN permissions p ON rp.permission_id = p.id
JOIN roles r ON rp.role_id = r.id
WHERE r.name = 'editor';
```

### Middleware não está bloqueando

Verifique:
1. Arquivo `middleware.ts` está na pasta correta?
2. Configuração `matcher` inclui a rota?
3. Função `is_admin()` está criada no Supabase?

### Performance lenta

Para melhorar performance:
1. Use React Query para cache de permissões
2. Implemente cache em memória no servidor
3. Considere pré-carregar permissões no layout

```tsx
// Exemplo com React Query
import { useQuery } from '@tanstack/react-query'

function usePermission(permission: string) {
  return useQuery({
    queryKey: ['permission', permission],
    queryFn: () => checkPermission(permission),
    staleTime: 5 * 60 * 1000, // Cache por 5 minutos
  })
}
```

## Recursos Adicionais

- [`docs/rbac/IMPLEMENTACAO.md`](./IMPLEMENTACAO.md) - Guia de implementação
- [`database-rbac-seed.sql`](../../database-rbac-seed.sql) - Seeds de roles/permissões
- [`database-rbac-rls.sql`](../../database-rbac-rls.sql) - Políticas RLS
- [`scripts/apply-rbac-schema.ts`](../../scripts/apply-rbac-schema.ts) - Script de aplicação

## Suporte

Para dúvidas ou problemas:
1. Consulte a documentação técnica
2. Verifique os logs no Supabase
3. Execute os testes: `npm run test:rbac`
4. Abra uma issue no repositório
