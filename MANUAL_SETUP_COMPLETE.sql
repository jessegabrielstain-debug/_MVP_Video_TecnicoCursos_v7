-- ============================================
-- SCHEMA COMPLETO PARA SUPABASE
-- ============================================
-- Este arquivo contém todas as tabelas necessárias para o projeto
-- Execute este script no SQL Editor do Supabase

-- ============================================
-- EXTENSÕES NECESSÁRIAS
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABELA: users (Atualizada para Supabase Auth)
-- ============================================
-- Esta tabela será sincronizada com auth.users do Supabase
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    avatar_url TEXT,
    role VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- ============================================
-- TABELA: courses (Para sistema de cursos)
-- ============================================
CREATE TABLE IF NOT EXISTS public.courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    author_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABELA: videos (Para vídeos dos cursos)
-- ============================================
CREATE TABLE IF NOT EXISTS public.videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    video_url TEXT NOT NULL,
    thumbnail_url TEXT,
    duration INTEGER,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABELA: user_progress (Progresso dos usuários)
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    video_id UUID REFERENCES public.videos(id) ON DELETE CASCADE,
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    completed BOOLEAN DEFAULT FALSE,
    last_watched_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, video_id)
);

-- ============================================
-- TABELA: projects (Para projetos de vídeo)
-- ============================================
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'draft',
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABELA: slides (Para slides dos projetos)
-- ============================================
CREATE TABLE IF NOT EXISTS public.slides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL,
    title VARCHAR(500),
    content TEXT,
    duration INTEGER DEFAULT 5,
    background_color VARCHAR(50),
    background_image TEXT,
    avatar_config JSONB DEFAULT '{}'::jsonb,
    audio_config JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABELA: render_jobs (Para jobs de renderização)
-- ============================================
CREATE TABLE IF NOT EXISTS public.render_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'queued',
    progress INTEGER DEFAULT 0,
    output_url TEXT,
    error_message TEXT,
    render_settings JSONB DEFAULT '{}'::jsonb,
    attempts INTEGER DEFAULT 1,
    duration_ms INTEGER,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABELA: analytics_events (Para analytics)
-- ============================================
CREATE TABLE IF NOT EXISTS public.analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB DEFAULT '{}'::jsonb,
    session_id VARCHAR(255),
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABELA: nr_courses (Cursos NR específicos)
-- ============================================
CREATE TABLE IF NOT EXISTS public.nr_courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_code VARCHAR(10) NOT NULL UNIQUE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    duration INTEGER,
    modules_count INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'active',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABELA: nr_modules (Módulos dos Cursos NR)
-- ============================================
CREATE TABLE IF NOT EXISTS public.nr_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES public.nr_courses(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    video_url TEXT,
    duration INTEGER,
    content JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABELA: nr_templates (Templates de Cursos NR)
-- ============================================
CREATE TABLE IF NOT EXISTS public.nr_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nr_number VARCHAR(10) NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT,
    slide_count INTEGER NOT NULL DEFAULT 5,
    duration_seconds INTEGER NOT NULL DEFAULT 300,
    template_config JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_courses_author_id ON public.courses(author_id);
CREATE INDEX IF NOT EXISTS idx_videos_course_id ON public.videos(course_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON public.user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_video_id ON public.user_progress(video_id);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_slides_project_id ON public.slides(project_id);
CREATE INDEX IF NOT EXISTS idx_render_jobs_project_id ON public.render_jobs(project_id);
CREATE INDEX IF NOT EXISTS idx_analytics_user_id ON public.analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_nr_modules_course_id ON public.nr_modules(course_id);
CREATE INDEX IF NOT EXISTS idx_nr_templates_nr_number ON public.nr_templates(nr_number);

-- ============================================
-- FUNÇÃO PARA ATUALIZAR UPDATED_AT
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ============================================
-- TRIGGERS PARA UPDATED_AT
-- ============================================
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON public.courses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_videos_updated_at BEFORE UPDATE ON public.videos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_progress_updated_at BEFORE UPDATE ON public.user_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_slides_updated_at BEFORE UPDATE ON public.slides
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_nr_courses_updated_at BEFORE UPDATE ON public.nr_courses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_nr_modules_updated_at BEFORE UPDATE ON public.nr_modules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_nr_templates_updated_at BEFORE UPDATE ON public.nr_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- FUNÇÃO PARA CRIAR PERFIL DE USUÁRIO
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TRIGGER PARA CRIAR PERFIL AUTOMATICAMENTE
-- ============================================
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
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
-- ============================================================================
-- SCRIPT: Criação de Tabela e Seed de Templates NR
-- Descrição: Migra templates de NRs (Normas Regulamentadoras) para o banco
-- Autor: Estúdio IA Vídeos
-- Data: 2025-01-19
-- ============================================================================

-- Cria tabela nr_templates se não existir
CREATE TABLE IF NOT EXISTS nr_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nr_number VARCHAR(10) NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  slide_count INTEGER NOT NULL DEFAULT 5,
  duration_seconds INTEGER NOT NULL DEFAULT 300,
  template_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_nr_templates_nr_number ON nr_templates(nr_number);
CREATE INDEX IF NOT EXISTS idx_nr_templates_created_at ON nr_templates(created_at DESC);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_nr_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_nr_templates_updated_at ON nr_templates;
CREATE TRIGGER trigger_update_nr_templates_updated_at
  BEFORE UPDATE ON nr_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_nr_templates_updated_at();

-- ============================================================================
-- SEED: Templates de NRs Existentes
-- ============================================================================

-- Limpa dados antigos (apenas para desenvolvimento)
-- TRUNCATE TABLE nr_templates RESTART IDENTITY CASCADE;

-- Insere templates base (INSERT ... ON CONFLICT para idempotência)
INSERT INTO nr_templates (nr_number, title, description, slide_count, duration_seconds, template_config)
VALUES
  (
    'NR-01',
    'Disposições Gerais e Gerenciamento de Riscos Ocupacionais',
    'Norma que estabelece disposições gerais, campo de aplicação, termos e definições comuns às Normas Regulamentadoras - NR relativas à segurança e saúde no trabalho e as diretrizes e os requisitos para o gerenciamento de riscos ocupacionais e as medidas de prevenção em Segurança e Saúde no Trabalho - SST.',
    8,
    480,
    '{
      "themeColor": "#1e3a8a",
      "fontFamily": "Inter",
      "transitionType": "fade",
      "avatarEnabled": true,
      "avatarPosition": "bottom-right",
      "audioEnabled": true,
      "subtitlesEnabled": true
    }'::jsonb
  ),
  (
    'NR-06',
    'Equipamento de Proteção Individual - EPI',
    'Esta Norma Regulamentadora - NR estabelece os requisitos para a comercialização, a disponibilização, o uso e a fiscalização de Equipamentos de Proteção Individual - EPI, a serem observados em todos os locais de trabalho onde se aplica a legislação trabalhista.',
    10,
    600,
    '{
      "themeColor": "#047857",
      "fontFamily": "Inter",
      "transitionType": "slide",
      "avatarEnabled": true,
      "avatarPosition": "bottom-left",
      "audioEnabled": true,
      "subtitlesEnabled": true,
      "exampleImages": ["epi-capacete.jpg", "epi-luvas.jpg", "epi-oculos.jpg"]
    }'::jsonb
  ),
  (
    'NR-12',
    'Segurança no Trabalho em Máquinas e Equipamentos',
    'Define referências técnicas, princípios fundamentais e medidas de proteção para resguardar a saúde e a integridade física dos trabalhadores e estabelece requisitos mínimos para a prevenção de acidentes e doenças do trabalho nas fases de projeto e de utilização de máquinas e equipamentos, e ainda à sua fabricação, importação, comercialização, exposição e cessão a qualquer título.',
    12,
    720,
    '{
      "themeColor": "#dc2626",
      "fontFamily": "Inter",
      "transitionType": "zoom",
      "avatarEnabled": true,
      "avatarPosition": "center-bottom",
      "audioEnabled": true,
      "subtitlesEnabled": true,
      "warningLevel": "high"
    }'::jsonb
  ),
  (
    'NR-05',
    'Comissão Interna de Prevenção de Acidentes - CIPA',
    'Estabelece os parâmetros e os requisitos para a constituição, funcionamento e treinamento da Comissão Interna de Prevenção de Acidentes e Assédio - CIPA.',
    7,
    420,
    '{
      "themeColor": "#0369a1",
      "fontFamily": "Inter",
      "transitionType": "fade",
      "avatarEnabled": true,
      "avatarPosition": "bottom-right",
      "audioEnabled": true,
      "subtitlesEnabled": true
    }'::jsonb
  ),
  (
    'NR-07',
    'Programa de Controle Médico de Saúde Ocupacional - PCMSO',
    'Estabelece a obrigatoriedade da elaboração e implementação do Programa de Controle Médico de Saúde Ocupacional - PCMSO, com o objetivo de promoção e preservação da saúde dos trabalhadores.',
    9,
    540,
    '{
      "themeColor": "#7c3aed",
      "fontFamily": "Inter",
      "transitionType": "slide",
      "avatarEnabled": true,
      "avatarPosition": "bottom-left",
      "audioEnabled": true,
      "subtitlesEnabled": true
    }'::jsonb
  ),
  (
    'NR-09',
    'Avaliação e Controle das Exposições Ocupacionais',
    'Estabelece os requisitos para a avaliação das exposições ocupacionais a agentes físicos, químicos e biológicos quando identificados no Programa de Gerenciamento de Riscos - PGR, e subsidiá-lo quanto às medidas de prevenção para os riscos ocupacionais.',
    11,
    660,
    '{
      "themeColor": "#ea580c",
      "fontFamily": "Inter",
      "transitionType": "zoom",
      "avatarEnabled": true,
      "avatarPosition": "center-bottom",
      "audioEnabled": true,
      "subtitlesEnabled": true
    }'::jsonb
  ),
  (
    'NR-10',
    'Segurança em Instalações e Serviços em Eletricidade',
    'Estabelece os requisitos e condições mínimas objetivando a implementação de medidas de controle e sistemas preventivos, de forma a garantir a segurança e a saúde dos trabalhadores que, direta ou indiretamente, interajam em instalações elétricas e serviços com eletricidade.',
    13,
    780,
    '{
      "themeColor": "#facc15",
      "fontFamily": "Inter",
      "transitionType": "fade",
      "avatarEnabled": true,
      "avatarPosition": "bottom-right",
      "audioEnabled": true,
      "subtitlesEnabled": true,
      "warningLevel": "critical"
    }'::jsonb
  ),
  (
    'NR-17',
    'Ergonomia',
    'Visa estabelecer as diretrizes e os requisitos que permitam a adaptação das condições de trabalho às características psicofisiológicas dos trabalhadores, de modo a proporcionar conforto, segurança, saúde e desempenho eficiente no trabalho.',
    8,
    480,
    '{
      "themeColor": "#10b981",
      "fontFamily": "Inter",
      "transitionType": "slide",
      "avatarEnabled": true,
      "avatarPosition": "bottom-left",
      "audioEnabled": true,
      "subtitlesEnabled": true
    }'::jsonb
  ),
  (
    'NR-18',
    'Condições de Segurança e Saúde no Trabalho na Indústria da Construção',
    'Estabelece diretrizes de ordem administrativa, de planejamento e de organização, que objetivam a implementação de medidas de controle e sistemas preventivos de segurança nos processos, nas condições e no meio ambiente de trabalho na Indústria da Construção.',
    14,
    840,
    '{
      "themeColor": "#f59e0b",
      "fontFamily": "Inter",
      "transitionType": "zoom",
      "avatarEnabled": true,
      "avatarPosition": "center-bottom",
      "audioEnabled": true,
      "subtitlesEnabled": true,
      "warningLevel": "high"
    }'::jsonb
  ),
  (
    'NR-35',
    'Trabalho em Altura',
    'Estabelece os requisitos mínimos e as medidas de proteção para o trabalho em altura, envolvendo o planejamento, a organização e a execução, de forma a garantir a segurança e a saúde dos trabalhadores envolvidos direta ou indiretamente com esta atividade.',
    10,
    600,
    '{
      "themeColor": "#ef4444",
      "fontFamily": "Inter",
      "transitionType": "fade",
      "avatarEnabled": true,
      "avatarPosition": "bottom-right",
      "audioEnabled": true,
      "subtitlesEnabled": true,
      "warningLevel": "critical"
    }'::jsonb
  )
ON CONFLICT (nr_number) DO UPDATE
  SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    slide_count = EXCLUDED.slide_count,
    duration_seconds = EXCLUDED.duration_seconds,
    template_config = EXCLUDED.template_config,
    updated_at = NOW();

-- ============================================================================
-- RLS (Row Level Security)
-- ============================================================================

-- Habilita RLS
ALTER TABLE nr_templates ENABLE ROW LEVEL SECURITY;

-- Políticas: Leitura pública, escrita apenas para admins
DROP POLICY IF EXISTS "nr_templates_select_public" ON nr_templates;
CREATE POLICY "nr_templates_select_public"
  ON nr_templates
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "nr_templates_insert_admin" ON nr_templates;
CREATE POLICY "nr_templates_insert_admin"
  ON nr_templates
  FOR INSERT
  WITH CHECK (is_admin());

DROP POLICY IF EXISTS "nr_templates_update_admin" ON nr_templates;
CREATE POLICY "nr_templates_update_admin"
  ON nr_templates
  FOR UPDATE
  USING (is_admin());

DROP POLICY IF EXISTS "nr_templates_delete_admin" ON nr_templates;
CREATE POLICY "nr_templates_delete_admin"
  ON nr_templates
  FOR DELETE
  USING (is_admin());

-- ============================================================================
-- VERIFICAÇÃO
-- ============================================================================

-- Conta quantos templates foram inseridos
SELECT COUNT(*) AS total_templates FROM nr_templates;

-- Lista todos os templates
SELECT nr_number, title, slide_count, duration_seconds 
FROM nr_templates 
ORDER BY nr_number;
-- ============================================
-- DADOS INICIAIS - CURSOS NR
-- ============================================
-- Script para popular cursos NR12, NR33, NR35
-- Data: 09/10/2025

-- ============================================
-- CURSO NR12 - Segurança em Máquinas e Equipamentos
-- ============================================

INSERT INTO public.nr_courses (course_code, title, description, thumbnail_url, duration, modules_count, status, metadata)
VALUES (
    'NR12',
    'NR12 - Segurança em Máquinas e Equipamentos',
    'Curso completo sobre segurança no trabalho com máquinas e equipamentos de trabalho, abordando os principais riscos e medidas de proteção.',
    'nr12-thumb.jpg',
    480, -- 8 horas em minutos
    9,
    'active',
    '{
        "category": "Segurança do Trabalho",
        "difficulty": "Intermediário",
        "requirements": ["Ensino Fundamental Completo"],
        "certification": true
    }'::jsonb
) ON CONFLICT (course_code) DO UPDATE
SET title = EXCLUDED.title,
    description = EXCLUDED.description,
    thumbnail_url = EXCLUDED.thumbnail_url,
    updated_at = NOW();

-- Módulos do NR12
INSERT INTO public.nr_modules (course_id, order_index, title, description, thumbnail_url, duration, content)
SELECT 
    c.id,
    1,
    'Introdução à NR12',
    'Apresentação da norma regulamentadora NR12 e sua importância para a segurança do trabalho',
    'nr12-intro.jpg',
    45,
    '{
        "topics": [
            "O que é a NR12",
            "Histórico e evolução da norma",
            "Importância da segurança em máquinas",
            "Responsabilidades legais"
        ],
        "resources": ["vídeo", "slides", "quiz"]
    }'::jsonb
FROM public.nr_courses c WHERE c.course_code = 'NR12'
ON CONFLICT DO NOTHING;

INSERT INTO public.nr_modules (course_id, order_index, title, description, thumbnail_url, duration, content)
SELECT 
    c.id,
    2,
    'Objetivos e Campo de Aplicação',
    'Compreenda os objetivos da NR12 e onde ela deve ser aplicada',
    'nr12-objetivos.jpg',
    40,
    '{
        "topics": [
            "Objetivos da NR12",
            "Campo de aplicação",
            "Equipamentos abrangidos",
            "Exceções e casos especiais"
        ],
        "resources": ["vídeo", "slides", "exemplos práticos"]
    }'::jsonb
FROM public.nr_courses c WHERE c.course_code = 'NR12'
ON CONFLICT DO NOTHING;

INSERT INTO public.nr_modules (course_id, order_index, title, description, thumbnail_url, duration, content)
SELECT 
    c.id,
    3,
    'Arranjo Físico e Instalações',
    'Requisitos de espaço e organização para operação segura',
    'nr12-arranjo.jpg',
    50,
    '{
        "topics": [
            "Espaços mínimos requeridos",
            "Circulação e vias de acesso",
            "Iluminação adequada",
            "Pisos e áreas de trabalho"
        ],
        "resources": ["vídeo", "slides", "plantas baixas exemplo"]
    }'::jsonb
FROM public.nr_courses c WHERE c.course_code = 'NR12'
ON CONFLICT DO NOTHING;

INSERT INTO public.nr_modules (course_id, order_index, title, description, thumbnail_url, duration, content)
SELECT 
    c.id,
    4,
    'Instalações Elétricas',
    'Segurança em instalações e dispositivos elétricos de máquinas',
    'nr12-eletrico.jpg',
    60,
    '{
        "topics": [
            "Quadros elétricos",
            "Dispositivos de segurança elétrica",
            "Aterramento",
            "Manutenção elétrica segura"
        ],
        "resources": ["vídeo", "slides", "diagramas elétricos"]
    }'::jsonb
FROM public.nr_courses c WHERE c.course_code = 'NR12'
ON CONFLICT DO NOTHING;

INSERT INTO public.nr_modules (course_id, order_index, title, description, thumbnail_url, duration, content)
SELECT 
    c.id,
    5,
    'Dispositivos de Partida, Acionamento e Parada',
    'Sistemas de controle seguro de máquinas',
    'nr12-partida.jpg',
    55,
    '{
        "topics": [
            "Botões de emergência",
            "Sistemas de partida segura",
            "Dispositivos de parada",
            "Bloqueios e intertravamentos"
        ],
        "resources": ["vídeo", "slides", "demonstrações práticas"]
    }'::jsonb
FROM public.nr_courses c WHERE c.course_code = 'NR12'
ON CONFLICT DO NOTHING;

INSERT INTO public.nr_modules (course_id, order_index, title, description, thumbnail_url, duration, content)
SELECT 
    c.id,
    6,
    'Sistemas de Segurança',
    'Proteções e dispositivos de segurança em máquinas',
    'nr12-seguranca.jpg',
    70,
    '{
        "topics": [
            "Proteções fixas e móveis",
            "Cortinas de luz",
            "Sensores de presença",
            "Bloqueios mecânicos",
            "Válvulas de segurança"
        ],
        "resources": ["vídeo", "slides", "casos práticos"]
    }'::jsonb
FROM public.nr_courses c WHERE c.course_code = 'NR12'
ON CONFLICT DO NOTHING;

INSERT INTO public.nr_modules (course_id, order_index, title, description, thumbnail_url, duration, content)
SELECT 
    c.id,
    7,
    'Procedimentos de Trabalho e Segurança',
    'Como trabalhar de forma segura com máquinas',
    'nr12-procedimentos.jpg',
    65,
    '{
        "topics": [
            "Análise de risco",
            "Procedimentos operacionais padrão",
            "Permissão de trabalho",
            "Check-list de segurança",
            "EPIs necessários"
        ],
        "resources": ["vídeo", "slides", "modelos de documentos"]
    }'::jsonb
FROM public.nr_courses c WHERE c.course_code = 'NR12'
ON CONFLICT DO NOTHING;

INSERT INTO public.nr_modules (course_id, order_index, title, description, thumbnail_url, duration, content)
SELECT 
    c.id,
    8,
    'Capacitação e Treinamento',
    'Requisitos de capacitação para operadores',
    'nr12-treinamento.jpg',
    50,
    '{
        "topics": [
            "Capacitação básica",
            "Capacitação específica",
            "Reciclagem periódica",
            "Certificação de operadores",
            "Registro de treinamentos"
        ],
        "resources": ["vídeo", "slides", "certificados modelo"]
    }'::jsonb
FROM public.nr_courses c WHERE c.course_code = 'NR12'
ON CONFLICT DO NOTHING;

INSERT INTO public.nr_modules (course_id, order_index, title, description, thumbnail_url, duration, content)
SELECT 
    c.id,
    9,
    'Manutenção e Inspeção',
    'Práticas seguras de manutenção de máquinas',
    'nr12-manutencao.jpg',
    45,
    '{
        "topics": [
            "Plano de manutenção",
            "Lock-out/Tag-out",
            "Inspeções periódicas",
            "Registros de manutenção",
            "Substituição de componentes"
        ],
        "resources": ["vídeo", "slides", "checklists"]
    }'::jsonb
FROM public.nr_courses c WHERE c.course_code = 'NR12'
ON CONFLICT DO NOTHING;

-- ============================================
-- CURSO NR33 - Segurança em Espaços Confinados
-- ============================================

INSERT INTO public.nr_courses (course_code, title, description, thumbnail_url, duration, modules_count, status, metadata)
VALUES (
    'NR33',
    'NR33 - Segurança e Saúde em Espaços Confinados',
    'Curso sobre trabalho seguro em espaços confinados, identificação de riscos e procedimentos de emergência.',
    'nr33-thumb.jpg',
    960, -- 16 horas
    8,
    'active',
    '{
        "category": "Segurança do Trabalho",
        "difficulty": "Avançado",
        "requirements": ["NR35 ou experiência em segurança"],
        "certification": true,
        "mandatory_practical": true
    }'::jsonb
) ON CONFLICT (course_code) DO UPDATE
SET title = EXCLUDED.title,
    description = EXCLUDED.description,
    updated_at = NOW();

-- ============================================
-- CURSO NR35 - Trabalho em Altura
-- ============================================

INSERT INTO public.nr_courses (course_code, title, description, thumbnail_url, duration, modules_count, status, metadata)
VALUES (
    'NR35',
    'NR35 - Trabalho em Altura',
    'Treinamento completo para trabalho seguro em altura, com foco em prevenção de quedas e uso de EPIs.',
    'nr35-thumb.jpg',
    480, -- 8 horas
    10,
    'active',
    '{
        "category": "Segurança do Trabalho",
        "difficulty": "Intermediário",
        "requirements": ["Aptidão física", "Exame médico válido"],
        "certification": true,
        "validity_months": 24,
        "mandatory_practical": true
    }'::jsonb
) ON CONFLICT (course_code) DO UPDATE
SET title = EXCLUDED.title,
    description = EXCLUDED.description,
    updated_at = NOW();

-- ============================================
-- VERIFICAÇÃO DOS DADOS INSERIDOS
-- ============================================

-- Ver todos os cursos
SELECT 
    course_code,
    title,
    modules_count,
    duration,
    status
FROM public.nr_courses
ORDER BY course_code;

-- Ver módulos por curso
SELECT 
    c.course_code,
    m.order_index,
    m.title,
    m.duration
FROM public.nr_modules m
JOIN public.nr_courses c ON c.id = m.course_id
ORDER BY c.course_code, m.order_index;
