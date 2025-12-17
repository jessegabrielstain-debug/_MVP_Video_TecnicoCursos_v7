import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';

// Configuração do admin (em produção, usar banco de dados)
const ADMIN_CONFIG = {
  email: process.env.ADMIN_EMAIL || 'admin@tecnicocursos.com',
  // Hash da senha padrão "Admin@123" - em produção, usar bcrypt
  passwordHash: process.env.ADMIN_PASSWORD_HASH || hashPassword(process.env.ADMIN_PASSWORD || 'Admin@123'),
  name: process.env.ADMIN_NAME || 'Administrador'
};

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + 'mvp-salt-2024').digest('hex');
}

function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Armazenamento de sessões em memória (em produção, usar Redis)
const sessions = new Map<string, { email: string; name: string; expiresAt: number }>();

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios' },
        { status: 400 }
      );
    }

    // Verificar credenciais
    const passwordHash = hashPassword(password);
    
    if (email !== ADMIN_CONFIG.email || passwordHash !== ADMIN_CONFIG.passwordHash) {
      // Log de tentativa de login falha (para auditoria)
      console.warn(`[ADMIN AUTH] Login falhou para: ${email} em ${new Date().toISOString()}`);
      
      return NextResponse.json(
        { error: 'Credenciais inválidas' },
        { status: 401 }
      );
    }

    // Gerar token de sessão
    const token = generateToken();
    const expiresAt = Date.now() + (24 * 60 * 60 * 1000); // 24 horas

    // Armazenar sessão
    sessions.set(token, {
      email: ADMIN_CONFIG.email,
      name: ADMIN_CONFIG.name,
      expiresAt
    });

    // Log de login bem-sucedido
    console.log(`[ADMIN AUTH] Login bem-sucedido: ${email} em ${new Date().toISOString()}`);

    // Criar resposta com cookie
    const response = NextResponse.json({
      success: true,
      message: 'Login realizado com sucesso',
      user: {
        email: ADMIN_CONFIG.email,
        name: ADMIN_CONFIG.name
      }
    });

    // Definir cookie httpOnly e secure
    const cookieStore = await cookies();
    cookieStore.set('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 horas
      path: '/'
    });

    return response;

  } catch (error) {
    console.error('[ADMIN AUTH] Erro no login:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// Exportar função para verificar sessão (usado por outras rotas)
export function verifySession(token: string): { email: string; name: string } | null {
  const session = sessions.get(token);
  
  if (!session) {
    return null;
  }

  if (Date.now() > session.expiresAt) {
    sessions.delete(token);
    return null;
  }

  return { email: session.email, name: session.name };
}

// Limpar sessões expiradas periodicamente
setInterval(() => {
  const now = Date.now();
  for (const [token, session] of sessions.entries()) {
    if (now > session.expiresAt) {
      sessions.delete(token);
    }
  }
}, 60 * 60 * 1000); // A cada hora
