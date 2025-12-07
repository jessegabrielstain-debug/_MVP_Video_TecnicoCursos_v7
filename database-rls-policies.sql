-- Políticas de segurança RLS (Row Level Security) para o Supabase
-- Este arquivo deve ser executado no SQL Editor do Supabase

-- Habilitar RLS em todas as tabelas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE slides ENABLE ROW LEVEL SECURITY;
ALTER TABLE render_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE nr_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE nr_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE timelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE pptx_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE pptx_slides ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_history ENABLE ROW LEVEL SECURITY;

-- Políticas para tabela users
DROP POLICY IF EXISTS "Usuários podem ver seus próprios dados" ON users;
CREATE POLICY "Usuários podem ver seus próprios dados"
ON users FOR SELECT
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios dados" ON users;
CREATE POLICY "Usuários podem atualizar seus próprios dados"
ON users FOR UPDATE
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Usuários podem deletar seus próprios dados" ON users;
CREATE POLICY "Usuários podem deletar seus próprios dados"
ON users FOR DELETE
USING (auth.uid() = id);

-- Políticas para tabela courses
DROP POLICY IF EXISTS "Qualquer pessoa pode ver cursos" ON courses;
CREATE POLICY "Qualquer pessoa pode ver cursos"
ON courses FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Autores podem editar seus cursos" ON courses;
CREATE POLICY "Autores podem editar seus cursos"
ON courses FOR UPDATE
USING (auth.uid() = author_id);

DROP POLICY IF EXISTS "Autores podem excluir seus cursos" ON courses;
CREATE POLICY "Autores podem excluir seus cursos"
ON courses FOR DELETE
USING (auth.uid() = author_id);

DROP POLICY IF EXISTS "Usuários autenticados podem criar cursos" ON courses;
CREATE POLICY "Usuários autenticados podem criar cursos"
ON courses FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Políticas para tabela videos
DROP POLICY IF EXISTS "Qualquer pessoa pode ver vídeos" ON videos;
CREATE POLICY "Qualquer pessoa pode ver vídeos"
ON videos FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Autores podem gerenciar vídeos de seus cursos" ON videos;
CREATE POLICY "Autores podem gerenciar vídeos de seus cursos"
ON videos FOR ALL
USING (
  auth.uid() IN (
    SELECT author_id FROM courses WHERE id = videos.course_id
  )
);

-- Políticas para tabela user_progress
DROP POLICY IF EXISTS "Usuários podem ver seu próprio progresso" ON user_progress;
CREATE POLICY "Usuários podem ver seu próprio progresso"
ON user_progress FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem atualizar seu próprio progresso" ON user_progress;
CREATE POLICY "Usuários podem atualizar seu próprio progresso"
ON user_progress FOR UPDATE
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem inserir seu próprio progresso" ON user_progress;
CREATE POLICY "Usuários podem inserir seu próprio progresso"
ON user_progress FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Políticas para tabela projects
DROP POLICY IF EXISTS "Usuários podem ver seus próprios projetos" ON projects;
CREATE POLICY "Usuários podem ver seus próprios projetos"
ON projects FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios projetos" ON projects;
CREATE POLICY "Usuários podem atualizar seus próprios projetos"
ON projects FOR UPDATE
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem inserir projetos" ON projects;
CREATE POLICY "Usuários podem inserir projetos"
ON projects FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem deletar seus próprios projetos" ON projects;
CREATE POLICY "Usuários podem deletar seus próprios projetos"
ON projects FOR DELETE
USING (auth.uid() = user_id);

-- Políticas para tabela slides
DROP POLICY IF EXISTS "Usuários podem ver slides de seus projetos" ON slides;
CREATE POLICY "Usuários podem ver slides de seus projetos"
ON slides FOR SELECT
USING (
  auth.uid() IN (
    SELECT user_id FROM projects WHERE id = slides.project_id
  )
);

DROP POLICY IF EXISTS "Usuários podem inserir slides em seus projetos" ON slides;
CREATE POLICY "Usuários podem inserir slides em seus projetos"
ON slides FOR INSERT
WITH CHECK (
  auth.uid() IN (
    SELECT user_id FROM projects WHERE id = slides.project_id
  )
);

DROP POLICY IF EXISTS "Usuários podem atualizar slides de seus projetos" ON slides;
CREATE POLICY "Usuários podem atualizar slides de seus projetos"
ON slides FOR UPDATE
USING (
  auth.uid() IN (
    SELECT user_id FROM projects WHERE id = slides.project_id
  )
);

DROP POLICY IF EXISTS "Usuários podem deletar slides de seus projetos" ON slides;
CREATE POLICY "Usuários podem deletar slides de seus projetos"
ON slides FOR DELETE
USING (
  auth.uid() IN (
    SELECT user_id FROM projects WHERE id = slides.project_id
  )
);

-- Políticas para tabela render_jobs
DROP POLICY IF EXISTS "Usuários podem ver jobs de seus projetos" ON render_jobs;
CREATE POLICY "Usuários podem ver jobs de seus projetos"
ON render_jobs FOR SELECT
USING (
  auth.uid() IN (
    SELECT user_id FROM projects WHERE id = render_jobs.project_id
  )
);

DROP POLICY IF EXISTS "Usuários podem inserir jobs em seus projetos" ON render_jobs;
CREATE POLICY "Usuários podem inserir jobs em seus projetos"
ON render_jobs FOR INSERT
WITH CHECK (
  auth.uid() IN (
    SELECT user_id FROM projects WHERE id = render_jobs.project_id
  )
);

DROP POLICY IF EXISTS "Usuários podem atualizar jobs de seus projetos" ON render_jobs;
CREATE POLICY "Usuários podem atualizar jobs de seus projetos"
ON render_jobs FOR UPDATE
USING (
  auth.uid() IN (
    SELECT user_id FROM projects WHERE id = render_jobs.project_id
  )
);

DROP POLICY IF EXISTS "Usuários podem deletar jobs de seus projetos" ON render_jobs;
CREATE POLICY "Usuários podem deletar jobs de seus projetos"
ON render_jobs FOR DELETE
USING (
  auth.uid() IN (
    SELECT user_id FROM projects WHERE id = render_jobs.project_id
  )
);

-- Políticas para tabela analytics_events
DROP POLICY IF EXISTS "Usuários autenticados podem ver analytics" ON analytics_events;
CREATE POLICY "Usuários autenticados podem ver analytics"
ON analytics_events FOR SELECT
USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Usuários autenticados podem inserir analytics" ON analytics_events;
CREATE POLICY "Usuários autenticados podem inserir analytics"
ON analytics_events FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Políticas para tabela nr_courses
DROP POLICY IF EXISTS "Todos podem ver cursos NR" ON nr_courses;
CREATE POLICY "Todos podem ver cursos NR"
ON nr_courses FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Administradores podem gerenciar cursos NR" ON nr_courses;
CREATE POLICY "Administradores podem gerenciar cursos NR"
ON nr_courses FOR ALL
USING (is_admin());

-- Políticas para tabela nr_modules
DROP POLICY IF EXISTS "Todos podem ver módulos NR" ON nr_modules;
CREATE POLICY "Todos podem ver módulos NR"
ON nr_modules FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Administradores podem gerenciar módulos NR" ON nr_modules;
CREATE POLICY "Administradores podem gerenciar módulos NR"
ON nr_modules FOR ALL
USING (is_admin());

-- Políticas para tabela timelines
DROP POLICY IF EXISTS "Users can view timelines of their projects" ON timelines;
CREATE POLICY "Users can view timelines of their projects"
    ON timelines FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = timelines.project_id
            AND projects.user_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM project_collaborators
            WHERE project_collaborators.project_id = timelines.project_id
            AND project_collaborators.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert timelines for their projects" ON timelines;
CREATE POLICY "Users can insert timelines for their projects"
    ON timelines FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = timelines.project_id
            AND projects.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update timelines of their projects" ON timelines;
CREATE POLICY "Users can update timelines of their projects"
    ON timelines FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = timelines.project_id
            AND projects.user_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM project_collaborators
            WHERE project_collaborators.project_id = timelines.project_id
            AND project_collaborators.user_id = auth.uid()
            AND project_collaborators.role IN ('editor', 'owner')
        )
    );

DROP POLICY IF EXISTS "Users can delete timelines of their projetos" ON timelines;
CREATE POLICY "Users can delete timelines of seus projetos"
    ON timelines FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = timelines.project_id
            AND projects.user_id = auth.uid()
        )
    );

-- Policies for pptx_uploads
DROP POLICY IF EXISTS "Users can view uploads of their projects" ON pptx_uploads;
CREATE POLICY "Users can view uploads of their projetos"
    ON pptx_uploads FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = pptx_uploads.project_id
            AND projects.user_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM project_collaborators
            WHERE project_collaborators.project_id = pptx_uploads.project_id
            AND project_collaborators.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert uploads for their projects" ON pptx_uploads;
CREATE POLICY "Users can insert uploads for seus projetos"
    ON pptx_uploads FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = pptx_uploads.project_id
            AND projects.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update uploads of their projects" ON pptx_uploads;
CREATE POLICY "Users can update uploads de seus projetos"
    ON pptx_uploads FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = pptx_uploads.project_id
            AND projects.user_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM project_collaborators
            WHERE project_collaborators.project_id = pptx_uploads.project_id
            AND project_collaborators.user_id = auth.uid()
            AND project_collaborators.role IN ('editor', 'owner')
        )
    );

DROP POLICY IF EXISTS "Users can delete uploads of their projects" ON pptx_uploads;
CREATE POLICY "Users can delete uploads de seus projetos"
    ON pptx_uploads FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = pptx_uploads.project_id
            AND projects.user_id = auth.uid()
        )
    );

-- Policies for pptx_slides
DROP POLICY IF EXISTS "Users can view slides of their projects" ON pptx_slides;
CREATE POLICY "Users can view slides de seus projetos"
    ON pptx_slides FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM pptx_uploads
            JOIN projects ON projects.id = pptx_uploads.project_id
            WHERE pptx_uploads.id = pptx_slides.upload_id
            AND (projects.user_id = auth.uid() OR EXISTS (
                SELECT 1 FROM project_collaborators
                WHERE project_collaborators.project_id = projects.id
                AND project_collaborators.user_id = auth.uid()
            ))
        )
    );

DROP POLICY IF EXISTS "Users can update slides of their projects" ON pptx_slides;
CREATE POLICY "Users can update slides de seus projetos"
    ON pptx_slides FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM pptx_uploads
            JOIN projects ON projects.id = pptx_uploads.project_id
            WHERE pptx_uploads.id = pptx_slides.upload_id
            AND (projects.user_id = auth.uid() OR EXISTS (
                SELECT 1 FROM project_collaborators
                WHERE project_collaborators.project_id = projects.id
                AND project_collaborators.user_id = auth.uid()
                AND project_collaborators.role IN ('editor', 'owner')
            ))
        )
    );

DROP POLICY IF EXISTS "Users can delete slides of their projetos" ON pptx_slides;
CREATE POLICY "Users can delete slides de seus projetos"
    ON pptx_slides FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM pptx_uploads
            JOIN projects ON projects.id = pptx_uploads.project_id
            WHERE pptx_uploads.id = pptx_slides.upload_id
            AND projects.user_id = auth.uid()
        )
    );

-- Policies for project_history
DROP POLICY IF EXISTS "Users can view history of their projects" ON project_history;
CREATE POLICY "Users can view history of seus projetos"
    ON project_history FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = project_history.project_id
            AND projects.user_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM project_collaborators
            WHERE project_collaborators.project_id = project_history.project_id
            AND project_collaborators.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert history for their projects" ON project_history;
CREATE POLICY "Users can insert history para seus projetos"
    ON project_history FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = project_history.project_id
            AND (projects.user_id = auth.uid() OR EXISTS (
                SELECT 1 FROM project_collaborators
                WHERE project_collaborators.project_id = projects.id
                AND project_collaborators.user_id = auth.uid()
            ))
        )
    );

-- Função para verificar se o usuário é administrador
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid() AND r.name = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Políticas para administradores (acesso total)
DROP POLICY IF EXISTS "Administradores têm acesso total a users" ON users;
CREATE POLICY "Administradores têm acesso total a users"
ON users FOR ALL
USING (is_admin());

DROP POLICY IF EXISTS "Administradores têm acesso total a courses" ON courses;
CREATE POLICY "Administradores têm acesso total a courses"
ON courses FOR ALL
USING (is_admin());

DROP POLICY IF EXISTS "Administradores têm acesso total a videos" ON videos;
CREATE POLICY "Administradores têm acesso total a videos"
ON videos FOR ALL
USING (is_admin());

DROP POLICY IF EXISTS "Administradores têm acesso total a user_progress" ON user_progress;
CREATE POLICY "Administradores têm acesso total a user_progress"
ON user_progress FOR ALL
USING (is_admin());

DROP POLICY IF EXISTS "Administradores têm acesso total a projects" ON projects;
CREATE POLICY "Administradores têm acesso total a projects"
ON projects FOR ALL
USING (is_admin());

DROP POLICY IF EXISTS "Administradores têm acesso total a slides" ON slides;
CREATE POLICY "Administradores têm acesso total a slides"
ON slides FOR ALL
USING (is_admin());

DROP POLICY IF EXISTS "Administradores têm acesso total a render_jobs" ON render_jobs;
CREATE POLICY "Administradores têm acesso total a render_jobs"
ON render_jobs FOR ALL
USING (is_admin());

DROP POLICY IF EXISTS "Administradores têm acesso total a analytics_events" ON analytics_events;
CREATE POLICY "Administradores têm acesso total a analytics_events"
ON analytics_events FOR ALL
USING (is_admin());

DROP POLICY IF EXISTS "Administradores têm acesso total a nr_courses" ON nr_courses;
CREATE POLICY "Administradores têm acesso total a nr_courses"
ON nr_courses FOR ALL
USING (is_admin());

DROP POLICY IF EXISTS "Administradores têm acesso total a nr_modules" ON nr_modules;
CREATE POLICY "Administradores têm acesso total a nr_modules"
ON nr_modules FOR ALL
USING (is_admin());

DROP POLICY IF EXISTS "Administradores têm acesso total a timelines" ON timelines;
CREATE POLICY "Administradores têm acesso total a timelines"
ON timelines FOR ALL
USING (is_admin());

DROP POLICY IF EXISTS "Administradores têm acesso total a pptx_uploads" ON pptx_uploads;
CREATE POLICY "Administradores têm acesso total a pptx_uploads"
ON pptx_uploads FOR ALL
USING (is_admin());

DROP POLICY IF EXISTS "Administradores têm acesso total a pptx_slides" ON pptx_slides;
CREATE POLICY "Administradores têm acesso total a pptx_slides"
ON pptx_slides FOR ALL
USING (is_admin());

DROP POLICY IF EXISTS "Administradores têm acesso total a project_history" ON project_history;
CREATE POLICY "Administradores têm acesso total a project_history"
ON project_history FOR ALL
USING (is_admin());
