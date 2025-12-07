-- ============================================
-- SCHEMA COMPLETO PARA SUPABASE (ATUALIZADO)
-- ============================================

-- ============================================
-- EXTENSÕES NECESSÁRIAS
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================
-- TIPOS ENUM (DO MIGRATION 004)
-- ============================================
DO $$ BEGIN
    CREATE TYPE project_type AS ENUM ('pptx', 'template-nr', 'talking-photo', 'custom', 'ai-generated');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE project_status AS ENUM ('draft', 'in-progress', 'review', 'completed', 'archived', 'error');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE priority_level AS ENUM ('low', 'medium', 'high', 'urgent');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE collaboration_role AS ENUM ('owner', 'editor', 'viewer', 'reviewer');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE analytics_event_type AS ENUM ('project_created', 'project_updated', 'project_deleted', 'project_viewed', 'project_shared', 'project_duplicated', 'version_created', 'collaboration_added');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- TABELA: users
-- ============================================
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
-- TABELA: projects (ATUALIZADA COM 004)
-- ============================================
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type project_type NOT NULL DEFAULT 'custom',
    status project_status DEFAULT 'draft',
    description TEXT,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    metadata JSONB DEFAULT '{
        "tags": [],
        "category": "general",
        "priority": "medium",
        "custom_fields": {}
    }'::jsonb,
    current_version VARCHAR(20) DEFAULT '1.0.0',
    is_template BOOLEAN DEFAULT false,
    is_public BOOLEAN DEFAULT false,
    collaboration_enabled BOOLEAN DEFAULT false,
    render_settings JSONB DEFAULT '{}'::jsonb,
    thumbnail_url TEXT,
    preview_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT projects_name_length CHECK (char_length(name) >= 1 AND char_length(name) <= 255),
    CONSTRAINT projects_valid_metadata CHECK (jsonb_typeof(metadata) = 'object')
);

-- ============================================
-- TABELA: project_versions (NOVA)
-- ============================================
CREATE TABLE IF NOT EXISTS public.project_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    version_number VARCHAR(20) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    changes_summary TEXT,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(project_id, version_number),
    CONSTRAINT version_number_format CHECK (version_number ~ '^[0-9]+\.[0-9]+\.[0-9]+$')
);

-- ============================================
-- TABELA: project_collaborators (NOVA)
-- ============================================
CREATE TABLE IF NOT EXISTS public.project_collaborators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role collaboration_role DEFAULT 'viewer',
    permissions JSONB DEFAULT '{
        "can_edit": false,
        "can_comment": true,
        "can_share": false,
        "can_export": false
    }'::jsonb,
    invited_by UUID REFERENCES auth.users(id),
    invited_at TIMESTAMPTZ DEFAULT NOW(),
    accepted_at TIMESTAMPTZ,
    UNIQUE(project_id, user_id)
);

-- ============================================
-- TABELA: project_analytics (NOVA)
-- ============================================
CREATE TABLE IF NOT EXISTS public.project_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_type analytics_event_type NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABELA: project_comments (NOVA)
-- ============================================
CREATE TABLE IF NOT EXISTS public.project_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES public.project_comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{
        "position": null,
        "element_id": null,
        "resolved": false
    }'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT comment_content_length CHECK (char_length(content) >= 1 AND char_length(content) <= 5000)
);

-- ============================================
-- TABELA: project_tags (NOVA)
-- ============================================
CREATE TABLE IF NOT EXISTS public.project_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE,
    color VARCHAR(7) DEFAULT '#6B7280',
    description TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT tag_name_format CHECK (name ~ '^[a-zA-Z0-9\-_\s]+$'),
    CONSTRAINT tag_color_format CHECK (color ~ '^#[0-9A-Fa-f]{6}$')
);

-- ============================================
-- TABELA: project_categories (NOVA)
-- ============================================
CREATE TABLE IF NOT EXISTS public.project_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(50),
    color VARCHAR(7) DEFAULT '#6B7280',
    parent_id UUID REFERENCES public.project_categories(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABELA: slides
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
-- TABELA: render_jobs
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
-- TABELA: analytics_events
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
-- TABELA: courses
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
-- TABELA: videos
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
-- TABELA: user_progress
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
-- TABELA: nr_courses
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
-- TABELA: nr_modules
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
-- TABELA: nr_templates
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
-- TABELA: timelines
-- ============================================
CREATE TABLE IF NOT EXISTS public.timelines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    tracks JSONB DEFAULT '[]'::jsonb,
    settings JSONB DEFAULT '{}'::jsonb,
    total_duration INTEGER DEFAULT 0,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(project_id)
);

-- ============================================
-- TABELA: pptx_uploads
-- ============================================
CREATE TABLE IF NOT EXISTS public.pptx_uploads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    original_filename TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    slide_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABELA: pptx_slides
-- ============================================
CREATE TABLE IF NOT EXISTS public.pptx_slides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    upload_id UUID REFERENCES public.pptx_uploads(id) ON DELETE CASCADE,
    slide_number INTEGER NOT NULL,
    title TEXT,
    content TEXT,
    duration INTEGER DEFAULT 5,
    transition_type VARCHAR(50) DEFAULT 'none',
    thumbnail_url TEXT,
    notes TEXT,
    properties JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABELA: project_history
-- ============================================
CREATE TABLE IF NOT EXISTS public.project_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    description TEXT,
    changes JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ÍNDICES
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
CREATE INDEX IF NOT EXISTS idx_timelines_project_id ON public.timelines(project_id);

CREATE INDEX IF NOT EXISTS idx_pptx_uploads_project_id ON public.pptx_uploads(project_id);
CREATE INDEX IF NOT EXISTS idx_pptx_slides_upload_id ON public.pptx_slides(upload_id);
CREATE INDEX IF NOT EXISTS idx_project_history_project_id ON public.project_history(project_id);
CREATE INDEX IF NOT EXISTS idx_project_history_user_id ON public.project_history(user_id);

CREATE INDEX IF NOT EXISTS idx_projects_type ON public.projects(type);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON public.projects(created_at);
CREATE INDEX IF NOT EXISTS idx_projects_updated_at ON public.projects(updated_at);
CREATE INDEX IF NOT EXISTS idx_projects_last_accessed ON public.projects(last_accessed_at);
CREATE INDEX IF NOT EXISTS idx_projects_is_template ON public.projects(is_template);
CREATE INDEX IF NOT EXISTS idx_projects_is_public ON public.projects(is_public);
CREATE INDEX IF NOT EXISTS idx_projects_metadata_tags ON public.projects USING GIN ((metadata->'tags'));
CREATE INDEX IF NOT EXISTS idx_projects_metadata_category ON public.projects((metadata->>'category'));
CREATE INDEX IF NOT EXISTS idx_projects_metadata_priority ON public.projects((metadata->>'priority'));
CREATE INDEX IF NOT EXISTS idx_projects_search ON public.projects USING GIN (to_tsvector('english', name || ' ' || COALESCE(description, '')));

CREATE INDEX IF NOT EXISTS idx_project_versions_project_id ON public.project_versions(project_id);
CREATE INDEX IF NOT EXISTS idx_project_versions_created_at ON public.project_versions(created_at);

CREATE INDEX IF NOT EXISTS idx_project_collaborators_project_id ON public.project_collaborators(project_id);
CREATE INDEX IF NOT EXISTS idx_project_collaborators_user_id ON public.project_collaborators(user_id);

CREATE INDEX IF NOT EXISTS idx_project_analytics_project_id ON public.project_analytics(project_id);
CREATE INDEX IF NOT EXISTS idx_project_analytics_user_id ON public.project_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_project_analytics_event_type ON public.project_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_project_analytics_created_at ON public.project_analytics(created_at);

CREATE INDEX IF NOT EXISTS idx_project_comments_project_id ON public.project_comments(project_id);
CREATE INDEX IF NOT EXISTS idx_project_comments_user_id ON public.project_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_project_comments_parent_id ON public.project_comments(parent_id);

-- ============================================
-- FUNÇÕES E TRIGGERS
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_courses_updated_at ON public.courses;
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON public.courses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_videos_updated_at ON public.videos;
CREATE TRIGGER update_videos_updated_at BEFORE UPDATE ON public.videos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_progress_updated_at ON public.user_progress;
CREATE TRIGGER update_user_progress_updated_at BEFORE UPDATE ON public.user_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_projects_updated_at ON public.projects;
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_slides_updated_at ON public.slides;
CREATE TRIGGER update_slides_updated_at BEFORE UPDATE ON public.slides FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_nr_courses_updated_at ON public.nr_courses;
CREATE TRIGGER update_nr_courses_updated_at BEFORE UPDATE ON public.nr_courses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_nr_modules_updated_at ON public.nr_modules;
CREATE TRIGGER update_nr_modules_updated_at BEFORE UPDATE ON public.nr_modules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_nr_templates_updated_at ON public.nr_templates;
CREATE TRIGGER update_nr_templates_updated_at BEFORE UPDATE ON public.nr_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_timelines_updated_at ON public.timelines;
CREATE TRIGGER update_timelines_updated_at BEFORE UPDATE ON public.timelines FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_pptx_uploads_updated_at ON public.pptx_uploads;
CREATE TRIGGER update_pptx_uploads_updated_at BEFORE UPDATE ON public.pptx_uploads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_pptx_slides_updated_at ON public.pptx_slides;
CREATE TRIGGER update_pptx_slides_updated_at BEFORE UPDATE ON public.pptx_slides FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_project_comments_updated_at ON public.project_comments;
CREATE TRIGGER update_project_comments_updated_at BEFORE UPDATE ON public.project_comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- DADOS INICIAIS (CATEGORIAS E TAGS)
-- ============================================
INSERT INTO public.project_categories (name, description, icon, color) VALUES
    ('General', 'General purpose projects', 'folder', '#6B7280'),
    ('Education', 'Educational content projects', 'graduation-cap', '#3B82F6'),
    ('Marketing', 'Marketing and promotional content', 'megaphone', '#EF4444'),
    ('Training', 'Training and instructional videos', 'book-open', '#10B981'),
    ('Presentation', 'Business presentations', 'presentation', '#8B5CF6'),
    ('Template', 'Reusable templates', 'layout-template', '#F59E0B')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.project_tags (name, color, description) VALUES
    ('urgent', '#EF4444', 'High priority projects'),
    ('template', '#8B5CF6', 'Template projects'),
    ('draft', '#6B7280', 'Draft projects'),
    ('review', '#F59E0B', 'Projects under review'),
    ('completed', '#10B981', 'Completed projects'),
    ('ai-generated', '#3B82F6', 'AI generated content'),
    ('collaboration', '#EC4899', 'Collaborative projects'),
    ('public', '#06B6D4', 'Public projects')
ON CONFLICT (name) DO NOTHING;
