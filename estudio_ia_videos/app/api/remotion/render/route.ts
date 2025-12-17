/**
 * 🎬 API Remotion Render
 * Endpoint para renderização de vídeos usando Remotion
 */

import { NextRequest, NextResponse } from 'next/server';
// Use dynamic imports inside handlers to avoid build-time bundling issues
// with Remotion's esbuild dependencies.
import { VideoCompositionProps } from '@/lib/types/remotion-types';
import path from 'path';
import fs from 'fs';
import { logger } from '@/lib/logger';

interface RenderRequest {
  compositionId: string;
  props: VideoCompositionProps;
  outputPath?: string;
  quality?: number;
  codec?: 'h264' | 'h265' | 'vp8' | 'vp9';
}

export async function POST(request: NextRequest) {
  try {
    const body: RenderRequest = await request.json();
    
    if (!body.compositionId || !body.props) {
      return NextResponse.json(
        { error: 'Missing required fields: compositionId, props' },
        { status: 400 }
      );
    }

    logger.info(`🎬 Starting Remotion render: ${body.compositionId}`, { component: 'API: remotion/render' })

    // 1. Bundle the Remotion project (dynamic import)
    const { bundle } = await import('@remotion/bundler');
    const bundleLocation = await bundle({
      entryPoint: path.resolve('./remotion/Root.tsx'),
      webpackOverride: (config) => config,
    });

    logger.info(`📦 Bundle created at: ${bundleLocation}`, { component: 'API: remotion/render' })

    // 2. Get composition details (dynamic import)
    const { selectComposition, renderMedia } = await import('@remotion/renderer');
    const composition = await selectComposition({
      serveUrl: bundleLocation,
      id: body.compositionId,
      inputProps: body.props,
    });

    logger.info('🎯 Composition selected', { component: 'API: remotion/render', composition })

    // 3. Generate output path
    const outputDir = path.resolve('./public/renders');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const timestamp = Date.now();
    const outputPath = body.outputPath || 
      path.join(outputDir, `render-${body.compositionId}-${timestamp}.mp4`);

    // 4. Render the video
    logger.info(`🎬 Starting render to: ${outputPath}`, { component: 'API: remotion/render' })
    
    const renderResult = await renderMedia({
      composition,
      serveUrl: bundleLocation,
      codec: body.codec || 'h264',
      outputLocation: outputPath,
      inputProps: body.props,
      // quality is deprecated in newer versions, using crf instead
      ...(body.quality ? { crf: body.quality } : {}),
      onProgress: ({ progress }) => {
        logger.info(`🎬 Render progress: ${Math.round(progress * 100)}%`, { component: 'API: remotion/render' })
      },
      onStart: () => {
        logger.info('🎬 Render started', { component: 'API: remotion/render' })
      },
      onDownload: (src) => {
        logger.info(`📥 Downloaded: ${src}`, { component: 'API: remotion/render' })
      },
    });

    logger.info('✅ Render completed', { component: 'API: remotion/render', renderResult })

    // 5. Return the result
    const publicPath = outputPath.replace(path.resolve('./public'), '');
    
    return NextResponse.json({
      success: true,
      outputPath: publicPath,
      composition: {
        id: composition.id,
        width: composition.width,
        height: composition.height,
        fps: composition.fps,
        durationInFrames: composition.durationInFrames,
      },
      renderTime: Date.now() - timestamp,
      fileSize: fs.existsSync(outputPath) ? fs.statSync(outputPath).size : 0,
    });

  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error)); logger.error('Remotion render error', err, { component: 'API: remotion/render' });
    
    return NextResponse.json(
      { 
        error: 'Render failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const compositionId = searchParams.get('compositionId');

    if (!compositionId) {
      return NextResponse.json(
        { error: 'Missing compositionId parameter' },
        { status: 400 }
      );
    }

    // Bundle and get composition info (dynamic import)
    const { bundle } = await import('@remotion/bundler');
    const bundleLocation = await bundle({
      entryPoint: path.resolve('./remotion/Root.tsx'),
      webpackOverride: (config) => config,
    });

    const { selectComposition } = await import('@remotion/renderer');
    const composition = await selectComposition({
      serveUrl: bundleLocation,
      id: compositionId,
    });

    return NextResponse.json({
      composition: {
        id: composition.id,
        width: composition.width,
        height: composition.height,
        fps: composition.fps,
        durationInFrames: composition.durationInFrames,
        defaultProps: composition.defaultProps,
      }
    });

  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error)); logger.error('Get composition error', err, { component: 'API: remotion/render' });
    
    return NextResponse.json(
      { 
        error: 'Failed to get composition',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
