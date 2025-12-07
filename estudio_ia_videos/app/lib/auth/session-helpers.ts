/**
 * Session Helpers
 * Utilitários para validação de sessões
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';

export interface SessionUser {
  id: string;
  email?: string;
  name?: string;
  role?: string;
}

export async function validateSession(): Promise<{ user: SessionUser } | { error: NextResponse }> {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return {
      error: NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    };
  }

  const userId = (session.user as { id?: string }).id;
  if (!userId) {
    return {
      error: NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      )
    };
  }

  return {
    user: {
      id: userId,
      email: (session.user as { email?: string }).email,
      name: (session.user as { name?: string }).name,
      role: (session.user as { role?: string }).role
    }
  };
}

export function isErrorResponse(result: { user: SessionUser } | { error: NextResponse }): result is { error: NextResponse } {
  return 'error' in result;
}

/**
 * Re-export from centralized utils to maintain backward compatibility
 */
export { getOrgId, isAdmin, getUserId } from './utils';

