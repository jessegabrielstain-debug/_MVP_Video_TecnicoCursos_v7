/**
 * Hybrid Cloud Rendering API
 * Handles proxy generation and server-side high-quality rendering
 */

import { NextRequest, NextResponse } from 'next/server';
import { CloudRenderingOrchestrator } from '@/lib/hybrid-rendering/cloud-orchestrator';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

// Initialize orchestrator
const orchestrator = new CloudRenderingOrchestrator(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  process.env.REDIS_URL || 'redis://localhost:6379'
);

// Start worker on module load
orchestrator.startWorker().catch(error => {
  logger.error(`[HybridRenderAPI] Failed to start worker: ${error}`);
});

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const {
      projectId,
      timeline,
      assets,
      settings = {}
    } = body;

    // Validate required fields
    if (!projectId || !timeline || !assets) {
      return NextResponse.json(
        { error: 'Missing required fields: projectId, timeline, assets' },
        { status: 400 }
      );
    }

    // Generate unique job ID
    const jobId = `hybrid_${Date.now()}_${user.id.substring(0, 8)}`;

    // Create hybrid render job
    const job = {
      id: jobId,
      projectId,
      userId: user.id,
      timeline,
      settings: {
        proxyResolution: settings.proxyResolution || '720p',
        finalResolution: settings.finalResolution || '1080p',
        enableSmartFlow: settings.enableSmartFlow || false,
        quality: settings.quality || 'production'
      },
      assets: {
        original: assets.original || []
      },
      status: 'pending' as const,
      progress: 0,
      createdAt: new Date()
    };

    logger.info(`[HybridRenderAPI] Starting hybrid render job ${jobId} for user ${user.id}`);

    // Store job in database
    const { error: dbError } = await supabase
      .from('render_jobs')
      .insert({
        id: jobId,
        project_id: projectId,
        user_id: user.id,
        status: 'pending',
        progress: 0,
        settings: job.settings,
        created_at: job.createdAt.toISOString(),
        updated_at: job.createdAt.toISOString()
      });

    if (dbError) {
      logger.error(`[HybridRenderAPI] Database error: ${dbError}`);
      return NextResponse.json(
        { error: 'Failed to create render job' },
        { status: 500 }
      );
    }

    // Start hybrid rendering process
    const result = await orchestrator.startHybridRender(job);

    return NextResponse.json({
      success: true,
      jobId,
      message: 'Hybrid render job started successfully',
      status: 'proxy_generation_started',
      estimatedTime: {
        proxyGeneration: '2-5 minutes',
        serverRender: '5-15 minutes'
      }
    });

  } catch (error) {
    logger.error(`[HybridRenderAPI] Error: ${error}`);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');

    if (!jobId) {
      // Get all jobs for user
      const { data: jobs, error } = await supabase
        .from('render_jobs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        logger.error(`[HybridRenderAPI] Database error: ${error}`);
        return NextResponse.json(
          { error: 'Failed to fetch jobs' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        jobs: jobs || []
      });
    }

    // Get specific job
    const { data: job, error } = await supabase
      .from('render_jobs')
      .select('*')
      .eq('id', jobId)
      .eq('user_id', user.id)
      .single();

    if (error || !job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      job
    });

  } catch (error) {
    logger.error(`[HybridRenderAPI] Error: ${error}`);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('[HybridRenderAPI] Shutting down worker...');
  await orchestrator.stopWorker();
});

process.on('SIGINT', async () => {
  logger.info('[HybridRenderAPI] Shutting down worker...');
  await orchestrator.stopWorker();
});