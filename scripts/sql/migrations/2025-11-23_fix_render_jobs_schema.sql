ALTER TABLE public.render_jobs DROP CONSTRAINT IF EXISTS render_jobs_status_check;
ALTER TABLE public.render_jobs ADD CONSTRAINT render_jobs_status_check 
    CHECK (status IN ('pending', 'queued', 'processing', 'completed', 'failed', 'cancelled'));

ALTER TABLE public.render_jobs DROP CONSTRAINT IF EXISTS render_jobs_user_id_fkey;
ALTER TABLE public.render_jobs ADD CONSTRAINT render_jobs_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
