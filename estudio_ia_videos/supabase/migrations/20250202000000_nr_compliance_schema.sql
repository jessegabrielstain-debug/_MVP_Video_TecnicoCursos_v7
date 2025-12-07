CREATE TABLE IF NOT EXISTS public.nr_compliance_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    nr TEXT NOT NULL,
    nr_name TEXT NOT NULL,
    status TEXT NOT NULL,
    score DOUBLE PRECISION NOT NULL,
    final_score DOUBLE PRECISION NOT NULL,
    requirements_met INTEGER NOT NULL,
    requirements_total INTEGER NOT NULL,
    validated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    validated_by UUID NOT NULL,
    recommendations JSONB,
    critical_points JSONB,
    ai_analysis JSONB,
    ai_score DOUBLE PRECISION,
    confidence DOUBLE PRECISION,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_nr_compliance_records_project_id ON public.nr_compliance_records(project_id);
