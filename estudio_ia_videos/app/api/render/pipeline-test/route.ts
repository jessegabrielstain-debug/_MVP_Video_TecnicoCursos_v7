
/**
 * API para testar pipeline de render
 * GET/POST /api/render/pipeline-test
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      message: 'Pipeline Test API is working!',
      status: 'operational',
      timestamp: new Date().toISOString(),
      endpoint: '/api/render/pipeline-test'
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { project_id, preset_id } = body;

    if (!project_id || !preset_id) {
      return NextResponse.json(
        { error: 'project_id and preset_id are required' },
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
      message: 'Pipeline test job created successfully'
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid JSON payload' },
      { status: 400 }
    );
  }
}

