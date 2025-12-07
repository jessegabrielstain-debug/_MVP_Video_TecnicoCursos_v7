/**
 * API para testar render engine
 * GET/POST /api/render-test
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Render Test API - GET working!',
    endpoint: '/api/render-test',
    methods: ['GET', 'POST'],
    timestamp: new Date().toISOString(),
    status: 'operational'
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { project_id, preset_id, content } = body;

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
      message: 'Video render job created successfully',
      endpoint: '/api/render-test (POST)',
      created_at: new Date().toISOString(),
      estimated_completion: new Date(Date.now() + 60000).toISOString() // +1 minute
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
