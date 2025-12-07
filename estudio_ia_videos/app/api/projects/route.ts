import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabaseForRequest } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

// Schema de validação para projetos
const ProjectSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(255, 'Nome muito longo'),
  description: z.string().optional(),
  type: z.enum(['pptx', 'template-nr', 'talking-photo', 'custom', 'ai-generated']).default('custom'),
  metadata: z.object({
    priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
    tags: z.array(z.string()).optional(),
    category: z.string().optional()
  }).optional(),
  settings: z.object({
    width: z.number().default(1920),
    height: z.number().default(1080),
    fps: z.number().default(30),
    duration: z.number().optional(),
    quality: z.enum(['low', 'medium', 'high']).default('high'),
    format: z.enum(['mp4', 'mov', 'avi']).default('mp4')
  }).optional()
})

// GET - Listar projetos do usuário
export async function GET(request: NextRequest) {
  try {
    // Extract token from header
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization')
    
    let supabase;
    let user;
    let authError;

    if (authHeader) {
        // Create a clean client and set session manually
        supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                auth: {
                    persistSession: false,
                    autoRefreshToken: false
                }
            }
        );
        const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader.startsWith('bearer ') ? authHeader.substring(7) : authHeader;
        
        const { error: sessionError } = await supabase.auth.setSession({
            access_token: token,
            refresh_token: 'dummy'
        });
        
        if (sessionError) {
            console.error('DEBUG: setSession error:', sessionError);
            return NextResponse.json({ 
                error: 'Unauthorized',
                debug_error: 'Session set failed',
                debug_details: sessionError
            }, { status: 401 })
        }
        
        const result = await supabase.auth.getUser();
        user = result.data.user;
        authError = result.error;
    } else {
        // Fallback to existing logic (cookie based?)
        supabase = getSupabaseForRequest(request);
        const result = await supabase.auth.getUser();
        user = result.data.user;
        authError = result.error;
    }
    
    if (authError) {
        console.error('Projects API Auth Error:', authError);
    }

    if (!user) {
      return NextResponse.json({ 
        error: 'Unauthorized',
      }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const search = searchParams.get('search')

    let query = supabase
      .from('projects')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })

    // Filtros
    if (status) {
      query = query.eq('status', status)
    }
    
    if (type && ['pptx', 'template-nr', 'talking-photo', 'custom', 'ai-generated'].includes(type)) {
      query = query.eq('type', type as 'pptx' | 'template-nr' | 'talking-photo' | 'custom' | 'ai-generated')
    }
    
    if (search) {
      query = query.ilike('name', `%${search}%`)
    }

    // Paginação
    const from = (page - 1) * limit
    const to = from + limit - 1
    
    const { data: projects, count, error } = await query.range(from, to)

    if (error) throw error

    const response = {
      success: true,
      data: projects,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      },
      filters: {
        status,
        type,
        search
      },
      timestamp: new Date().toISOString()
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('💥 [PROJECTS-API] Erro ao listar projetos:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// POST - Criar novo projeto
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseForRequest(request)
    
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization')
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : authHeader?.startsWith('bearer ') ? authHeader.substring(7) : null
    
    if (token) {
        await supabase.auth.setSession({
            access_token: token,
            refresh_token: 'dummy'
        })
    }

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const body = await request.json()
    
    // Validação dos dados
    const validationResult = ProjectSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json({
        success: false,
        error: 'Dados inválidos',
        details: validationResult.error.errors,
        timestamp: new Date().toISOString()
      }, { status: 400 })
    }

    const validatedData = validationResult.data

    // Criar novo projeto
    const { data: newProject, error } = await supabase
      .from('projects')
      .insert({
        name: validatedData.name,
        description: validatedData.description || '',
        type: validatedData.type,
        status: 'draft',
        user_id: user.id,
        metadata: validatedData.metadata || {},
        // render_settings: validatedData.settings || {},
        is_public: false
      })
      .select('id, name, type, status')
      .single()

    if (error) {
      console.error('Error creating project:', error)
      // Attempt to extract detailed message
      const errorMessage = error.message || 'Erro ao criar projeto'
      return NextResponse.json({ 
        success: false, 
        error: errorMessage,
        details: error
      }, { status: 400 })
    }
    
    return NextResponse.json({
      success: true,
      message: 'Projeto criado com sucesso!',
      data: newProject,
      timestamp: new Date().toISOString()
    }, { status: 201 })

  } catch (error) {
    console.error('💥 [PROJECTS-API] Erro ao criar projeto:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
