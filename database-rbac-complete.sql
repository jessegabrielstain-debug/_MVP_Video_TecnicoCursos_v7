-- ================================================
-- RBAC Schema & Test Users Setup
-- Criação de roles, permissions, user_roles e test users
-- ================================================

-- ================================================
-- 1. TABELAS RBAC
-- ================================================

-- Tabela de roles (papéis)
CREATE TABLE IF NOT EXISTS public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de permissions (permissões)
CREATE TABLE IF NOT EXISTS public.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  resource VARCHAR(50) NOT NULL, -- ex: 'projects', 'videos', 'users'
  action VARCHAR(50) NOT NULL,   -- ex: 'read', 'write', 'delete', 'admin'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de associação role -> permissions
CREATE TABLE IF NOT EXISTS public.role_permissions (
  role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES public.permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- Tabela de associação user -> roles
CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_by UUID REFERENCES auth.users(id),
  PRIMARY KEY (user_id, role_id)
);

-- ================================================
-- 2. ÍNDICES PARA PERFORMANCE
-- ================================================

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON public.user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON public.role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_permissions_resource_action ON public.permissions(resource, action);

-- ================================================
-- 3. INSERIR ROLES
-- ================================================

INSERT INTO public.roles (name, description) VALUES
  ('admin', 'Administrador com acesso total ao sistema'),
  ('editor', 'Editor com permissão para criar e editar conteúdo'),
  ('viewer', 'Visualizador com permissão apenas de leitura'),
  ('moderator', 'Moderador com permissões intermediárias')
ON CONFLICT (name) DO NOTHING;

-- ================================================
-- 4. INSERIR PERMISSIONS
-- ================================================

-- Permissões de Projects
INSERT INTO public.permissions (name, description, resource, action) VALUES
  ('projects:read', 'Ver projetos', 'projects', 'read'),
  ('projects:write', 'Criar e editar projetos', 'projects', 'write'),
  ('projects:delete', 'Deletar projetos', 'projects', 'delete'),
  ('projects:admin', 'Administrar projetos', 'projects', 'admin')
ON CONFLICT (name) DO NOTHING;

-- Permissões de Videos
INSERT INTO public.permissions (name, description, resource, action) VALUES
  ('videos:read', 'Ver vídeos', 'videos', 'read'),
  ('videos:write', 'Criar e editar vídeos', 'videos', 'write'),
  ('videos:delete', 'Deletar vídeos', 'videos', 'delete'),
  ('videos:render', 'Renderizar vídeos', 'videos', 'render')
ON CONFLICT (name) DO NOTHING;

-- Permissões de Users
INSERT INTO public.permissions (name, description, resource, action) VALUES
  ('users:read', 'Ver usuários', 'users', 'read'),
  ('users:write', 'Criar e editar usuários', 'users', 'write'),
  ('users:delete', 'Deletar usuários', 'users', 'delete'),
  ('users:admin', 'Administrar usuários', 'users', 'admin')
ON CONFLICT (name) DO NOTHING;

-- Permissões de Analytics
INSERT INTO public.permissions (name, description, resource, action) VALUES
  ('analytics:read', 'Ver analytics', 'analytics', 'read'),
  ('analytics:admin', 'Administrar analytics', 'analytics', 'admin')
ON CONFLICT (name) DO NOTHING;

-- ================================================
-- 5. ASSOCIAR PERMISSIONS AOS ROLES
-- ================================================

-- ADMIN: todas as permissões
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'admin'
ON CONFLICT DO NOTHING;

-- EDITOR: read/write em projects e videos
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'editor'
  AND p.name IN (
    'projects:read', 'projects:write',
    'videos:read', 'videos:write', 'videos:render',
    'analytics:read'
  )
ON CONFLICT DO NOTHING;

-- VIEWER: apenas read
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'viewer'
  AND p.name IN (
    'projects:read',
    'videos:read',
    'analytics:read'
  )
ON CONFLICT DO NOTHING;

-- MODERATOR: read/write + delete (exceto users)
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'moderator'
  AND p.name IN (
    'projects:read', 'projects:write', 'projects:delete',
    'videos:read', 'videos:write', 'videos:delete', 'videos:render',
    'users:read',
    'analytics:read'
  )
ON CONFLICT DO NOTHING;

-- ================================================
-- 6. RLS POLICIES
-- ================================================

-- Habilitar RLS
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Policies para roles (apenas admins podem modificar)
DROP POLICY IF EXISTS "Public can read roles" ON public.roles;
CREATE POLICY "Public can read roles"
  ON public.roles FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Only admins can modify roles" ON public.roles;
CREATE POLICY "Only admins can modify roles"
  ON public.roles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid() AND r.name = 'admin'
    )
  );

-- Policies para permissions (apenas admins podem modificar)
DROP POLICY IF EXISTS "Public can read permissions" ON public.permissions;
CREATE POLICY "Public can read permissions"
  ON public.permissions FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Only admins can modify permissions" ON public.permissions;
CREATE POLICY "Only admins can modify permissions"
  ON public.permissions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid() AND r.name = 'admin'
    )
  );

-- Policies para user_roles
DROP POLICY IF EXISTS "Users can read their own roles" ON public.user_roles;
CREATE POLICY "Users can read their own roles"
  ON public.user_roles FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can read all user roles" ON public.user_roles;
CREATE POLICY "Admins can read all user roles"
  ON public.user_roles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid() AND r.name = 'admin'
    )
  );

DROP POLICY IF EXISTS "Only admins can modify user roles" ON public.user_roles;
CREATE POLICY "Only admins can modify user roles"
  ON public.user_roles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid() AND r.name = 'admin'
    )
  );

-- ================================================
-- 7. FUNÇÕES HELPER
-- ================================================

-- Função para verificar se user tem role específico
CREATE OR REPLACE FUNCTION public.user_has_role(user_id UUID, role_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.roles r ON r.id = ur.role_id
    WHERE ur.user_id = $1 AND r.name = $2
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar se user tem permissão específica
CREATE OR REPLACE FUNCTION public.user_has_permission(user_id UUID, permission_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.role_permissions rp ON rp.role_id = ur.role_id
    JOIN public.permissions p ON p.id = rp.permission_id
    WHERE ur.user_id = $1 AND p.name = $2
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter todas as permissões de um user
CREATE OR REPLACE FUNCTION public.get_user_permissions(user_id UUID)
RETURNS TABLE(permission_name TEXT, resource TEXT, action TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT p.name, p.resource, p.action
  FROM public.user_roles ur
  JOIN public.role_permissions rp ON rp.role_id = ur.role_id
  JOIN public.permissions p ON p.id = rp.permission_id
  WHERE ur.user_id = $1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================
-- 8. CRIAR TEST USERS (MANUAL - VIA SUPABASE UI)
-- ================================================

-- ⚠️ ATENÇÃO: Os usuários devem ser criados manualmente via Supabase Dashboard
-- Depois de criar os users, execute os comandos abaixo para associar roles

-- Assumindo que você criou os users e tem os UUIDs:
-- ADMIN_USER_ID: criar via Supabase Dashboard
-- EDITOR_USER_ID: criar via Supabase Dashboard
-- VIEWER_USER_ID: criar via Supabase Dashboard
-- MODERATOR_USER_ID: criar via Supabase Dashboard

-- Exemplo de como associar após criar os users:
-- INSERT INTO public.user_roles (user_id, role_id)
-- SELECT 'ADMIN_USER_UUID', id FROM public.roles WHERE name = 'admin';

-- INSERT INTO public.user_roles (user_id, role_id)
-- SELECT 'EDITOR_USER_UUID', id FROM public.roles WHERE name = 'editor';

-- INSERT INTO public.user_roles (user_id, role_id)
-- SELECT 'VIEWER_USER_UUID', id FROM public.roles WHERE name = 'viewer';

-- INSERT INTO public.user_roles (user_id, role_id)
-- SELECT 'MODERATOR_USER_UUID', id FROM public.roles WHERE name = 'moderator';

-- ================================================
-- 9. VERIFICAÇÃO
-- ================================================

-- Ver todos os roles
SELECT * FROM public.roles;

-- Ver todas as permissions
SELECT * FROM public.permissions;

-- Ver associações role -> permissions
SELECT r.name as role, p.name as permission, p.resource, p.action
FROM public.role_permissions rp
JOIN public.roles r ON r.id = rp.role_id
JOIN public.permissions p ON p.id = rp.permission_id
ORDER BY r.name, p.resource, p.action;

-- Ver associações user -> roles (após criar users)
-- SELECT u.email, r.name as role
-- FROM public.user_roles ur
-- JOIN auth.users u ON u.id = ur.user_id
-- JOIN public.roles r ON r.id = ur.role_id
-- ORDER BY u.email;
