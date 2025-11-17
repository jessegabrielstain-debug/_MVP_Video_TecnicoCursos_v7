import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/lib/supabase/types'

const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/auth/callback',
  '/auth/reset-password',
  '/auth/change-password',
  '/api/health'
]

const PUBLIC_PREFIXES = [
  '/auth/confirm',
  '/auth/verify',
  '/docs',
  '/public',
  '/api/v1/video-jobs'
]

const ADMIN_ROUTES = ['/admin', '/dashboard/admin']
const ADMIN_PREFIXES = ['/api/admin', '/api/analytics/admin']

const SECURITY_HEADERS: Record<string, string> = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin'
}

const applySecurityHeaders = (response: NextResponse) => {
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
  return response
}

const isRouteInList = (pathname: string, routes: string[]) =>
  routes.some((route) => pathname === route || pathname.startsWith(`${route}/`))

const isRouteWithPrefix = (pathname: string, prefixes: string[]) =>
  prefixes.some((prefix) => pathname.startsWith(prefix))

const shouldBypassAuth = (pathname: string) => {
  if (PUBLIC_ROUTES.includes(pathname)) return true
  if (isRouteWithPrefix(pathname, PUBLIC_PREFIXES)) return true
  if (pathname.startsWith('/api/public')) return true
  if (/\.(ico|svg|png|jpg|jpeg|gif|webp|css|js|map)$/.test(pathname)) return true
  return false
}

const isAdminRoute = (pathname: string) =>
  isRouteInList(pathname, ADMIN_ROUTES) || isRouteWithPrefix(pathname, ADMIN_PREFIXES)

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: new Headers(request.headers)
    }
  })

  applySecurityHeaders(response)

  const { pathname } = request.nextUrl

  if (shouldBypassAuth(pathname)) {
    return response
  }

  const supabase = createMiddlewareClient<Database>({ req: request, res: response })

  const {
    data: { session },
    error
  } = await supabase.auth.getSession()

  if (error) {
    console.error('Erro ao recuperar sessão Supabase no middleware:', error)
  }

  if (!session) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('reason', 'unauthorized')
    const redirectTarget = `${pathname}${request.nextUrl.search}`
    loginUrl.searchParams.set('redirect', redirectTarget)

    const redirectResponse = NextResponse.redirect(loginUrl)
    return applySecurityHeaders(redirectResponse)
  }

  if (isAdminRoute(pathname)) {
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', session.user.id)
      .maybeSingle()

    if (profileError) {
      console.error('Erro ao verificar perfil admin no middleware:', profileError)
    }

    if (profile?.role !== 'admin') {
      const dashboardUrl = new URL('/dashboard', request.url)
      dashboardUrl.searchParams.set('reason', 'forbidden')
      const redirectResponse = NextResponse.redirect(dashboardUrl)
      return applySecurityHeaders(redirectResponse)
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.webmanifest).*)'
  ]
}
