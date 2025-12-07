
-- ===================================
-- SISTEMA DE ARQUIVOS
-- ===================================

-- Tabela de arquivos
CREATE TABLE IF NOT EXISTS files (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  project_id TEXT, -- REFERENCES projects(id) ON DELETE SET NULL (circular dependency, add later or ignore constraint for now if projects not created yet)
  name TEXT NOT NULL,
  path TEXT NOT NULL,
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  size BIGINT NOT NULL,
  type TEXT NOT NULL,
  file_type TEXT CHECK (file_type IN ('presentation', 'image', 'video', 'audio', 'document')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_files_user_id ON files(user_id);
CREATE INDEX IF NOT EXISTS idx_files_project_id ON files(project_id);
CREATE INDEX IF NOT EXISTS idx_files_type ON files(file_type);
CREATE INDEX IF NOT EXISTS idx_files_created_at ON files(created_at DESC);

ALTER TABLE files ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own files" ON files;
CREATE POLICY "Users can view own files" ON files FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own files" ON files;
CREATE POLICY "Users can insert own files" ON files FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own files" ON files;
CREATE POLICY "Users can update own files" ON files FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own files" ON files;
CREATE POLICY "Users can delete own files" ON files FOR DELETE USING (user_id = auth.uid());

-- ===================================
-- SISTEMA DE PROJETOS
-- ===================================

-- Tabela de projetos
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'processing', 'ready', 'rendering', 'completed', 'failed')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_updated_at ON projects(updated_at DESC);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own projects" ON projects;
CREATE POLICY "Users can view own projects" ON projects FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own projects" ON projects;
CREATE POLICY "Users can insert own projects" ON projects FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own projects" ON projects;
CREATE POLICY "Users can update own projects" ON projects FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own projects" ON projects;
CREATE POLICY "Users can delete own projects" ON projects FOR DELETE USING (user_id = auth.uid());

-- Add FK from files to projects now that projects exists
ALTER TABLE files DROP CONSTRAINT IF EXISTS files_project_id_fkey;
ALTER TABLE files ADD CONSTRAINT files_project_id_fkey FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL;

-- ===================================
-- SISTEMA DE SLIDES
-- ===================================

-- Tabela de slides
CREATE TABLE IF NOT EXISTS slides (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  index INTEGER NOT NULL,
  title TEXT,
  content TEXT NOT NULL,
  notes TEXT,
  layout TEXT NOT NULL DEFAULT 'default',
  duration INTEGER NOT NULL DEFAULT 30,
  audio_url TEXT,
  video_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, index)
);

CREATE INDEX IF NOT EXISTS idx_slides_project_id ON slides(project_id);
CREATE INDEX IF NOT EXISTS idx_slides_index ON slides(project_id, index);

ALTER TABLE slides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view slides of own projects" ON slides;
CREATE POLICY "Users can view slides of own projects" ON slides FOR SELECT USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = slides.project_id AND projects.user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert slides to own projects" ON slides;
CREATE POLICY "Users can insert slides to own projects" ON slides FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM projects WHERE projects.id = slides.project_id AND projects.user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can update slides of own projects" ON slides;
CREATE POLICY "Users can update slides of own projects" ON slides FOR UPDATE USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = slides.project_id AND projects.user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can delete slides of own projects" ON slides;
CREATE POLICY "Users can delete slides of own projects" ON slides FOR DELETE USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = slides.project_id AND projects.user_id = auth.uid()));

-- ===================================
-- SISTEMA DE RENDERIZAÇÃO
-- ===================================

-- Tabela de jobs de renderização
CREATE TABLE IF NOT EXISTS render_jobs (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  output_url TEXT,
  error_message TEXT,
  settings JSONB DEFAULT '{}',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_render_jobs_project_id ON render_jobs(project_id);
CREATE INDEX IF NOT EXISTS idx_render_jobs_user_id ON render_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_render_jobs_status ON render_jobs(status);
CREATE INDEX IF NOT EXISTS idx_render_jobs_created_at ON render_jobs(created_at DESC);

ALTER TABLE render_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own render jobs" ON render_jobs;
CREATE POLICY "Users can view own render jobs" ON render_jobs FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own render jobs" ON render_jobs;
CREATE POLICY "Users can insert own render jobs" ON render_jobs FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own render jobs" ON render_jobs;
CREATE POLICY "Users can update own render jobs" ON render_jobs FOR UPDATE USING (user_id = auth.uid());

-- ===================================
-- SISTEMA DE ANALYTICS
-- ===================================

-- Tabela de eventos de analytics
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at DESC);

ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert own events" ON analytics_events;
CREATE POLICY "Users can insert own events" ON analytics_events FOR INSERT WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can view own events" ON analytics_events;
CREATE POLICY "Users can view own events" ON analytics_events FOR SELECT USING (user_id = auth.uid());

-- ===================================
-- SISTEMA DE TTS (TEXT-TO-SPEECH)
-- ===================================

-- Tabela de cache de TTS
CREATE TABLE IF NOT EXISTS tts_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key TEXT NOT NULL UNIQUE,
  text TEXT NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('elevenlabs', 'azure')),
  voice_id TEXT NOT NULL,
  audio_url TEXT NOT NULL,
  characters INTEGER NOT NULL,
  duration NUMERIC,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tts_cache_key ON tts_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_tts_cache_provider ON tts_cache(provider);
CREATE INDEX IF NOT EXISTS idx_tts_cache_voice ON tts_cache(voice_id);

ALTER TABLE tts_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read TTS cache" ON tts_cache;
CREATE POLICY "Anyone can read TTS cache" ON tts_cache FOR SELECT USING (true);
