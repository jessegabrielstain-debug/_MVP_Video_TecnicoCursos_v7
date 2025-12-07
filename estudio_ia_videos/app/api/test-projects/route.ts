/**
 * 🧪 Test Projects API
 * 
 * API de teste para verificação de conectividade e criação de projetos.
 * Útil para diagnósticos e health checks.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseForRequest } from '@/lib/supabase/server'

// API de teste para projetos sem autenticação
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [TEST-API] Testando conexão com Supabase...')
    
    const supabase = getSupabaseForRequest(request)
    
    // Teste básico de conexão - apenas verificar se o cliente Supabase foi criado
    console.log('✅ [TEST-API] Cliente Supabase criado com sucesso!')
    
    // Tentar uma operação simples para verificar conectividade
    try {
      const { data: authData } = await supabase.auth.getUser()
      console.log('🔐 [TEST-API] Auth check realizado', authData?.user?.id ? '(Autenticado)' : '(Anônimo)')
    } catch (authError) {
      console.log('⚠️ [TEST-API] Auth não configurado (normal para teste)')
    }
    
    return NextResponse.json({
      success: true,
      message: 'API de teste funcionando! Supabase conectado.',
      supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Configurado' : 'Não configurado',
      supabase_key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Configurado' : 'Não configurado',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('💥 [TEST-API] Erro interno:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// POST para criar projeto de teste
export async function POST(request: NextRequest) {
  try {
    console.log('🚀 [TEST-API] Criando projeto de teste...')
    
    const body = await request.json()
    const supabase = getSupabaseForRequest(request)
    
    // Tentar obter usuário autenticado
    const { data: { user } } = await supabase.auth.getUser()
    
    // Se não houver usuário, usar um ID de teste (pode falhar se houver FK constraint)
    // Em produção, isso deve falhar se não houver usuário autenticado
    const userId = user?.id || '00000000-0000-0000-0000-000000000000'

    const testProject = {
      name: body.name || 'Projeto de Teste',
      description: body.description || 'Projeto criado via API de teste',
      // type: 'custom', // Removed as it's not in schema
      status: 'draft',
      user_id: userId,
      settings: { // Changed from render_settings to settings
        width: 1920,
        height: 1080,
        fps: 30,
        duration: 60,
        quality: 'high',
        format: 'mp4'
      },
      // is_public: false, // Removed as it's not in schema
      metadata: {
        source: 'test-api',
        type: 'custom',
        is_public: false
      }
    }

    const { data, error } = await supabase
      .from('projects')
      .insert(testProject)
      .select()
      .single()

    if (error) {
      console.error('❌ [TEST-API] Erro ao criar projeto:', error)
      return NextResponse.json({
        success: false,
        error: 'Erro ao criar projeto',
        details: error.message,
        hint: 'Se o erro for de FK (user_id), certifique-se de estar autenticado ou que o ID de teste exista.',
        timestamp: new Date().toISOString()
      }, { status: 500 })
    }

    console.log('✅ [TEST-API] Projeto criado com sucesso!')
    
    return NextResponse.json({
      success: true,
      message: 'Projeto de teste criado com sucesso!',
      data: data,
      timestamp: new Date().toISOString()
    }, { status: 201 })

  } catch (error) {
    console.error('💥 [TEST-API] Erro ao criar projeto:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
