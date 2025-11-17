-- ============================================
-- Seed RBAC: Roles e Permissions
-- ============================================

-- Inserir papéis padrão
INSERT INTO public.roles (name, description) VALUES
    ('admin', 'Administrador com acesso total ao sistema'),
    ('editor', 'Editor com permissão para criar e editar conteúdo'),
    ('viewer', 'Visualizador com acesso somente leitura'),
    ('moderator', 'Moderador com permissões de gestão de conteúdo e usuários')
ON CONFLICT (name) DO NOTHING;

-- Inserir permissões granulares
INSERT INTO public.permissions (name, description) VALUES
    -- Gestão de usuários
    ('users.view', 'Visualizar lista de usuários'),
    ('users.create', 'Criar novos usuários'),
    ('users.edit', 'Editar informações de usuários'),
    ('users.delete', 'Excluir usuários'),
    ('users.assign_roles', 'Atribuir papéis a usuários'),
    
    -- Gestão de projetos
    ('projects.view', 'Visualizar projetos'),
    ('projects.create', 'Criar novos projetos'),
    ('projects.edit', 'Editar projetos'),
    ('projects.delete', 'Excluir projetos'),
    
    -- Gestão de vídeos
    ('videos.view', 'Visualizar vídeos'),
    ('videos.create', 'Criar novos vídeos'),
    ('videos.edit', 'Editar vídeos'),
    ('videos.delete', 'Excluir vídeos'),
    ('videos.render', 'Iniciar renderização de vídeos'),
    
    -- Gestão de cursos NR
    ('courses.view', 'Visualizar cursos'),
    ('courses.create', 'Criar novos cursos'),
    ('courses.edit', 'Editar cursos'),
    ('courses.delete', 'Excluir cursos'),
    
    -- Gestão de módulos
    ('modules.view', 'Visualizar módulos'),
    ('modules.create', 'Criar novos módulos'),
    ('modules.edit', 'Editar módulos'),
    ('modules.delete', 'Excluir módulos'),
    
    -- Analytics
    ('analytics.view', 'Visualizar analytics'),
    ('analytics.export', 'Exportar dados de analytics'),
    
    -- Configurações do sistema
    ('settings.view', 'Visualizar configurações do sistema'),
    ('settings.edit', 'Editar configurações do sistema')
ON CONFLICT (name) DO NOTHING;

-- Associar permissões aos papéis

-- Admin: todas as permissões
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'admin'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Editor: permissões de criação e edição de conteúdo
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'editor'
  AND p.name IN (
    'projects.view', 'projects.create', 'projects.edit',
    'videos.view', 'videos.create', 'videos.edit', 'videos.render',
    'courses.view', 'courses.create', 'courses.edit',
    'modules.view', 'modules.create', 'modules.edit',
    'analytics.view'
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Viewer: apenas visualização
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'viewer'
  AND p.name IN (
    'projects.view',
    'videos.view',
    'courses.view',
    'modules.view',
    'analytics.view'
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Moderator: gestão de conteúdo e usuários (sem delete de sistema crítico)
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'moderator'
  AND p.name IN (
    'users.view', 'users.edit',
    'projects.view', 'projects.create', 'projects.edit', 'projects.delete',
    'videos.view', 'videos.create', 'videos.edit', 'videos.delete', 'videos.render',
    'courses.view', 'courses.create', 'courses.edit',
    'modules.view', 'modules.create', 'modules.edit', 'modules.delete',
    'analytics.view', 'analytics.export'
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ============================================
-- Comentários e Documentação
-- ============================================
COMMENT ON TABLE public.role_permissions IS 'Matriz de permissões: define quais permissões cada papel possui.';
COMMENT ON TABLE public.user_roles IS 'Atribuição de papéis: define quais papéis cada usuário possui (pode ter múltiplos).';
