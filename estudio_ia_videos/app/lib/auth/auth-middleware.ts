/**
 * Auth Middleware
 * Middleware de autenticação para rotas API
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string;
    email: string;
    organizationId?: string;
    isAdmin?: boolean;
  };
}

export async function withAuth(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>,
  options?: { requireAdmin?: boolean }
): Promise<(req: NextRequest) => Promise<NextResponse>> {
  return async (req: NextRequest) => {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    if (options?.requireAdmin && !(session.user as { isAdmin?: boolean }).isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }
    
    const authenticatedReq = req as AuthenticatedRequest;
    authenticatedReq.user = session.user as AuthenticatedRequest['user'];
    
    return handler(authenticatedReq);
  };
}

export class AuthMiddleware {
  static setAuthCookies(response: NextResponse, accessToken: string, refreshToken: string) {
    response.cookies.set('auth-token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 // 1 hour
    });
    
    response.cookies.set('refresh-token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    });
  }

  static clearAuthCookies(response: NextResponse) {
    response.cookies.delete('auth-token');
    response.cookies.delete('refresh-token');
  }
}
