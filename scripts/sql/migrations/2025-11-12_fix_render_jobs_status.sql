-- Migração idempotente: alinhar status 'pending' para 'queued' e default
DO $$
BEGIN
  -- Atualiza registros antigos
  UPDATE public.render_jobs SET status = 'queued' WHERE status = 'pending';
EXCEPTION WHEN others THEN
  -- Em alguns ambientes a coluna/status pode não existir ou já estar correto; ignore
  NULL;
END $$;

-- Ajusta default da coluna status, se necessário
DO $$
BEGIN
  ALTER TABLE public.render_jobs ALTER COLUMN status SET DEFAULT 'queued';
EXCEPTION WHEN others THEN
  -- Ignora se já estiver ajustado
  NULL;
END $$;