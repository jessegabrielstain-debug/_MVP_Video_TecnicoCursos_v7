import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/services'

// API para configurar o banco de dados
export async function POST(request: NextRequest) {
  try {
    console.log('🚀 [SETUP-DB] Iniciando configuração do banco de dados...')
    
    const supabase = createClient()
    
    // Verificar se as tabelas já existem
    const { data: existingTables, error: checkError } = await supabase
      .rpc('check_table_exists', { table_name: 'projects' })
    
    if (checkError) {
      console.log('⚠️ [SETUP-DB] Não foi possível verificar tabelas existentes, prosseguindo...')
    }

    // Criar tabela de projetos
    const createProjectsTable = `
      CREATE TABLE IF NOT EXISTS public.projects (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          type VARCHAR(50) DEFAULT 'video',
          status VARCHAR(50) DEFAULT 'draft',
          owner_id VARCHAR(255) NOT NULL,
          settings JSONB DEFAULT '{}',
          is_public BOOLEAN DEFAULT false,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `

    const { error: createError } = await supabase.rpc('exec_sql', { 
      sql: createProjectsTable 
    })

    if (createError) {
      console.error('❌ [SETUP-DB] Erro ao criar tabela projects:', createError)
      
      // Tentar abordagem alternativa - inserir dados de teste diretamente
      const testProject = {
        name: 'Projeto de Teste',
        description: 'Projeto criado durante setup do banco',
        type: 'video',
        status: 'draft',
        owner_id: 'test-user-setup',
        settings: {
          width: 1920,
          height: 1080,
          fps: 30
        },
        is_public: false
      }

      // Tentar inserir dados de teste para verificar se a tabela existe
      const { data: insertData, error: insertError } = await supabase
        .from('projects')
        .insert(testProject)
        .select()

      if (insertError) {
        return NextResponse.json({
          success: false,
          error: 'Tabela projects não existe e não foi possível criar',
          details: insertError.message,
          suggestion: 'Execute o SQL manualmente no Supabase Dashboard',
          timestamp: new Date().toISOString()
        }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: 'Tabela projects já existe! Dados de teste inseridos.',
        data: insertData,
        timestamp: new Date().toISOString()
      })
    }

    console.log('✅ [SETUP-DB] Banco de dados configurado com sucesso!')
    
    return NextResponse.json({
      success: true,
      message: 'Banco de dados configurado com sucesso!',
      tables_created: ['projects'],
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('💥 [SETUP-DB] Erro interno:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// GET para verificar status do banco
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [SETUP-DB] Verificando status do banco de dados...')
    
    const supabase = createClient()
    
    // Tentar acessar a tabela projects
    const { data, error } = await supabase
      .from('projects')
      .select('id, name, created_at')
      .limit(5)

    if (error) {
      return NextResponse.json({
        success: false,
        database_ready: false,
        error: 'Tabela projects não encontrada',
        details: error.message,
        suggestion: 'Execute POST /api/setup-database para configurar',
        timestamp: new Date().toISOString()
      })
    }

    return NextResponse.json({
      success: true,
      database_ready: true,
      message: 'Banco de dados configurado e funcionando!',
      projects_count: data?.length || 0,
      sample_projects: data,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('💥 [SETUP-DB] Erro ao verificar banco:', error)
    return NextResponse.json({
      success: false,
      database_ready: false,
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}