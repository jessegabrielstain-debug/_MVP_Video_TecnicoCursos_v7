
-- Force fix projects user_id constraint
ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_user_id_fkey;

-- Check if user_profiles exists and if we should migrate data (optional, skipping for now as we want to use public.users)
-- We assume public.users is the source of truth as per database-schema.sql

ALTER TABLE public.projects 
    ADD CONSTRAINT projects_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
