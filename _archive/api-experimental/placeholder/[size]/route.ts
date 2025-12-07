
import { NextRequest, NextResponse } from 'next/server'

/**
 * 🖼️ EMERGENCY PLACEHOLDER API - Gera placeholders para imagens quebradas
 */

export async function GET(
  request: NextRequest,
  { params }: { params: { size: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const text = searchParams.get('text') || 'Placeholder'
    const [width, height] = params.size.split('x').map(Number)
    
    if (!width || !height) {
      return new NextResponse('Invalid size format. Use WxH (e.g., 300x200)', { status: 400 })
    }

    // Generate SVG placeholder
    const svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f3f4f6"/>
        <rect x="10" y="10" width="${width-20}" height="${height-20}" fill="none" stroke="#d1d5db" stroke-width="2" stroke-dasharray="5,5"/>
        <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${Math.min(width, height) * 0.08}" fill="#6b7280" text-anchor="middle" dominant-baseline="middle">
          ${text}
        </text>
        <text x="50%" y="${height * 0.75}" font-family="Arial, sans-serif" font-size="${Math.min(width, height) * 0.05}" fill="#9ca3af" text-anchor="middle" dominant-baseline="middle">
          ${width}×${height}
        </text>
      </svg>
    `

    return new NextResponse(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    })
    
  } catch (error) {
    return new NextResponse('Error generating placeholder', { status: 500 })
  }
}
