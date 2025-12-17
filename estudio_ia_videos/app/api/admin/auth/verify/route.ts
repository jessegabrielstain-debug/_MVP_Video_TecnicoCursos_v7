import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';

// Armazenamento de sessões (compartilhado com login - em produção usar Redis)
const sessions = new Map<string, { email: string; name: string; expiresAt: number }>();

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    const session = sessions.get(token);

    if (!session) {
      // Tentar verificar se é um token válido via header
      const authHeader = request.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        const bearerToken = authHeader.substring(7);
        const bearerSession = sessions.get(bearerToken);
        if (bearerSession && Date.now() <= bearerSession.expiresAt) {
          return NextResponse.json({
            authenticated: true,
            email: bearerSession.email,
            name: bearerSession.name
          });
        }
      }

      return NextResponse.json(
        { error: 'Sessão inválida' },
        { status: 401 }
      );
    }

    if (Date.now() > session.expiresAt) {
      sessions.delete(token);
      return NextResponse.json(
        { error: 'Sessão expirada' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      authenticated: true,
      email: session.email,
      name: session.name
    });

  } catch (error) {
    console.error('[ADMIN AUTH] Erro na verificação:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// Função helper para registrar sessão (chamada pelo login)
export function registerSession(token: string, email: string, name: string, expiresAt: number) {
  sessions.set(token, { email, name, expiresAt });
}
