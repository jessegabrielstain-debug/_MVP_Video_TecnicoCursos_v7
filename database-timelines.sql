-- Create timelines table
CREATE TABLE IF NOT EXISTS public.timelines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    tracks JSONB DEFAULT '[]'::jsonb,
    settings JSONB DEFAULT '{}'::jsonb,
    total_duration INTEGER DEFAULT 0,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(project_id)
);

-- Enable RLS
ALTER TABLE public.timelines ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view timelines of their projects"
    ON public.timelines FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE projects.id = timelines.project_id
            AND projects.user_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM public.project_collaborators
            WHERE project_collaborators.project_id = timelines.project_id
            AND project_collaborators.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert timelines for their projects"
    ON public.timelines FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE projects.id = timelines.project_id
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update timelines of their projects"
    ON public.timelines FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE projects.id = timelines.project_id
            AND projects.user_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM public.project_collaborators
            WHERE project_collaborators.project_id = timelines.project_id
            AND project_collaborators.user_id = auth.uid()
            AND project_collaborators.role IN ('editor', 'owner')
        )
    );

CREATE POLICY "Users can delete timelines of their projects"
    ON public.timelines FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE projects.id = timelines.project_id
            AND projects.user_id = auth.uid()
        )
    );
