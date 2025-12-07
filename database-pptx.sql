-- Create pptx_uploads table
CREATE TABLE IF NOT EXISTS public.pptx_uploads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    original_filename TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    slide_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create pptx_slides table
CREATE TABLE IF NOT EXISTS public.pptx_slides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    upload_id UUID REFERENCES public.pptx_uploads(id) ON DELETE CASCADE,
    slide_number INTEGER NOT NULL,
    title TEXT,
    content TEXT,
    duration INTEGER DEFAULT 5,
    transition_type VARCHAR(50) DEFAULT 'none',
    thumbnail_url TEXT,
    notes TEXT,
    properties JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create project_history table
CREATE TABLE IF NOT EXISTS public.project_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    description TEXT,
    changes JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.pptx_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pptx_slides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_history ENABLE ROW LEVEL SECURITY;

-- Policies for pptx_uploads
CREATE POLICY "Users can view uploads of their projects"
    ON public.pptx_uploads FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE projects.id = pptx_uploads.project_id
            AND projects.user_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM public.project_collaborators
            WHERE project_collaborators.project_id = pptx_uploads.project_id
            AND project_collaborators.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert uploads for their projects"
    ON public.pptx_uploads FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE projects.id = pptx_uploads.project_id
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update uploads of their projects"
    ON public.pptx_uploads FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE projects.id = pptx_uploads.project_id
            AND projects.user_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM public.project_collaborators
            WHERE project_collaborators.project_id = pptx_uploads.project_id
            AND project_collaborators.user_id = auth.uid()
            AND project_collaborators.role IN ('editor', 'owner')
        )
    );

CREATE POLICY "Users can delete uploads of their projects"
    ON public.pptx_uploads FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE projects.id = pptx_uploads.project_id
            AND projects.user_id = auth.uid()
        )
    );

-- Policies for pptx_slides
CREATE POLICY "Users can view slides of their projects"
    ON public.pptx_slides FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.pptx_uploads
            JOIN public.projects ON projects.id = pptx_uploads.project_id
            WHERE pptx_uploads.id = pptx_slides.upload_id
            AND (projects.user_id = auth.uid() OR EXISTS (
                SELECT 1 FROM public.project_collaborators
                WHERE project_collaborators.project_id = projects.id
                AND project_collaborators.user_id = auth.uid()
            ))
        )
    );

CREATE POLICY "Users can update slides of their projects"
    ON public.pptx_slides FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.pptx_uploads
            JOIN public.projects ON projects.id = pptx_uploads.project_id
            WHERE pptx_uploads.id = pptx_slides.upload_id
            AND (projects.user_id = auth.uid() OR EXISTS (
                SELECT 1 FROM public.project_collaborators
                WHERE project_collaborators.project_id = projects.id
                AND project_collaborators.user_id = auth.uid()
                AND project_collaborators.role IN ('editor', 'owner')
            ))
        )
    );

CREATE POLICY "Users can delete slides of their projects"
    ON public.pptx_slides FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.pptx_uploads
            JOIN public.projects ON projects.id = pptx_uploads.project_id
            WHERE pptx_uploads.id = pptx_slides.upload_id
            AND projects.user_id = auth.uid()
        )
    );

-- Policies for project_history
CREATE POLICY "Users can view history of their projects"
    ON public.project_history FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE projects.id = project_history.project_id
            AND projects.user_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM public.project_collaborators
            WHERE project_collaborators.project_id = project_history.project_id
            AND project_collaborators.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert history for their projects"
    ON public.project_history FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE projects.id = project_history.project_id
            AND (projects.user_id = auth.uid() OR EXISTS (
                SELECT 1 FROM public.project_collaborators
                WHERE project_collaborators.project_id = projects.id
                AND project_collaborators.user_id = auth.uid()
            ))
        )
    );
