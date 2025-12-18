import { NextResponse } from 'next/server'
import { getSupabaseForRequest } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'
import { getMetricsSnapshot } from '@/lib/utils/metrics'

export async function GET(req: Request) {
  try {
    const supabase = getSupabaseForRequest(req)
    const { data: userData, error: userErr } = await supabase.auth.getUser()
    if (userErr || !userData?.user) {
      return NextResponse.json({ code: 'UNAUTHORIZED', message: 'Usuário não autenticado' }, { status: 401 })
    }

    // A função is_admin() deve ser definida no seu banco de dados Supabase.
    const { data: isAdminData, error: isAdminError } = await supabase.rpc('is_admin');
    
    if (isAdminError || !isAdminData) {
        return NextResponse.json({ code: 'FORBIDDEN', message: 'Acesso negado. Recurso disponível apenas para administradores.' }, { status: 403 });
    }

    const snapshot = getMetricsSnapshot()
    return NextResponse.json(snapshot, { 
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })
  } catch (err) {
    // Não registrar erro de métrica na própria métrica para evitar loop
    return NextResponse.json({ code: 'UNEXPECTED', message: 'Erro ao obter métricas', details: (err as Error).message }, { status: 500 })
  }
}

