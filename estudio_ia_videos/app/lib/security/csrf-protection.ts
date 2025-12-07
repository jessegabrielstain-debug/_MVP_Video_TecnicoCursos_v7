/**
 * CSRF Protection
 * Proteção contra Cross-Site Request Forgery
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const tokens = new Map<string, { token: string; expiresAt: number }>();

export class CSRFProtection {
  generateToken(sessionId: string): string {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + 3600000; // 1 hora
    
    tokens.set(sessionId, { token, expiresAt });
    
    return token;
  }
  
  validateToken(sessionId: string, token: string): boolean {
    const stored = tokens.get(sessionId);
    
    if (!stored) return false;
    if (Date.now() > stored.expiresAt) {
      tokens.delete(sessionId);
      return false;
    }
    
    return stored.token === token;
  }
  
  clearToken(sessionId: string): void {
    tokens.delete(sessionId);
  }
}

export const csrfProtection = new CSRFProtection();

export const generateCsrfToken = (sessionId: string) => csrfProtection.generateToken(sessionId);

export function withCSRF(
  handler: (req: NextRequest) => Promise<NextResponse>
): (req: NextRequest) => Promise<NextResponse> {
  return async (req: NextRequest) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      const token = req.headers.get('x-csrf-token');
      const sessionId = req.cookies.get('session-id')?.value;
      
      if (!sessionId || !token || !csrfProtection.validateToken(sessionId, token)) {
        return NextResponse.json(
          { error: 'Invalid CSRF token' },
          { status: 403 }
        );
      }
    }
    
    return handler(req);
  };
}
