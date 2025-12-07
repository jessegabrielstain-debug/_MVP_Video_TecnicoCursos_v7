/**
 * GET/POST /api/video-pipeline
 * Video pipeline endpoint for render engine
 */

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseForRequest } from "@/lib/supabase/server"
import { v4 as uuidv4 } from 'uuid';

export async function GET(req: NextRequest) {
  return NextResponse.json({
    success: true,
    message: "Video pipeline endpoint working!",
    endpoint: "/api/video-pipeline",
    methods: ["GET", "POST"],
    timestamp: new Date().toISOString(),
    status: "operational"
  });
}

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
    const { project_id, preset_id } = body;

    if (!project_id) {
      return NextResponse.json(
        { error: "project_id is required" },
        { status: 400 }
      );
    }

    // 2. Create Render Job in DB
    // Note: RLS policies should ensure user can only create jobs for their own projects
    // but we can also verify project ownership here if needed.
    
    const jobId = uuidv4();
    const { data: job, error: dbError } = await supabase
      .from('render_jobs')
      .insert({
        id: jobId,
        project_id: project_id,
        user_id: user.id,
        status: 'queued',
        progress: 0,
        settings: { preset_id: preset_id || 'default' }
      })
      .select()
      .single();

    if (dbError) {
      console.error("Error creating render job:", dbError);
      return NextResponse.json(
        { error: "Failed to create render job", details: dbError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      job_id: job.id,
      status: job.status,
      project_id: job.project_id,
      message: "Video pipeline render job created successfully",
      created_at: job.created_at
    });

  } catch (error) {
    console.error("Pipeline error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
