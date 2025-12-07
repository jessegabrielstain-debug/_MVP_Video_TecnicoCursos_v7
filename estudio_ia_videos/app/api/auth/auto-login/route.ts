import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * API Route: Login Automático para Desenvolvimento
 * 
 * ⚠️ APENAS PARA DESENVOLVIMENTO - NUNCA USE EM PRODUÇÃO!
 * 
 * Uso: GET /api/auth/auto-login?role=admin
 * Roles disponíveis: admin, editor, viewer
 */

const TEST_CREDENTIALS = {
  admin: {
    email: 'admin@mvpvideo.test',
    password: 'senha123'
  },
  editor: {
    email: 'editor@mvpvideo.test', 
    password: 'senha123'
  },
  viewer: {
    email: 'viewer@mvpvideo.test',
    password: 'senha123'
  }
} as const;

type Role = keyof typeof TEST_CREDENTIALS;

export async function GET(request: NextRequest) {
  // Bloquear em produção
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Esta rota está desabilitada em produção' },
      { status: 403 }
    );
  }

  const role = request.nextUrl.searchParams.get('role') as Role;
  
  if (!role || !TEST_CREDENTIALS[role]) {
    return NextResponse.json(
      { 
        error: 'Role inválido', 
        validRoles: Object.keys(TEST_CREDENTIALS),
        usage: '/api/auth/auto-login?role=admin'
      },
      { status: 400 }
    );
  }

  const credentials = TEST_CREDENTIALS[role];
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        }
      }
    }
  );

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password
    });

    if (error) {
      return NextResponse.json(
        { 
          error: 'Falha no login', 
          details: error.message,
          hint: 'Certifique-se de que os usuários de teste foram criados no banco. Execute: npm run setup:supabase'
        },
        { status: 401 }
      );
    }

    // Redirecionar para o dashboard após login
    const redirectUrl = new URL('/dashboard', request.url);
    return NextResponse.redirect(redirectUrl);

  } catch (err) {
    console.error('Auto-login error:', err);
    return NextResponse.json(
      { error: 'Erro interno no auto-login' },
      { status: 500 }
    );
  }
}
