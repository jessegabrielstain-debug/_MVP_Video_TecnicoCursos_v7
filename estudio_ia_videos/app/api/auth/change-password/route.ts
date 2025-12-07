/**
 * API de Alteração de Senha
 */

import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/lib/auth/auth-service';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'Token de acesso obrigatório' },
        { status: 401 }
      );
    }

    const user = await authService.getUserFromToken(token);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    const { currentPassword, newPassword, confirmPassword } = await request.json();

    // Validações
    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { error: 'Todos os campos são obrigatórios' },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: 'Nova senha e confirmação não coincidem' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Nova senha deve ter pelo menos 6 caracteres' },
        { status: 400 }
      );
    }

    // Validar força da senha
    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasLowerCase = /[a-z]/.test(newPassword);
    const hasNumbers = /\d/.test(newPassword);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);

    if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
      return NextResponse.json(
        { error: 'Nova senha deve conter pelo menos uma letra maiúscula, uma minúscula e um número' },
        { status: 400 }
      );
    }

    // Alterar senha
    await authService.changePassword(user.id, currentPassword, newPassword);

    // Log de segurança
    console.log(`Password changed for user: ${user.email} at ${new Date().toISOString()}`);

    return NextResponse.json({
      success: true,
      message: 'Senha alterada com sucesso'
    });

  } catch (error) {
    console.error('Change password error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor';
    
    return NextResponse.json(
      { error: errorMessage },
      { status: errorMessage === 'Senha atual incorreta' ? 400 : 500 }
    );
  }
}
