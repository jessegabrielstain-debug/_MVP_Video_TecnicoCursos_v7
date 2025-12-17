import { NextRequest, NextResponse } from "next/server"
import { getSupabaseForRequest } from "@/lib/supabase/server"
import { v4 as uuidv4 } from 'uuid';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseForRequest(req);
    
    // 1. Authenticate User
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { scenes, projectId, quality } = body;

    if (!projectId) {
      return NextResponse.json(
        { error: "projectId is required" },
        { status: 400 }
      );
    }

    // 2. Create Render Job in DB
    const jobId = uuidv4();
    const { data: job, error: dbError } = await supabase
      .from('render_jobs')
      .insert({
        id: jobId,
        project_id: projectId,
        user_id: user.id,
        status: 'queued',
        progress: 0,
        render_settings: { 
            quality: quality || 'fhd',
            scenes_count: scenes?.length || 0
        }
      })
      .select()
      .single();

    if (dbError) {
      logger.error("Error creating render job", new Error(dbError.message || JSON.stringify(dbError)) 
      , { component: 'API: videos/render' });
      return NextResponse.json(
        { error: "Failed to create render job", details: dbError.message },
        { status: 500 }
      );
    }

    // 3. Return response in the format expected by the frontend
    return NextResponse.json({
      success: true,
      jobId: job.id, // Frontend expects camelCase 'jobId'
      status: job.status,
      progress: job.progress,
      estimatedTime: (scenes?.length || 1) * 10000, // Mock estimation
      message: "Render job created successfully"
    });

  } catch (error) {
    logger.error("Render API error", error instanceof Error ? error : new Error(String(error)) 
    , { component: 'API: videos/render' });
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
