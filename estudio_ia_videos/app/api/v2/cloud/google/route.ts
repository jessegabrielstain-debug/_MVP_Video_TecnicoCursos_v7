/**
 * API v2: Google Cloud Integration
 * Endpoints para Google Cloud Storage e Video Intelligence
 */

import { NextResponse } from 'next/server';
import { googleCloudIntegration } from '@/lib/cloud/google-cloud-integration';
import { logger } from '@/lib/logger';
import { getSupabaseForRequest } from '@/lib/services';

export const runtime = 'nodejs';

// POST /api/v2/cloud/google - Operações Google Cloud
export async function POST(req: Request) {
  try {
    const supabase = getSupabaseForRequest(req);
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { action, ...options } = body;

    let result;

    switch (action) {
      case 'upload':
        result = await googleCloudIntegration.uploadToGCS(options);
        break;
      case 'download':
        result = await googleCloudIntegration.downloadFromGCS(options.fileName);
        break;
      case 'delete':
        result = await googleCloudIntegration.deleteFromGCS(options.fileName);
        break;
      case 'analyze':
        result = await googleCloudIntegration.analyzeVideo(options);
        break;
      case 'signedUrl':
        result = await googleCloudIntegration.getSignedUrl(options.fileName, options.expiresIn);
        break;
      case 'list':
        result = await googleCloudIntegration.listFiles(options.prefix);
        break;
      default:
        return NextResponse.json(
          {
            success: false,
            error: `Unknown action: ${action}`
          },
          { status: 400 }
        );
    }

    if (!result.success) {
      return NextResponse.json(result, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (error) {
    logger.error('Google Cloud API error', error instanceof Error ? error : new Error(String(error)), {
      component: 'API: /api/v2/cloud/google'
    });
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error'
      },
      { status: 500 }
    );
  }
}
