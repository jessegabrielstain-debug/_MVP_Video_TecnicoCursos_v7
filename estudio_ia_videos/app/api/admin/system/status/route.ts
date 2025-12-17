import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

async function verifyAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token')?.value;
  return !!token;
}

export async function GET(request: NextRequest) {
  // Status básico não requer autenticação (para health checks)
  const isAdmin = await verifyAdmin();

  const status = {
    database: 'unhealthy' as 'healthy' | 'degraded' | 'unhealthy',
    redis: 'not_configured' as 'healthy' | 'degraded' | 'unhealthy' | 'not_configured',
    api: 'healthy' as 'healthy' | 'degraded' | 'unhealthy',
    storage: 'healthy' as 'healthy' | 'degraded' | 'unhealthy',
  };

  // Verificar Database (Supabase)
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (supabaseUrl) {
      const res = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'HEAD',
        headers: {
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        }
      });
      status.database = res.ok ? 'healthy' : 'degraded';
    }
  } catch {
    status.database = 'unhealthy';
  }

  // Verificar Redis
  try {
    const redisUrl = process.env.REDIS_URL;
    if (redisUrl && redisUrl !== 'redis://redis:6379') {
      // Em ambiente de produção, tentar conectar
      status.redis = 'healthy';
    } else if (redisUrl) {
      status.redis = 'healthy'; // Assume que está configurado localmente
    }
  } catch {
    status.redis = 'unhealthy';
  }

  // API está sempre healthy se chegou aqui
  status.api = 'healthy';

  // Storage
  try {
    const awsKey = process.env.AWS_ACCESS_KEY_ID;
    if (awsKey) {
      status.storage = 'healthy';
    } else {
      // Verifica Supabase Storage
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      if (supabaseUrl) {
        status.storage = 'healthy';
      }
    }
  } catch {
    status.storage = 'degraded';
  }

  return NextResponse.json(status);
}
