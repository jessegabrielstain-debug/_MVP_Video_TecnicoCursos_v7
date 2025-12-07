-- Fix user references to point to public.users instead of auth.users to allow PostgREST expansions

-- 1. projects.user_id
ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_user_id_fkey;
ALTER TABLE public.projects ADD CONSTRAINT projects_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- 2. project_versions.created_by
ALTER TABLE public.project_versions DROP CONSTRAINT IF EXISTS project_versions_created_by_fkey;
ALTER TABLE public.project_versions ADD CONSTRAINT project_versions_created_by_fkey 
    FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE CASCADE;

-- 3. project_collaborators.user_id
ALTER TABLE public.project_collaborators DROP CONSTRAINT IF EXISTS project_collaborators_user_id_fkey;
ALTER TABLE public.project_collaborators ADD CONSTRAINT project_collaborators_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- 4. project_collaborators.invited_by
ALTER TABLE public.project_collaborators DROP CONSTRAINT IF EXISTS project_collaborators_invited_by_fkey;
ALTER TABLE public.project_collaborators ADD CONSTRAINT project_collaborators_invited_by_fkey 
    FOREIGN KEY (invited_by) REFERENCES public.users(id);

-- 5. project_analytics.user_id
ALTER TABLE public.project_analytics DROP CONSTRAINT IF EXISTS project_analytics_user_id_fkey;
ALTER TABLE public.project_analytics ADD CONSTRAINT project_analytics_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- 6. project_comments.user_id
ALTER TABLE public.project_comments DROP CONSTRAINT IF EXISTS project_comments_user_id_fkey;
ALTER TABLE public.project_comments ADD CONSTRAINT project_comments_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- 7. project_tags.created_by
ALTER TABLE public.project_tags DROP CONSTRAINT IF EXISTS project_tags_created_by_fkey;
ALTER TABLE public.project_tags ADD CONSTRAINT project_tags_created_by_fkey 
    FOREIGN KEY (created_by) REFERENCES public.users(id);
