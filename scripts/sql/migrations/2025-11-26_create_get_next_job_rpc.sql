CREATE OR REPLACE FUNCTION public.get_next_render_job()
RETURNS TABLE (
    id UUID,
    project_id UUID,
    user_id UUID,
    status VARCHAR,
    render_settings JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    job_record RECORD;
BEGIN
    -- Find and lock the next job
    SELECT * INTO job_record
    FROM public.render_jobs
    WHERE status = 'queued'
    ORDER BY created_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED;

    IF FOUND THEN
        -- Update status to processing
        UPDATE public.render_jobs
        SET status = 'processing',
            started_at = NOW(),
            updated_at = NOW()
        WHERE public.render_jobs.id = job_record.id;

        -- Return the job details
        RETURN QUERY SELECT 
            job_record.id, 
            job_record.project_id, 
            job_record.user_id, 
            'processing'::VARCHAR as status,
            job_record.render_settings;
    END IF;
END;
$$;
