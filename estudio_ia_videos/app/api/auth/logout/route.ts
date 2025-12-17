/**
 * API de Logout
 */

import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/lib/auth/auth-service';
import { AuthMiddleware } from '@/lib/auth/auth-middleware';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    
    if (token) {
      // Invalidar token (em produção, adicionar à blacklist)
      await authService.logout(token);
    }

    // Preparar resposta
    const response = NextResponse.json({
      success: true,
      message: 'Logout realizado com sucesso'
    });

    // Limpar cookies de autenticação
    AuthMiddleware.clearAuthCookies(response);

    // Log de segurança
    logger.info('User logged out', { component: 'API: auth/logout', timestamp: new Date().toISOString() });

    return response;

  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error)); logger.error('Logout error', err, { component: 'API: auth/logout' });
    
    // Mesmo com erro, limpar cookies
    const response = NextResponse.json({
      success: true,
      message: 'Logout realizado'
    });

    AuthMiddleware.clearAuthCookies(response);
    return response;
  }
}
