/**
 * API v2: Azure Integration
 * Endpoints para Azure Media Services e Blob Storage
 */

import { NextResponse } from 'next/server';
import { azureIntegration } from '@/lib/cloud/azure-integration';
import { logger } from '@/lib/logger';
import { getSupabaseForRequest } from '@/lib/services';

export const runtime = 'nodejs';

// POST /api/v2/cloud/azure - Upload ou criar transform
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
        result = await azureIntegration.uploadToBlob(options);
        break;
      case 'download':
        result = await azureIntegration.downloadFromBlob(options.blobName);
        break;
      case 'transform':
        result = await azureIntegration.createTransformJob(options);
        break;
      case 'analyze':
        result = await azureIntegration.analyzeVideo(options.videoUrl);
        break;
      case 'streaming':
        result = await azureIntegration.getStreamingUrl(options.assetName, options.locatorName);
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
    logger.error('Azure API error', error instanceof Error ? error : new Error(String(error)), {
      component: 'API: /api/v2/cloud/azure'
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
