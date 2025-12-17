-- Performance Optimization Indexes
-- Índices adicionais para otimização de performance
-- Execute com: psql ou via Supabase SQL Editor

-- =====================================
-- Render Jobs Performance Indexes
-- =====================================

-- Índice composto para queries frequentes de status por usuário
CREATE INDEX IF NOT EXISTS idx_render_jobs_user_status 
ON public.render_jobs(user_id, status, created_at DESC);

-- Índice para queries de fila (jobs pendentes/processando)
CREATE INDEX IF NOT EXISTS idx_render_jobs_queue 
ON public.render_jobs(status, created_at ASC) 
WHERE status IN ('pending', 'queued', 'processing');

-- Índice para cleanup de jobs antigos
CREATE INDEX IF NOT EXISTS idx_render_jobs_cleanup 
ON public.render_jobs(created_at) 
WHERE status IN ('completed', 'failed', 'cancelled');

-- =====================================
-- Projects Performance Indexes
-- =====================================

-- Índice para listagem de projetos por usuário ordenado por atualização
CREATE INDEX IF NOT EXISTS idx_projects_user_updated 
ON public.projects(user_id, updated_at DESC);

-- Índice para busca por nome de projeto
CREATE INDEX IF NOT EXISTS idx_projects_name_gin 
ON public.projects USING gin(name gin_trgm_ops);

-- =====================================
-- Slides Performance Indexes
-- =====================================

-- Índice para ordenação de slides em projeto
CREATE INDEX IF NOT EXISTS idx_slides_project_order 
ON public.slides(project_id, order_index ASC);

-- =====================================
-- Analytics Events Performance Indexes
-- =====================================

-- Índice para queries de analytics por período
CREATE INDEX IF NOT EXISTS idx_analytics_events_time 
ON public.analytics_events(created_at DESC);

-- Índice composto para analytics por tipo e usuário
CREATE INDEX IF NOT EXISTS idx_analytics_events_type_user 
ON public.analytics_events(event_type, user_id, created_at DESC);

-- =====================================
-- Timelines Performance Indexes
-- =====================================

-- Índice para lookup de timeline ativa por projeto
CREATE INDEX IF NOT EXISTS idx_timelines_project_active 
ON public.timelines(project_id) 
WHERE is_active = true;

-- =====================================
-- PPTX Uploads Performance Indexes
-- =====================================

-- Índice para listagem de uploads por usuário
CREATE INDEX IF NOT EXISTS idx_pptx_uploads_user 
ON public.pptx_uploads(user_id, created_at DESC);

-- Índice para status de processamento
CREATE INDEX IF NOT EXISTS idx_pptx_uploads_status 
ON public.pptx_uploads(status) 
WHERE status != 'completed';

-- =====================================
-- Enable pg_trgm extension for fuzzy search
-- =====================================
-- Descomente se não estiver habilitado:
-- CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- =====================================
-- Analyze tables after creating indexes
-- =====================================
ANALYZE public.render_jobs;
ANALYZE public.projects;
ANALYZE public.slides;
ANALYZE public.analytics_events;
ANALYZE public.timelines;
ANALYZE public.pptx_uploads;

-- =====================================
-- Check index usage (run after some usage)
-- =====================================
-- SELECT 
--   schemaname,
--   tablename,
--   indexname,
--   idx_scan,
--   idx_tup_read,
--   idx_tup_fetch
-- FROM pg_stat_user_indexes
-- WHERE schemaname = 'public'
-- ORDER BY idx_scan DESC;
