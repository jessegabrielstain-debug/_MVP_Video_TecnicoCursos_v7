
/**
 * 🛡️ Next.js Middleware - Security & Route Management Layer
 * 
 * Aplica security headers, CORS e redirecionamento de rotas
 * 
 * NOTA: Rate limiting é aplicado em nível de API route, não no middleware,
 * devido às limitações do Edge Runtime (não suporta ioredis/node modules)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSecurityHeaders } from '@/lib/security/security-headers'
import { getCorsHeaders, isValidOrigin } from '@/lib/security/security-headers'

// 🔄 ROUTE REDIRECTS
const ROUTE_REDIRECTS = {
  // Fix /app/api/* to /api/*
  '/app/api/render/start': '/api/render/start',
  '/app/api/render/video-working': '/api/render/video-working',
  '/app/api/render/simple-test': '/api/render/simple-test',
  '/app/api/render/test-simple': '/api/render/test-simple',
  '/app/api/render/pipeline-test': '/api/render/pipeline-test',
  '/app/api/render/video-test': '/api/render/video-test',
  '/app/api/render/status': '/api/render/status',
  '/app/api/health': '/api/health',
  '/app/api/video': '/api/video',
  '/app/api/video-pipeline': '/api/video-pipeline',

  // Legacy API redirects
  '/api/render/video-working': '/api/render/status',
  '/api/render/simple-test': '/api/render/test-simple',

  // Health check aliases
  '/health': '/api/health',
  '/status': '/api/health',
  '/ping': '/api/health',

  // PPTX Module Consolidation - 17 módulos → 1 consolidado
  '/app/pptx-upload': '/app/pptx-studio?tab=upload',
  '/app/pptx-upload-production': '/app/pptx-studio?tab=upload',
  '/app/pptx-upload-production-test': '/app/pptx-studio?tab=upload',
  '/app/pptx-upload-engine': '/app/pptx-studio?tab=upload',
  '/app/pptx-upload-real': '/app/pptx-studio?tab=upload',
  '/app/pptx-upload-animaker': '/app/pptx-studio?tab=upload',
  '/app/pptx-editor': '/app/pptx-studio?tab=editor',
  '/app/pptx-editor-real': '/app/pptx-studio?tab=editor',
  '/app/pptx-editor-animaker': '/app/pptx-studio?tab=editor',
  '/app/pptx-production': '/app/pptx-studio?tab=production',
  '/app/pptx-production-demo': '/app/pptx-studio?tab=production',
  '/app/pptx-studio-clean': '/app/pptx-studio?tab=studio',
  '/app/pptx-studio-enhanced': '/app/pptx-studio?tab=studio',
  '/app/pptx-test': '/app/pptx-studio?tab=test',
  '/app/pptx-animaker-clone': '/app/pptx-studio?tab=animaker',
  '/app/pptx-demo': '/app/pptx-studio?tab=demo',
  '/app/pptx-enhanced-system-demo': '/app/pptx-studio?tab=demo',

  // Avatar Module Consolidation - 18 módulos → 1 consolidado
  '/app/talking-photo': '/app/avatar-studio?tab=talking-photo',
  '/app/talking-photo-pro': '/app/avatar-studio?tab=talking-photo',
  '/app/talking-photo-realistic': '/app/avatar-studio?tab=talking-photo',
  '/app/talking-photo-vidnoz': '/app/avatar-studio?tab=talking-photo',
  '/app/avatar-system-real': '/app/avatar-studio?tab=system',
  '/app/avatar-3d-demo': '/app/avatar-studio?tab=3d-demo',
  '/app/avatar-3d-hyper-real': '/app/avatar-studio?tab=3d-hyper-real',
  '/app/avatar-3d-studio': '/app/avatar-studio?tab=3d-studio',
  '/app/avatar-local-render': '/app/avatar-studio?tab=local-render',
  '/app/avatar-studio': '/app/avatar-studio?tab=studio',
  '/app/avatar-studio-hyperreal': '/app/avatar-studio?tab=hyperreal',
  '/app/avatar-studio-vidnoz': '/app/avatar-studio?tab=vidnoz',
  '/app/avatar-tts-studio': '/app/avatar-studio?tab=tts-studio',
  '/app/avatares-3d': '/app/avatar-studio?tab=3d',
  '/app/avatares-3d-demo': '/app/avatar-studio?tab=3d-demo',
  '/app/avatar-ue5-demo': '/app/avatar-studio?tab=ue5-demo',
  '/app/generate-avatar-images': '/app/avatar-studio?tab=generate',
  '/app/orchestrator-avatar': '/app/avatar-studio?tab=orchestrator',

  // Editor Module Consolidation - 15 módulos → 1 consolidado
  '/app/editor-timeline': '/app/editor?tab=timeline',
  '/app/editor-timeline-pro': '/app/editor?tab=timeline',
  '/app/editor-workflow': '/app/editor?tab=workflow',
  '/app/editor-animaker': '/app/editor?tab=animaker',
  '/app/canvas-editor-pro': '/app/editor?tab=canvas',
  '/app/canvas-editor-professional': '/app/editor?tab=canvas',
  '/app/canvas-editor-demo': '/app/editor?tab=canvas-demo',
  '/app/canvas-demo-new': '/app/editor?tab=canvas-demo',
  '/app/timeline-edit': '/app/editor?tab=timeline',
  '/app/timeline-editor-professional': '/app/editor?tab=timeline',
  '/app/timeline-keyframes-professional': '/app/editor?tab=keyframes',
  '/app/timeline-multi-track': '/app/editor?tab=multi-track',
  '/app/timeline-test': '/app/editor?tab=timeline-test',
  '/app/integrated-canvas-studio': '/app/editor?tab=integrated',
  '/app/canvas-editor-studio': '/app/editor?tab=studio',
} as const

// 🎯 ROUTE PATTERNS
const ROUTE_PATTERNS = [
  {
    pattern: /^\/app\/api\/(.+)$/,
    replacement: '/api/$1',
  },
  {
    pattern: /^\/api\/render\/video-working(.*)$/,
    replacement: '/api/render/status$1',
  },
  {
    pattern: /^\/api\/render\/simple-test(.*)$/,
    replacement: '/api/render/test-simple$1',
  }
]

/**
 * Middleware principal
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const origin = request.headers.get('origin')
  
  // 1. Check for route redirects first
  if (pathname in ROUTE_REDIRECTS) {
    const newPath = ROUTE_REDIRECTS[pathname as keyof typeof ROUTE_REDIRECTS]
    console.log(`🔄 Route Redirect: ${request.method} ${pathname} -> ${newPath}`)
    
    const url = request.nextUrl.clone()
    url.pathname = newPath
    
    return NextResponse.redirect(url, 301)
  }

  // Check pattern matches
  for (const { pattern, replacement } of ROUTE_PATTERNS) {
    if (pattern.test(pathname)) {
      const newPath = pathname.replace(pattern, replacement)
      console.log(`🔄 Route Pattern Redirect: ${request.method} ${pathname} -> ${newPath}`)
      
      const url = request.nextUrl.clone()
      url.pathname = newPath
      
      return NextResponse.redirect(url, 301)
    }
  }
  
  // 2. Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: getCorsHeaders(origin),
    })
  }
  
  // 3. Apply security headers to all responses
  const response = NextResponse.next()
  
  // Security headers
  const securityHeaders = getSecurityHeaders(process.env.NODE_ENV !== 'production')
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
  
  // CORS headers if valid origin
  if (isValidOrigin(origin)) {
    const corsHeaders = getCorsHeaders(origin)
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value)
    })
  }
  
  return response
}

/**
 * Configuração do middleware
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}
