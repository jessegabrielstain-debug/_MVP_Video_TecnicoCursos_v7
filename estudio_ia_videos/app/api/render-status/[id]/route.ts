import { NextRequest, NextResponse } from "next/server"
import { getSupabaseForRequest } from "@/lib/supabase/server"
import { logger } from "@/lib/logger"

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabaseForRequest(req);
    const jobId = params.id;

    // 1. Authenticate User (Optional for status check? Maybe yes for security)
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 2. Fetch Job
    const { data: job, error: dbError } = await supabase
      .from('render_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (dbError) {
      return NextResponse.json(
        { error: "Job not found", details: dbError.message },
        { status: 404 }
      );
    }

    // 3. Return status
    return NextResponse.json({
      success: true,
      job: {
        id: job.id,
        status: job.status,
        progress: job.progress,
        outputUrl: job.output_url,
        error: job.error_message
      }
    });

  } catch (error) {
    logger.error("Render Status API error", error instanceof Error ? error : new Error(String(error)), { component: 'API: render-status/[id]' });
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
