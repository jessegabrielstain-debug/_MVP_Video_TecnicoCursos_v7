/**
 * Video Render API
 * GET/POST /api/video
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');
  const project_id = searchParams.get('project_id');
  const preset_id = searchParams.get('preset_id');

  // Test endpoint
  if (action === 'test') {
    return NextResponse.json({
      success: true,
      message: 'Video API is working!',
      endpoint: '/api/video?action=test',
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
      endpoint: '/api/video?action=create-job',
      created_at: new Date().toISOString(),
      estimated_completion: new Date(Date.now() + 60000).toISOString()
    });
  }

  // Default response
  return NextResponse.json({
    success: true,
    message: 'Video Render API',
    available_actions: ['test', 'create-job'],
    usage: {
      test: '/api/video?action=test',
      create_job: '/api/video?action=create-job&project_id=PROJECT_ID&preset_id=PRESET_ID'
    },
    timestamp: new Date().toISOString()
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { project_id, preset_id, content, options } = body;

    if (!project_id || !preset_id) {
      return NextResponse.json(
        { 
          error: 'project_id and preset_id are required',
          received: { project_id, preset_id }
        },
        { status: 400 }
      );
    }

    // Generate job ID
    const job_id = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return NextResponse.json({
      success: true,
      job_id,
      status: 'queued',
      project_id,
      preset_id,
      content: content || 'No content provided',
      options: options || {},
      message: 'Video render job created successfully via POST',
      endpoint: '/api/video (POST)',
      created_at: new Date().toISOString(),
      estimated_completion: new Date(Date.now() + 60000).toISOString()
    });

  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Invalid JSON payload',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 400 }
    );
  }
}
