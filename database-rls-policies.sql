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

-- Políticas para tabela users
-- Usuários só podem ver e editar seus próprios dados
CREATE POLICY "Usuários podem ver seus próprios dados"
ON users FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Usuários podem atualizar seus próprios dados"
ON users FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Usuários podem deletar seus próprios dados"
ON users FOR DELETE
USING (auth.uid() = id);

-- Políticas para tabela courses
-- Todos podem ver cursos
CREATE POLICY "Qualquer pessoa pode ver cursos"
ON courses FOR SELECT
USING (true);

-- Apenas autores podem editar seus cursos
CREATE POLICY "Autores podem editar seus cursos"
ON courses FOR UPDATE
USING (auth.uid() = author_id);

-- Apenas autores podem excluir seus cursos
CREATE POLICY "Autores podem excluir seus cursos"
ON courses FOR DELETE
USING (auth.uid() = author_id);

-- Usuários autenticados podem criar cursos
CREATE POLICY "Usuários autenticados podem criar cursos"
ON courses FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Políticas para tabela videos
-- Todos podem ver vídeos
CREATE POLICY "Qualquer pessoa pode ver vídeos"
ON videos FOR SELECT
USING (true);

-- Apenas autores dos cursos podem gerenciar vídeos
CREATE POLICY "Autores podem gerenciar vídeos de seus cursos"
ON videos FOR ALL
USING (
  auth.uid() IN (
    SELECT author_id FROM courses WHERE id = videos.course_id
  )
);

-- Políticas para tabela user_progress
-- Usuários só podem ver e editar seu próprio progresso
CREATE POLICY "Usuários podem ver seu próprio progresso"
ON user_progress FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seu próprio progresso"
ON user_progress FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir seu próprio progresso"
ON user_progress FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Políticas para tabela projects
-- Usuários só podem ver e editar seus próprios projetos
CREATE POLICY "Usuários podem ver seus próprios projetos"
ON projects FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus próprios projetos"
ON projects FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir projetos"
ON projects FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar seus próprios projetos"
ON projects FOR DELETE
USING (auth.uid() = user_id);

-- Políticas para tabela slides
-- Usuários só podem ver slides de seus próprios projetos
CREATE POLICY "Usuários podem ver slides de seus projetos"
ON slides FOR SELECT
USING (
  auth.uid() IN (
    SELECT user_id FROM projects WHERE id = slides.project_id
  )
);

CREATE POLICY "Usuários podem inserir slides em seus projetos"
ON slides FOR INSERT
WITH CHECK (
  auth.uid() IN (
    SELECT user_id FROM projects WHERE id = slides.project_id
  )
);

CREATE POLICY "Usuários podem atualizar slides de seus projetos"
ON slides FOR UPDATE
USING (
  auth.uid() IN (
    SELECT user_id FROM projects WHERE id = slides.project_id
  )
);

CREATE POLICY "Usuários podem deletar slides de seus projetos"
ON slides FOR DELETE
USING (
  auth.uid() IN (
    SELECT user_id FROM projects WHERE id = slides.project_id
  )
);

-- Políticas para tabela render_jobs
-- Usuários só podem ver jobs de seus próprios projetos
CREATE POLICY "Usuários podem ver jobs de seus projetos"
ON render_jobs FOR SELECT
USING (
  auth.uid() IN (
    SELECT user_id FROM projects WHERE id = render_jobs.project_id
  )
);

CREATE POLICY "Usuários podem inserir jobs em seus projetos"
ON render_jobs FOR INSERT
WITH CHECK (
  auth.uid() IN (
    SELECT user_id FROM projects WHERE id = render_jobs.project_id
  )
);

CREATE POLICY "Usuários podem atualizar jobs de seus projetos"
ON render_jobs FOR UPDATE
USING (
  auth.uid() IN (
    SELECT user_id FROM projects WHERE id = render_jobs.project_id
  )
);

CREATE POLICY "Usuários podem deletar jobs de seus projetos"
ON render_jobs FOR DELETE
USING (
  auth.uid() IN (
    SELECT user_id FROM projects WHERE id = render_jobs.project_id
  )
);

-- Políticas para tabela analytics_events
-- Usuários autenticados podem ver analytics
CREATE POLICY "Usuários autenticados podem ver analytics"
ON analytics_events FOR SELECT
USING (auth.role() = 'authenticated');

-- Usuários autenticados podem adicionar eventos
CREATE POLICY "Usuários autenticados podem inserir analytics"
ON analytics_events FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Políticas para tabela nr_courses
-- Todos podem ver cursos NR
CREATE POLICY "Todos podem ver cursos NR"
ON nr_courses FOR SELECT
USING (true);

-- Administradores podem gerenciar cursos NR
CREATE POLICY "Administradores podem gerenciar cursos NR"
ON nr_courses FOR ALL
USING (auth.email() IN (
  SELECT email FROM users WHERE role = 'admin'
));

-- Políticas para tabela nr_modules
-- Todos podem ver módulos NR
CREATE POLICY "Todos podem ver módulos NR"
ON nr_modules FOR SELECT
USING (true);

-- Administradores podem gerenciar módulos NR
CREATE POLICY "Administradores podem gerenciar módulos NR"
ON nr_modules FOR ALL
USING (auth.email() IN (
  SELECT email FROM users WHERE role = 'admin'
));

-- Função para verificar se o usuário é administrador
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Políticas para administradores (acesso total)
CREATE POLICY "Administradores têm acesso total a users"
ON users FOR ALL
USING (is_admin());

CREATE POLICY "Administradores têm acesso total a courses"
ON courses FOR ALL
USING (is_admin());

CREATE POLICY "Administradores têm acesso total a videos"
ON videos FOR ALL
USING (is_admin());

CREATE POLICY "Administradores têm acesso total a user_progress"
ON user_progress FOR ALL
USING (is_admin());

CREATE POLICY "Administradores têm acesso total a projects"
ON projects FOR ALL
USING (is_admin());

CREATE POLICY "Administradores têm acesso total a slides"
ON slides FOR ALL
USING (is_admin());

CREATE POLICY "Administradores têm acesso total a render_jobs"
ON render_jobs FOR ALL
USING (is_admin());

CREATE POLICY "Administradores têm acesso total a analytics_events"
ON analytics_events FOR ALL
USING (is_admin());

CREATE POLICY "Administradores têm acesso total a nr_courses"
ON nr_courses FOR ALL
USING (is_admin());

CREATE POLICY "Administradores têm acesso total a nr_modules"
ON nr_modules FOR ALL
USING (is_admin());