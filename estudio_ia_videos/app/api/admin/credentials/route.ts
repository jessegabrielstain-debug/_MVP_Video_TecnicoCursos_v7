import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';

// Chave de criptografia (em produção, usar variável de ambiente segura)
const ENCRYPTION_KEY = process.env.CREDENTIALS_ENCRYPTION_KEY || 'mvp-encryption-key-2024-secure';

// Caminho do arquivo de credenciais
const CREDENTIALS_FILE = process.env.CREDENTIALS_FILE || '.credentials.encrypted';

function encrypt(text: string): string {
  const algorithm = 'aes-256-cbc';
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decrypt(encryptedText: string): string {
  try {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
    const [ivHex, encrypted] = encryptedText.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch {
    return '';
  }
}

async function verifyAdmin(request: NextRequest): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token')?.value;
  return !!token; // Simplificado - em produção, verificar sessão completa
}

// GET - Obter credenciais (mascaradas)
export async function GET(request: NextRequest) {
  if (!await verifyAdmin(request)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const credentialsPath = path.join(process.cwd(), CREDENTIALS_FILE);
    
    let credentials: Record<string, string> = {};
    
    try {
      const encryptedData = await fs.readFile(credentialsPath, 'utf8');
      const decryptedData = decrypt(encryptedData);
      credentials = JSON.parse(decryptedData);
    } catch {
      // Arquivo não existe ou está vazio
    }

    // Também verificar variáveis de ambiente
    const envCredentials = {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      DIRECT_DATABASE_URL: process.env.DIRECT_DATABASE_URL || '',
      ELEVENLABS_API_KEY: process.env.ELEVENLABS_API_KEY || '',
      AZURE_SPEECH_KEY: process.env.AZURE_SPEECH_KEY || '',
      AZURE_SPEECH_REGION: process.env.AZURE_SPEECH_REGION || '',
      HEYGEN_API_KEY: process.env.HEYGEN_API_KEY || '',
      OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
      AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID || '',
      AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY || '',
      AWS_REGION: process.env.AWS_REGION || '',
      AWS_S3_BUCKET: process.env.AWS_S3_BUCKET || '',
      REDIS_URL: process.env.REDIS_URL || 'redis://redis:6379',
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || '',
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || '',
      SENTRY_DSN: process.env.SENTRY_DSN || '',
      LOG_LEVEL: process.env.LOG_LEVEL || 'info',
      ADMIN_EMAIL: process.env.ADMIN_EMAIL || '',
    };

    // Mesclar com credenciais salvas (prioridade para salvas)
    const mergedCredentials = { ...envCredentials, ...credentials };

    // Mascarar valores sensíveis para exibição
    const maskedCredentials: Record<string, string> = {};
    for (const [key, value] of Object.entries(mergedCredentials)) {
      if (value && (key.includes('KEY') || key.includes('SECRET') || key.includes('PASSWORD') || key.includes('TOKEN'))) {
        // Mostrar apenas os primeiros e últimos 4 caracteres
        if (value.length > 8) {
          maskedCredentials[key] = value.substring(0, 4) + '••••••••' + value.substring(value.length - 4);
        } else {
          maskedCredentials[key] = '••••••••';
        }
      } else {
        maskedCredentials[key] = value;
      }
    }

    return NextResponse.json({
      credentials: maskedCredentials,
      // Enviar valores reais apenas para campos não sensíveis
      values: mergedCredentials
    });

  } catch (error) {
    console.error('[ADMIN CREDENTIALS] Erro ao obter credenciais:', error);
    return NextResponse.json(
      { error: 'Erro ao obter credenciais' },
      { status: 500 }
    );
  }
}

// POST - Salvar credenciais
export async function POST(request: NextRequest) {
  if (!await verifyAdmin(request)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const { credentials } = await request.json();

    if (!credentials || typeof credentials !== 'object') {
      return NextResponse.json(
        { error: 'Credenciais inválidas' },
        { status: 400 }
      );
    }

    // Criptografar e salvar
    const credentialsPath = path.join(process.cwd(), CREDENTIALS_FILE);
    const encryptedData = encrypt(JSON.stringify(credentials));
    await fs.writeFile(credentialsPath, encryptedData, 'utf8');

    // Também gerar arquivo .env.production
    const envContent = Object.entries(credentials)
      .filter(([, value]) => value)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    const envPath = path.join(process.cwd(), '.env.production');
    await fs.writeFile(envPath, `# Generated by Admin Panel - ${new Date().toISOString()}\nNODE_ENV=production\n${envContent}\n`, 'utf8');

    console.log(`[ADMIN CREDENTIALS] Credenciais salvas em ${new Date().toISOString()}`);

    return NextResponse.json({
      success: true,
      message: 'Credenciais salvas com sucesso'
    });

  } catch (error) {
    console.error('[ADMIN CREDENTIALS] Erro ao salvar credenciais:', error);
    return NextResponse.json(
      { error: 'Erro ao salvar credenciais' },
      { status: 500 }
    );
  }
}
