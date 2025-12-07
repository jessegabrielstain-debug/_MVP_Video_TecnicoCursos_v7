CREATE TABLE IF NOT EXISTS public.user_render_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    settings JSONB NOT NULL DEFAULT '{
        "auto_retry": true,
        "max_retries": 3,
        "priority_boost": false,
        "quality_preset": "standard",
        "notifications": {
            "on_completion": true,
            "on_failure": true,
            "on_queue_position": false
        },
        "resource_limits": {
            "max_cpu_usage": 80,
            "max_memory_usage": 70,
            "max_duration": 3600
        }
    }'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_render_settings_user_id ON public.user_render_settings(user_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_user_render_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_user_render_settings_updated_at ON public.user_render_settings;
CREATE TRIGGER trigger_user_render_settings_updated_at
    BEFORE UPDATE ON public.user_render_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_user_render_settings_updated_at();
