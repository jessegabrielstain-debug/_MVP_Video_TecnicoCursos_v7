/**
 * API de Refresh Token
 */

import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/lib/auth/auth-service';
import { AuthMiddleware } from '@/lib/auth/auth-middleware';

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get('refresh-token')?.value;
    
    if (!refreshToken) {
      return NextResponse.json(
        { error: 'Refresh token não encontrado' },
        { status: 401 }
      );
    }

    // Renovar tokens
    const tokens = await authService.refreshTokens(refreshToken);

    // Preparar resposta
    const response = NextResponse.json({
      success: true,
      user: {
        id: tokens.user.id,
        email: tokens.user.email,
        name: tokens.user.name,
        avatar: tokens.user.avatar,
        role: tokens.user.role,
        permissions: tokens.user.permissions,
        preferences: tokens.user.preferences
      },
      expiresAt: tokens.expiresAt
    });

    // Atualizar cookies com novos tokens
    AuthMiddleware.setAuthCookies(response, tokens.accessToken, tokens.refreshToken);

    return response;

  } catch (error) {
    console.error('Refresh token error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Token de refresh inválido';
    
    // Limpar cookies inválidos
    const response = NextResponse.json(
      { error: errorMessage },
      { status: 401 }
    );

    AuthMiddleware.clearAuthCookies(response);
    return response;
  }
}
