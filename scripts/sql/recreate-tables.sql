
-- Drop tables if they exist to ensure clean state
DROP TABLE IF EXISTS tts_cache CASCADE;
DROP TABLE IF EXISTS analytics_events CASCADE;
DROP TABLE IF EXISTS render_jobs CASCADE;
DROP TABLE IF EXISTS slides CASCADE;
DROP TABLE IF EXISTS files CASCADE;
DROP TABLE IF EXISTS projects CASCADE;

-- ===================================
-- SISTEMA DE PROJETOS
-- ===================================

CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'processing', 'ready', 'rendering', 'completed', 'failed')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_created_at ON projects(created_at DESC);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own projects" ON projects FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own projects" ON projects FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own projects" ON projects FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own projects" ON projects FOR DELETE USING (user_id = auth.uid());

-- ===================================
-- SISTEMA DE ARQUIVOS
-- ===================================

CREATE TABLE files (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
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

CREATE INDEX idx_files_user_id ON files(user_id);
CREATE INDEX idx_files_project_id ON files(project_id);
CREATE INDEX idx_files_type ON files(file_type);

ALTER TABLE files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own files" ON files FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own files" ON files FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own files" ON files FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own files" ON files FOR DELETE USING (user_id = auth.uid());

-- ===================================
-- SISTEMA DE SLIDES
-- ===================================

CREATE TABLE slides (
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

CREATE INDEX idx_slides_project_id ON slides(project_id);
CREATE INDEX idx_slides_index ON slides(project_id, index);

ALTER TABLE slides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view slides of own projects" ON slides FOR SELECT USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = slides.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can insert slides to own projects" ON slides FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM projects WHERE projects.id = slides.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can update slides of own projects" ON slides FOR UPDATE USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = slides.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can delete slides of own projects" ON slides FOR DELETE USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = slides.project_id AND projects.user_id = auth.uid()));

-- ===================================
-- SISTEMA DE RENDERIZAÇÃO
-- ===================================

CREATE TABLE render_jobs (
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

CREATE INDEX idx_render_jobs_project_id ON render_jobs(project_id);
CREATE INDEX idx_render_jobs_user_id ON render_jobs(user_id);
CREATE INDEX idx_render_jobs_status ON render_jobs(status);

ALTER TABLE render_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own render jobs" ON render_jobs FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own render jobs" ON render_jobs FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own render jobs" ON render_jobs FOR UPDATE USING (user_id = auth.uid());

-- ===================================
-- SISTEMA DE ANALYTICS
-- ===================================

CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX idx_analytics_events_type ON analytics_events(event_type);

ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own events" ON analytics_events FOR INSERT WITH CHECK (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "Users can view own events" ON analytics_events FOR SELECT USING (user_id = auth.uid());

-- ===================================
-- SISTEMA DE TTS (TEXT-TO-SPEECH)
-- ===================================

CREATE TABLE tts_cache (
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

CREATE INDEX idx_tts_cache_key ON tts_cache(cache_key);

ALTER TABLE tts_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read TTS cache" ON tts_cache FOR SELECT USING (true);
