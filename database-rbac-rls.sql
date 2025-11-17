-- ============================================
-- RLS Policies para RBAC
-- ============================================

-- Função helper: verificar se usuário tem permissão
CREATE OR REPLACE FUNCTION public.user_has_permission(
  user_id UUID,
  permission_name TEXT
) RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles ur
    INNER JOIN public.role_permissions rp ON ur.role_id = rp.role_id
    INNER JOIN public.permissions p ON rp.permission_id = p.id
    WHERE ur.user_id = $1
      AND p.name = $2
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função helper: verificar se usuário é admin
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles ur
    INNER JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
      AND r.name = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função helper: obter papel do usuário
CREATE OR REPLACE FUNCTION public.user_role() RETURNS TEXT AS $$
DECLARE
  role_name TEXT;
BEGIN
  SELECT r.name INTO role_name
  FROM public.user_roles ur
  INNER JOIN public.roles r ON ur.role_id = r.id
  WHERE ur.user_id = auth.uid()
  LIMIT 1;
  
  RETURN COALESCE(role_name, 'viewer');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- RLS: users (tabela pública)
-- ============================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own_or_admin" ON public.users
  FOR SELECT
  USING (
    id = auth.uid()
    OR public.is_admin()
    OR public.user_has_permission(auth.uid(), 'users.view')
  );

CREATE POLICY "users_update_own_or_admin" ON public.users
  FOR UPDATE
  USING (
    id = auth.uid()
    OR public.is_admin()
    OR public.user_has_permission(auth.uid(), 'users.edit')
  );

-- ============================================
-- RLS: projects
-- ============================================
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "projects_select_own_or_permission" ON public.projects
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR public.user_has_permission(auth.uid(), 'projects.view')
  );

CREATE POLICY "projects_insert_with_permission" ON public.projects
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND (
      public.user_has_permission(auth.uid(), 'projects.create')
      OR public.is_admin()
    )
  );

CREATE POLICY "projects_update_own_or_permission" ON public.projects
  FOR UPDATE
  USING (
    user_id = auth.uid()
    OR public.user_has_permission(auth.uid(), 'projects.edit')
  );

CREATE POLICY "projects_delete_own_or_permission" ON public.projects
  FOR DELETE
  USING (
    user_id = auth.uid()
    OR public.user_has_permission(auth.uid(), 'projects.delete')
  );

-- ============================================
-- RLS: render_jobs
-- ============================================
ALTER TABLE public.render_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "render_jobs_select_own_project" ON public.render_jobs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = render_jobs.project_id
        AND (p.user_id = auth.uid() OR public.user_has_permission(auth.uid(), 'videos.view'))
    )
  );

CREATE POLICY "render_jobs_insert_with_permission" ON public.render_jobs
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = render_jobs.project_id
        AND p.user_id = auth.uid()
    )
    AND public.user_has_permission(auth.uid(), 'videos.render')
  );

-- ============================================
-- RLS: nr_courses (público para leitura)
-- ============================================
ALTER TABLE public.nr_courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "courses_select_public" ON public.nr_courses
  FOR SELECT
  USING (true); -- Cursos são públicos para leitura

CREATE POLICY "courses_modify_with_permission" ON public.nr_courses
  FOR ALL
  USING (
    public.user_has_permission(auth.uid(), 'courses.edit')
    OR public.is_admin()
  );

-- ============================================
-- RLS: nr_modules (público para leitura)
-- ============================================
ALTER TABLE public.nr_modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "modules_select_public" ON public.nr_modules
  FOR SELECT
  USING (true); -- Módulos são públicos para leitura

CREATE POLICY "modules_modify_with_permission" ON public.nr_modules
  FOR ALL
  USING (
    public.user_has_permission(auth.uid(), 'modules.edit')
    OR public.is_admin()
  );

-- ============================================
-- RLS: roles (apenas admin)
-- ============================================
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "roles_select_authenticated" ON public.roles
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "roles_modify_admin_only" ON public.roles
  FOR ALL
  USING (public.is_admin());

-- ============================================
-- RLS: permissions (apenas admin)
-- ============================================
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "permissions_select_authenticated" ON public.permissions
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "permissions_modify_admin_only" ON public.permissions
  FOR ALL
  USING (public.is_admin());

-- ============================================
-- RLS: user_roles (usuários veem próprios papéis, admin vê tudo)
-- ============================================
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_roles_select_own_or_admin" ON public.user_roles
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR public.is_admin()
    OR public.user_has_permission(auth.uid(), 'users.view')
  );

CREATE POLICY "user_roles_modify_admin_only" ON public.user_roles
  FOR ALL
  USING (
    public.is_admin()
    OR public.user_has_permission(auth.uid(), 'users.assign_roles')
  );

-- ============================================
-- Comentários
-- ============================================
COMMENT ON FUNCTION public.user_has_permission IS 'Verifica se usuário tem permissão específica através de seus papéis.';
COMMENT ON FUNCTION public.is_admin IS 'Verifica se usuário tem papel de administrador.';
COMMENT ON FUNCTION public.user_role IS 'Retorna o papel principal do usuário (primeiro encontrado).';
