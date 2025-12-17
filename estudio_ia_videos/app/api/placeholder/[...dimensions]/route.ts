/**
 * Placeholder Image API
 * 
 * Generates placeholder images dynamically.
 * Usage: /api/placeholder/300/200 → 300x200 gray placeholder
 *        /api/placeholder/400/300?color=4f46e5 → custom color
 */
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

interface RouteParams {
  params: Promise<{
    dimensions: string[];
  }>;
}

export async function GET(
  request: NextRequest,
  context: RouteParams
): Promise<NextResponse> {
  try {
    const { dimensions } = await context.params;
    
    // Parse dimensions: /api/placeholder/300/200
    const width = parseInt(dimensions[0] || '300', 10);
    const height = parseInt(dimensions[1] || '200', 10);

    // Validate dimensions
    if (isNaN(width) || isNaN(height) || width < 1 || height < 1 || width > 2000 || height > 2000) {
      return NextResponse.json(
        { error: 'Invalid dimensions. Width and height must be between 1 and 2000.' },
        { status: 400 }
      );
    }

    // Get optional color from query params
    const searchParams = request.nextUrl.searchParams;
    const bgColor = searchParams.get('color') || '6b7280'; // gray-500 default
    const textColor = searchParams.get('textColor') || 'ffffff';
    const text = searchParams.get('text') || `${width}×${height}`;

    // Generate SVG placeholder
    const svg = `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#${bgColor}"/>
  <text 
    x="50%" 
    y="50%" 
    font-family="system-ui, -apple-system, sans-serif" 
    font-size="${Math.min(width, height) / 8}px" 
    fill="#${textColor}" 
    text-anchor="middle" 
    dominant-baseline="middle"
  >${text}</text>
</svg>`.trim();

    return new NextResponse(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Placeholder error', err, { component: 'API: placeholder/[...dimensions]' });
    return NextResponse.json(
      { error: 'Failed to generate placeholder' },
      { status: 500 }
    );
  }
}
