# RBAC – Controle de Acesso Baseado em Papéis (Fase 5)

## Objetivo
Garantir controle granular de ações por meio de papéis e permissões, suportando expansão futura (CRUD genéricos, módulos administrativos).

## Modelo
Tabelas:
- `roles(id,name,description)`
- `permissions(id,name,description)`
- `role_permissions(role_id,permission_id)`
- `user_roles(user_id,role_id)`

Funções auxiliares:
- `public.user_has_role(user_id, role_name)`
- `public.is_admin(user_id)`

## Papéis iniciais
- `admin`: tudo
- `editor`: criar/renderizar vídeos
- `viewer`: leitura

## Permissões iniciais
`users.read`, `users.write`, `roles.read`, `roles.write`, `videos.read`, `videos.render`, `admin.dashboard`.

## Rotas Admin
- `GET /api/admin/users` lista usuários (mock atual; integrar Supabase depois)
- `POST /api/admin/users` atribui papel (body: `{ id, role }`)
- `GET /api/admin/roles` lista papéis
- `POST /api/admin/roles` cria papel

## Front-end
Página `dashboard/admin/users` exibe tabela simples de usuários e papéis.

## Próximos Passos
1. Integrar queries reais via Supabase (view agregada).
2. Adicionar cache de roles/permissions no edge.
3. Expandir permissões para módulos CRUD (templates, categorias).
4. Auditar ações sensíveis (log em tabela dedicada).
