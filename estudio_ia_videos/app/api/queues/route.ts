import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: {
        headers: {
          Authorization: authHeader
        }
      }
    });
    
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verificar se é admin
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role:roles(name)')
      .eq('user_id', user.id)
      .single();

    if (!userRole || (userRole.role as any).name !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Obter estatísticas da tabela render_jobs
    const { count: waiting } = await supabase.from('render_jobs').select('*', { count: 'exact', head: true }).eq('status', 'queued');
    const { count: active } = await supabase.from('render_jobs').select('*', { count: 'exact', head: true }).eq('status', 'processing');
    const { count: completed } = await supabase.from('render_jobs').select('*', { count: 'exact', head: true }).eq('status', 'completed');
    const { count: failed } = await supabase.from('render_jobs').select('*', { count: 'exact', head: true }).eq('status', 'failed');
    
    // Obter jobs recentes
    const { data: recentJobs } = await supabase
      .from('render_jobs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    const waitingJobs = recentJobs?.filter(j => j.status === 'queued') || [];
    const activeJobs = recentJobs?.filter(j => j.status === 'processing') || [];
    const completedJobs = recentJobs?.filter(j => j.status === 'completed') || [];
    const failedJobs = recentJobs?.filter(j => j.status === 'failed') || [];

    return NextResponse.json({
      stats: {
        waiting: waiting || 0,
        active: active || 0,
        completed: completed || 0,
        failed: failed || 0,
        delayed: 0,
        total: (waiting || 0) + (active || 0) + (completed || 0) + (failed || 0),
      },
      jobs: {
        waiting: waitingJobs.map(formatDbJob),
        active: activeJobs.map(formatDbJob),
        completed: completedJobs.map(formatDbJob),
        failed: failedJobs.map(formatDbJob),
      },
    });
  } catch (error) {
    console.error('Error fetching queue data:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

function formatDbJob(job: any) {
  return {
    id: job.id,
    name: 'render-video',
    data: { projectId: job.project_id, userId: job.user_id },
    progress: job.progress,
    attemptsMade: job.attempts || 0,
    timestamp: new Date(job.created_at).getTime(),
    processedOn: job.started_at ? new Date(job.started_at).getTime() : undefined,
    finishedOn: job.completed_at ? new Date(job.completed_at).getTime() : undefined,
    failedReason: job.error_message,
  };
}

