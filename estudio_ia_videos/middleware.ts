import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from './app/lib/supabase/middleware'

// Simple in-memory rate limiter (per instance)
// In production with multiple instances, use Redis or a dedicated rate limiting service (e.g., Upstash)
const rateLimit = new Map<string, { count: number; lastReset: number }>();
const WINDOW_SIZE = 60 * 1000; // 1 minute
const MAX_REQUESTS = 100; // 100 requests per minute

// Flag to track if we've already logged the config error
let hasLoggedConfigError = false;

/**
 * Verifica se as variáveis de ambiente do Supabase estão configuradas
 */
function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && 
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

export async function middleware(request: NextRequest) {
  try {
    // Check if Supabase is configured before attempting to create client
    if (!isSupabaseConfigured()) {
      if (!hasLoggedConfigError) {
        console.warn(
          '\n⚠️  Supabase not configured - running in anonymous mode.\n' +
          '   Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local\n'
        )
        hasLoggedConfigError = true
      }
      // Allow the request to proceed without auth
      return NextResponse.next()
    }

    // 1. Initialize Supabase Client and refresh session
    // This uses @supabase/ssr to handle cookies correctly in the middleware context
    const { supabase, response } = createClient(request)

    // Refresh session if expired - required for Server Components
    // This updates the cookie if the session is refreshed
    const { data: { session } } = await supabase.auth.getSession()

    // 2. Rate Limiting for API routes
    if (request.nextUrl.pathname.startsWith('/api')) {
      const ip = request.ip || 'unknown';
      const now = Date.now();
      const record = rateLimit.get(ip) || { count: 0, lastReset: now };

      if (now - record.lastReset > WINDOW_SIZE) {
        record.count = 0;
        record.lastReset = now;
      }

      record.count++;
      rateLimit.set(ip, record);

      if (record.count > MAX_REQUESTS) {
        return new NextResponse(
          JSON.stringify({ success: false, message: 'Too many requests' }),
          { status: 429, headers: { 'content-type': 'application/json' } }
        );
      }
    }

    // 3. Auth Protection Logic
    const isAuthRoute = request.nextUrl.pathname.startsWith('/login') || 
                        request.nextUrl.pathname.startsWith('/register')
    
    // Protected routes requiring authentication
    const isProtectedRoute = request.nextUrl.pathname.startsWith('/dashboard') ||
                             request.nextUrl.pathname.startsWith('/editor') ||
                             request.nextUrl.pathname.startsWith('/projects')

    // If user is logged in and tries to access auth routes, redirect to dashboard
    if (session && isAuthRoute) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // If user is NOT logged in and tries to access protected routes, redirect to login
    if (!session && isProtectedRoute) {
      const redirectUrl = new URL('/login', request.url)
      // Preserve the intended destination
      redirectUrl.searchParams.set('redirect', request.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // 4. Add performance headers for API responses
    if (request.nextUrl.pathname.startsWith('/api')) {
      // Add cache headers for certain API endpoints
      const cacheableEndpoints = [
        '/api/nr/courses',
        '/api/nr/modules',
        '/api/templates',
      ];
      
      const isCacheable = cacheableEndpoints.some(ep => 
        request.nextUrl.pathname.startsWith(ep)
      );
      
      if (isCacheable && request.method === 'GET') {
        response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
      } else if (request.method === 'GET') {
        // Short cache for other GET endpoints
        response.headers.set('Cache-Control', 'private, max-age=0, must-revalidate');
      } else {
        // No cache for mutations
        response.headers.set('Cache-Control', 'no-store');
      }
      
      // Security headers
      response.headers.set('X-Content-Type-Options', 'nosniff');
      response.headers.set('X-Frame-Options', 'DENY');
      response.headers.set('X-XSS-Protection', '1; mode=block');
    }

    return response
  } catch (e) {
    // If middleware fails, log error and allow request to proceed (fail open)
    // This prevents the entire app from going down if Supabase is unreachable
    console.error('Middleware error:', e)
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
