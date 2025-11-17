import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/services';

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
  } catch (error: any) {
    console.error('Erro ao testar conexão com Supabase:', error);
    
    return NextResponse.json({
      status: 'error',
      message: 'Falha na conexão com Supabase',
      error: error.message
    }, { status: 500 });
  }
}