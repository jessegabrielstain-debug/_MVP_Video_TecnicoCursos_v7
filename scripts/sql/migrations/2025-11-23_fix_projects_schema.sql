-- Fix Projects Schema and Add Missing Tables (Split Friendly)

-- 1. Create ENUMs (Ignore errors if they exist)
CREATE TYPE project_type AS ENUM ('pptx', 'template-nr', 'talking-photo', 'custom', 'ai-generated');
CREATE TYPE project_status AS ENUM ('draft', 'in-progress', 'review', 'completed', 'archived', 'error');
CREATE TYPE priority_level AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE collaboration_role AS ENUM ('owner', 'editor', 'viewer', 'reviewer');
CREATE TYPE analytics_event_type AS ENUM ('project_created', 'project_updated', 'project_deleted', 'project_viewed', 'project_shared', 'project_duplicated', 'version_created', 'collaboration_added');

-- 2. Update 'projects' table
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS name VARCHAR(255);

-- Try to update name from title. If title doesn't exist, this will fail but we ignore it.
UPDATE public.projects SET name = title WHERE name IS NULL;

ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS type project_type DEFAULT 'custom';
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{"tags": [], "category": "general", "priority": "medium", "custom_fields": {}}'::jsonb;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS current_version VARCHAR(20) DEFAULT '1.0.0';
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS is_template BOOLEAN DEFAULT false;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS collaboration_enabled BOOLEAN DEFAULT false;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS render_settings JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS preview_url TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS last_accessed_at TIMESTAMPTZ DEFAULT NOW();

-- 3. Create missing tables

CREATE TABLE IF NOT EXISTS public.project_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id TEXT NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    version_number VARCHAR(20) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    changes_summary TEXT,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(project_id, version_number)
);

CREATE TABLE IF NOT EXISTS public.project_collaborators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id TEXT NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role collaboration_role DEFAULT 'viewer',
    permissions JSONB DEFAULT '{"can_edit": false, "can_comment": true, "can_share": false, "can_export": false}'::jsonb,
    invited_by UUID REFERENCES auth.users(id),
    invited_at TIMESTAMPTZ DEFAULT NOW(),
    accepted_at TIMESTAMPTZ,
    UNIQUE(project_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.project_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id TEXT NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_type analytics_event_type NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.project_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id TEXT NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES public.project_comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{"position": null, "element_id": null, "resolved": false}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.project_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE,
    color VARCHAR(7) DEFAULT '#6B7280',
    description TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.project_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(50),
    color VARCHAR(7) DEFAULT '#6B7280',
    parent_id UUID REFERENCES public.project_categories(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create Indexes (Ignore if exists)

CREATE INDEX IF NOT EXISTS idx_projects_type ON public.projects(type);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_last_accessed ON public.projects(last_accessed_at);
CREATE INDEX IF NOT EXISTS idx_project_versions_project_id ON public.project_versions(project_id);
CREATE INDEX IF NOT EXISTS idx_project_collaborators_project_id ON public.project_collaborators(project_id);
CREATE INDEX IF NOT EXISTS idx_project_collaborators_user_id ON public.project_collaborators(user_id);

-- 5. Insert default data
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
