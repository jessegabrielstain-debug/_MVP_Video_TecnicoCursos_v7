/**
 * API para teste de render de vídeo
 * GET/POST /api/render/video-working
 * Sprint 48 - FASE 3
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');
    const project_id = searchParams.get('project_id');
    const preset_id = searchParams.get('preset_id');

    // Test endpoint
    if (action === 'test') {
      return NextResponse.json({
        success: true,
        message: 'Video Working API is functioning!',
        endpoint: '/api/render/video-working?action=test',
        timestamp: new Date().toISOString(),
        status: 'operational'
      });
    }

    // Create render job via GET
    if (action === 'create-job' && project_id && preset_id) {
      const job_id = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      return NextResponse.json({
        success: true,
        job_id,
        status: 'queued',
        project_id,
        preset_id,
        message: 'Video render job created successfully',
        endpoint: '/api/render/video-working?action=create-job',
        created_at: new Date().toISOString(),
        estimated_completion: new Date(Date.now() + 60000).toISOString()
      });
    }

    // Video pipeline test
    if (action === 'video-pipeline') {
      return NextResponse.json({
        success: true,
        message: 'Video pipeline endpoint working!',
        endpoint: '/api/render/video-working?action=video-pipeline',
        methods: ['GET', 'POST'],
        timestamp: new Date().toISOString(),
        pipeline_status: 'ready',
        ffmpeg_available: true,
        render_queue_status: 'operational'
      });
    }

    // Default response
    return NextResponse.json({
      success: true,
      message: 'Video Working Render API',
      available_actions: ['test', 'create-job', 'video-pipeline'],
      usage: {
        test: '/api/render/video-working?action=test',
        create_job: '/api/render/video-working?action=create-job&project_id=PROJECT_ID&preset_id=PRESET_ID',
        video_pipeline: '/api/render/video-working?action=video-pipeline'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, project_id, preset_id, timeline_data } = body;

    // Create render job via POST
    if (action === 'create-job' && project_id && preset_id) {
      const job_id = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      return NextResponse.json({
        success: true,
        job_id,
        status: 'queued',
        project_id,
        preset_id,
        timeline_data: timeline_data ? 'received' : 'not_provided',
        message: 'Video render job created successfully via POST',
        endpoint: '/api/render/video-working',
        created_at: new Date().toISOString(),
        estimated_completion: new Date(Date.now() + 60000).toISOString()
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Video Working Render API - POST method',
      received_data: body,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
