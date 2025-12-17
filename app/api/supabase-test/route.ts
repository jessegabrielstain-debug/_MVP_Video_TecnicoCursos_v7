import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/services';
import { logger } from '@/lib/logger';

// Rota para testar a conexão com o Supabase
export async function GET() {
  try {
    const supabase = createServerSupabaseClient();
    
    // Teste de conexão básica
    const { data, error } = await supabase.from('users').select('count(*)');
    
    if (error) {
      throw error;
    }
    
    return NextResponse.json({
      status: 'success',
      message: 'Conexão com Supabase estabelecida com sucesso',
      data
    });
  } catch (error: unknown) {
    logger.error('Erro ao testar conexão com Supabase', error instanceof Error ? error : new Error(String(error)), { component: 'SupabaseTestRoute' });
    
    return NextResponse.json({
      status: 'error',
      message: 'Falha na conexão com Supabase',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}