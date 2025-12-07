-- Add missing indices for performance optimization

-- Render Jobs: Critical for worker polling and history
CREATE INDEX IF NOT EXISTS idx_render_jobs_status ON public.render_jobs(status);
CREATE INDEX IF NOT EXISTS idx_render_jobs_created_at ON public.render_jobs(created_at);

-- Analytics Events: Critical for dashboard filtering
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type ON public.analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON public.analytics_events(created_at);

-- Ordering indices (useful for lists)
CREATE INDEX IF NOT EXISTS idx_slides_order_index ON public.slides(order_index);
CREATE INDEX IF NOT EXISTS idx_videos_order_index ON public.videos(order_index);
CREATE INDEX IF NOT EXISTS idx_nr_modules_order_index ON public.nr_modules(order_index);

-- User Progress: optimize completion checks
CREATE INDEX IF NOT EXISTS idx_user_progress_completed ON public.user_progress(completed);
