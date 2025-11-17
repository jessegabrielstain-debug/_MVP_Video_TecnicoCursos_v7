-- Migração idempotente: adicionar attempts e duration_ms
DO $$
BEGIN
  ALTER TABLE public.render_jobs ADD COLUMN IF NOT EXISTS attempts INTEGER DEFAULT 1;
  ALTER TABLE public.render_jobs ADD COLUMN IF NOT EXISTS duration_ms INTEGER;
EXCEPTION WHEN others THEN
  NULL;
END $$;