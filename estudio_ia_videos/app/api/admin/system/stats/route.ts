import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

async function verifyAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token')?.value;
  return !!token;
}

export async function GET(request: NextRequest) {
  if (!await verifyAdmin()) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  // Calcular uptime
  const uptimeSeconds = process.uptime();
  const days = Math.floor(uptimeSeconds / 86400);
  const hours = Math.floor((uptimeSeconds % 86400) / 3600);
  const minutes = Math.floor((uptimeSeconds % 3600) / 60);
  
  let uptime = '';
  if (days > 0) uptime += `${days}d `;
  if (hours > 0) uptime += `${hours}h `;
  uptime += `${minutes}m`;

  // Em produção, buscar dados reais do banco
  const stats = {
    totalUsers: 0,
    totalProjects: 0,
    apiCalls24h: 0,
    storageUsed: '0 MB',
    uptime: uptime.trim(),
    nodeVersion: process.version,
    memoryUsage: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`,
    cpuUsage: '0%',
  };

  // Tentar buscar dados reais do Supabase
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (supabaseUrl && supabaseKey) {
      // Buscar contagem de usuários
      const usersRes = await fetch(`${supabaseUrl}/rest/v1/profiles?select=count`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Prefer': 'count=exact'
        }
      });
      
      if (usersRes.ok) {
        const countHeader = usersRes.headers.get('content-range');
        if (countHeader) {
          const match = countHeader.match(/\/(\d+)/);
          if (match) {
            stats.totalUsers = parseInt(match[1], 10);
          }
        }
      }

      // Buscar contagem de projetos
      const projectsRes = await fetch(`${supabaseUrl}/rest/v1/projects?select=count`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Prefer': 'count=exact'
        }
      });
      
      if (projectsRes.ok) {
        const countHeader = projectsRes.headers.get('content-range');
        if (countHeader) {
          const match = countHeader.match(/\/(\d+)/);
          if (match) {
            stats.totalProjects = parseInt(match[1], 10);
          }
        }
      }
    }
  } catch (error) {
    console.error('[ADMIN STATS] Erro ao buscar estatísticas:', error);
  }

  return NextResponse.json(stats);
}
