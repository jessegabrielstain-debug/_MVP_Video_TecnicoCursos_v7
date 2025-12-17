/**
 * API de Login
 */

import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/lib/auth/auth-service';
import { AuthMiddleware } from '@/lib/auth/auth-middleware';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const { email, password, rememberMe } = await request.json();

    // Validação básica
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios' },
        { status: 400 }
      );
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Formato de email inválido' },
        { status: 400 }
      );
    }

    // Realizar login
    const tokens = await authService.login(email.toLowerCase(), password, request);

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

    // Definir cookies de autenticação
    AuthMiddleware.setAuthCookies(response, tokens.accessToken, tokens.refreshToken);

    // Log de segurança
    logger.info(`Login successful for user: ${email}`, { component: 'API: auth/login' });

    return response;

  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error)); logger.error('Login error', err, { component: 'API: auth/login' });
    
    const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor';
    
    // Log de tentativa de login falhada
    const { email } = await request.json().catch(() => ({}));
    if (email) {
      logger.warn(`Failed login attempt for: ${email}`, { component: 'API: auth/login' });
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 401 }
    );
  }
}

// Endpoint para verificar status de login
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { authenticated: false },
        { status: 401 }
      );
    }

    const user = await authService.getUserFromToken(token);
    
    if (!user) {
      return NextResponse.json(
        { authenticated: false },
        { status: 401 }
      );
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        role: user.role,
        permissions: user.permissions,
        preferences: user.preferences
      }
    });

  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error)); logger.error('Auth check error', err, { component: 'API: auth/login' });
    return NextResponse.json(
      { authenticated: false },
      { status: 401 }
    );
  }
}
