import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// Schema de validação para criação/atualização de slide
const slideSchema = z.object({
  upload_id: z.string().uuid('ID do upload inválido'),
  slide_number: z.number().int().positive('Número do slide deve ser positivo'),
  title: z.string().min(1, 'Título é obrigatório').max(200, 'Título muito longo'),
  content: z.string().max(5000, 'Conteúdo muito longo'),
  duration: z.number().positive('Duração deve ser positiva').max(300, 'Duração máxima de 5 minutos'),
  transition_type: z.enum(['fade', 'slide', 'zoom', 'flip', 'none']).default('fade'),
  thumbnail_url: z.string().url().optional(),
  notes: z.string().max(2000, 'Notas muito longas').optional(),
  properties: z.record(z.any()).optional()
})

const updateSlideSchema = slideSchema.partial().omit(['upload_id'])

// GET - Listar slides de um upload
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const uploadId = searchParams.get('upload_id')
    const projectId = searchParams.get('project_id')

    if (!uploadId && !projectId) {
      return NextResponse.json(
        { error: 'ID do upload ou projeto é obrigatório' },
        { status: 400 }
      )
    }

    let query = supabase
      .from('pptx_slides')
      .select(`
        *,
        pptx_uploads:upload_id (
          id,
          project_id,
          original_filename,
          status
        )
      `)
      .order('slide_number', { ascending: true })

    if (uploadId) {
      query = query.eq('upload_id', uploadId)
    } else if (projectId) {
      query = query.eq('project_id', projectId)
    }

    const { data: slides, error } = await query

    if (error) {
      console.error('Erro ao buscar slides:', error)
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      )
    }

    // Verificar permissões para cada slide
    const authorizedSlides = []
    
    for (const slide of slides || []) {
      const upload = slide.pptx_uploads as Record<string, unknown>
      
      // Buscar projeto para verificar permissões
      const { data: project } = await supabase
        .from('projects')
        .select('owner_id, collaborators, is_public')
        .eq('id', String(upload.project_id))
        .single()

      if (project) {
        const hasPermission = project.owner_id === user.id || 
                             project.collaborators?.includes(user.id) ||
                             project.is_public

        if (hasPermission) {
          authorizedSlides.push(slide)
        }
      }
    }

    return NextResponse.json({ slides: authorizedSlides })

  } catch (error) {
    console.error('Erro na API de slides:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST - Criar novo slide
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = slideSchema.parse(body)

    // Verificar se upload existe e permissões
    const { data: upload } = await supabase
      .from('pptx_uploads')
      .select(`
        *,
        projects:project_id (
          owner_id,
          collaborators
        )
      `)
      .eq('id', validatedData.upload_id)
      .single()

    if (!upload) {
      return NextResponse.json(
        { error: 'Upload não encontrado' },
        { status: 404 }
      )
    }

    const project = upload.projects as Record<string, unknown>
    const hasPermission = project.owner_id === user.id || 
               Array.isArray(project.collaborators) && (project.collaborators as unknown[]).includes(user.id)

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Sem permissão para criar slides neste upload' },
        { status: 403 }
      )
    }

    // Verificar se já existe slide com mesmo número
    const { data: existingSlide } = await supabase
      .from('pptx_slides')
      .select('id')
      .eq('upload_id', validatedData.upload_id)
      .eq('slide_number', validatedData.slide_number)
      .single()

    if (existingSlide) {
      return NextResponse.json(
        { error: `Já existe um slide com número ${validatedData.slide_number}` },
        { status: 409 }
      )
    }

    // Criar slide
    const { data: slide, error } = await supabase
      .from('pptx_slides')
      .insert({
        ...validatedData,
        project_id: upload.project_id
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar slide:', error)
      return NextResponse.json(
        { error: 'Erro ao criar slide' },
        { status: 500 }
      )
    }

    // Atualizar contagem de slides no upload
    const { data: slideCount } = await supabase
      .from('pptx_slides')
      .select('id', { count: 'exact' })
      .eq('upload_id', validatedData.upload_id)

    await supabase
      .from('pptx_uploads')
      .update({ slide_count: slideCount?.length || 0 })
      .eq('id', validatedData.upload_id)

    // Registrar no histórico
    await supabase
      .from('project_history')
      .insert({
        project_id: upload.project_id,
        user_id: user.id,
        action: 'create',
        entity_type: 'pptx_slide',
        entity_id: slide.id,
        description: `Slide ${validatedData.slide_number} "${validatedData.title}" criado`,
        changes: validatedData
      })

    return NextResponse.json({ slide }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Erro ao criar slide:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// PUT - Reordenar slides
export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { upload_id, slides } = body

    if (!upload_id || !Array.isArray(slides)) {
      return NextResponse.json(
        { error: 'upload_id e array de slides são obrigatórios' },
        { status: 400 }
      )
    }

    // Verificar permissões
    const { data: upload } = await supabase
      .from('pptx_uploads')
      .select(`
        project_id,
        projects:project_id (
          owner_id,
          collaborators
        )
      `)
      .eq('id', upload_id)
      .single()

    if (!upload) {
      return NextResponse.json(
        { error: 'Upload não encontrado' },
        { status: 404 }
      )
    }

    const project = upload.projects as Record<string, unknown>
    const hasPermission = project.owner_id === user.id || 
                         project.collaborators?.includes(user.id)

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Sem permissão para reordenar slides' },
        { status: 403 }
      )
    }

    // Atualizar ordem dos slides
    const updates = slides.map((slide: Record<string, unknown>, index: number) => ({
      id: String(slide.id),
      slide_number: index + 1
    }))

    for (const update of updates) {
      await supabase
        .from('pptx_slides')
        .update({ slide_number: update.slide_number })
        .eq('id', update.id)
        .eq('upload_id', upload_id) // Segurança adicional
    }

    // Registrar no histórico
    await supabase
      .from('project_history')
      .insert({
        project_id: upload.project_id,
        user_id: user.id,
        action: 'update',
        entity_type: 'pptx_slides',
        entity_id: upload_id,
        description: 'Slides reordenados',
        changes: { reordered_slides: updates }
      })

    return NextResponse.json({ 
      message: 'Slides reordenados com sucesso',
      updated_count: updates.length
    })

  } catch (error) {
    console.error('Erro ao reordenar slides:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}