-- Índices para render_jobs (video jobs API)
CREATE INDEX IF NOT EXISTS idx_render_jobs_user_created_at ON render_jobs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_render_jobs_status ON render_jobs(status);
-- ============================================
-- FASE 2: CRIAÇÃO DE ÍNDICES E TRIGGERS
-- ============================================

-- ÍNDICES
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_slides_project_id ON public.slides(project_id);
CREATE INDEX IF NOT EXISTS idx_render_jobs_project_id ON public.render_jobs(project_id);
CREATE INDEX IF NOT EXISTS idx_analytics_user_id ON public.analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_nr_modules_course_id ON public.nr_modules(course_id);

-- FUNÇÃO E TRIGGERS PARA UPDATED_AT
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS '
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
' language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_slides_updated_at BEFORE UPDATE ON public.slides FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_nr_courses_updated_at BEFORE UPDATE ON public.nr_courses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_nr_modules_updated_at BEFORE UPDATE ON public.nr_modules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
