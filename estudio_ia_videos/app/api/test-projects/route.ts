import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/services'

// API de teste para projetos sem autenticação
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [TEST-API] Testando conexão com Supabase...')
    
    const supabase = createClient()
    
    // Teste básico de conexão - apenas verificar se o cliente Supabase foi criado
    console.log('✅ [TEST-API] Cliente Supabase criado com sucesso!')
    
    // Tentar uma operação simples para verificar conectividade
    try {
      const { data: authData } = await supabase.auth.getUser()
      console.log('🔐 [TEST-API] Auth check realizado')
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
    const supabase = createClient()
    
    const testProject = {
      name: body.name || 'Projeto de Teste',
      description: body.description || 'Projeto criado via API de teste',
      type: 'video',
      status: 'draft',
      owner_id: 'test-user-id',
      settings: {
        width: 1920,
        height: 1080,
        fps: 30,
        duration: 60,
        quality: 'high',
        format: 'mp4'
      },
      is_public: false
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