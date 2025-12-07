/**
 * API de Logout
 */

import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/lib/auth/auth-service';
import { AuthMiddleware } from '@/lib/auth/auth-middleware';

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
    console.log(`User logged out at ${new Date().toISOString()}`);

    return response;

  } catch (error) {
    console.error('Logout error:', error);
    
    // Mesmo com erro, limpar cookies
    const response = NextResponse.json({
      success: true,
      message: 'Logout realizado'
    });

    AuthMiddleware.clearAuthCookies(response);
    return response;
  }
}
