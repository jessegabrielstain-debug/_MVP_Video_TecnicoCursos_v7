import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseForRequest } from '@/lib/supabase/server'
import { z } from 'zod'
import { logger } from '@/lib/logger'

// Schema de validação para atualização de slide
const updateSlideSchema = z.object({
  slide_number: z.number().int().positive().optional(),
  title: z.string().min(1).max(200).optional(),
  content: z.string().max(5000).optional(),
  duration: z.number().positive().max(300).optional(),
  transition_type: z.enum(['fade', 'slide', 'zoom', 'flip', 'none']).optional(),
  thumbnail_url: z.string().url().optional(),
  notes: z.string().max(2000).optional(),
  properties: z.record(z.unknown()).optional()
})

// GET - Obter detalhes de um slide específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabaseForRequest(request)
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const slideId = params.id

    // Buscar slide com dados relacionados
    const { data: slide, error } = await supabase
      .from('pptx_slides')
      .select(`
        *,
        pptx_uploads:upload_id (
          id,
          project_id,
          original_filename,
          status,
          projects:project_id (
            id,
            name,
            user_id,
            is_public
          )
        )
      `)
      .eq('id', slideId)
      .single()

    if (error || !slide) {
      return NextResponse.json(
        { error: 'Slide não encontrado' },
        { status: 404 }
      )
    }

    // Verificar permissões
    const upload = slide.pptx_uploads as any
    const project = upload.projects
    
    let hasPermission = project.user_id === user.id || project.is_public

    if (!hasPermission) {
      const { data: collaborator } = await supabase
        .from('project_collaborators')
        .select('role')
        .eq('project_id', project.id)
        .eq('user_id', user.id)
        .in('role', ['owner', 'editor'])
        .single()
      
      if (collaborator) {
        hasPermission = true
      }
    }

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Sem permissão para acessar este slide' },
        { status: 403 }
      )
    }

    return NextResponse.json({ slide })

  } catch (error) {
    logger.error('Erro ao buscar slide:', error instanceof Error ? error : new Error(String(error)), { component: 'API: pptx/slides/[id]' })
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// PUT - Atualizar slide
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabaseForRequest(request)
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const slideId = params.id
    const body = await request.json()

    // Validar dados
    const validatedData = updateSlideSchema.parse(body)

    // Verificar se slide existe e permissões
    const { data: slide } = await supabase
      .from('pptx_slides')
      .select(`
        *,
        pptx_uploads:upload_id (
          project_id,
          projects:project_id (
            id,
            user_id
          )
        )
      `)
      .eq('id', slideId)
      .single()

    if (!slide) {
      return NextResponse.json(
        { error: 'Slide não encontrado' },
        { status: 404 }
      )
    }

    const upload = slide.pptx_uploads as any
    const project = upload.projects
    
    let hasPermission = project.user_id === user.id

    if (!hasPermission) {
      const { data: collaborator } = await supabase
        .from('project_collaborators')
        .select('role')
        .eq('project_id', project.id)
        .eq('user_id', user.id)
        .in('role', ['owner', 'editor'])
        .single()
      
      if (collaborator) {
        hasPermission = true
      }
    }

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Sem permissão para atualizar este slide' },
        { status: 403 }
      )
    }

    // Se mudando número do slide, verificar conflitos
    if (validatedData.slide_number && validatedData.slide_number !== slide.slide_number) {
      const { data: existingSlide } = await supabase
        .from('pptx_slides')
        .select('id')
        .eq('upload_id', slide.upload_id)
        .eq('slide_number', validatedData.slide_number)
        .neq('id', slideId)
        .single()

      if (existingSlide) {
        return NextResponse.json(
          { error: `Já existe um slide com número ${validatedData.slide_number}` },
          { status: 409 }
        )
      }
    }

    // Mesclar propriedades se fornecidas
    let updateData = { ...validatedData }
    if (validatedData.properties && slide.properties) {
      updateData.properties = {
        ...(slide.properties as any),
        ...validatedData.properties
      }
    }

    // Atualizar slide
    const { data: updatedSlide, error: updateError } = await supabase
      .from('pptx_slides')
      .update({
        ...updateData,
        properties: updateData.properties as any,
        updated_at: new Date().toISOString()
      })
      .eq('id', slideId)
      .select()
      .single()

    if (updateError) {
      logger.error('Erro ao atualizar slide:', updateError instanceof Error ? updateError : new Error(String(updateError)), { component: 'API: pptx/slides/[id]' })
      return NextResponse.json(
        { error: 'Erro ao atualizar slide' },
        { status: 500 }
      )
    }

    // Registrar no histórico
    await supabase
      .from('project_history')
      .insert({
        project_id: upload.project_id,
        user_id: user.id,
        action: 'update',
        entity_type: 'pptx_slide',
        entity_id: slideId,
        description: `Slide ${slide.slide_number} "${slide.title}" atualizado`,
        changes: validatedData as any
      })

    return NextResponse.json({ slide: updatedSlide })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }

    logger.error('Erro ao atualizar slide:', error instanceof Error ? error : new Error(String(error)), { component: 'API: pptx/slides/[id]' })
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Excluir slide
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabaseForRequest(request)
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const slideId = params.id

    // Verificar se slide existe e permissões
    const { data: slide } = await supabase
      .from('pptx_slides')
      .select(`
        *,
        pptx_uploads:upload_id (
          id,
          project_id,
          projects:project_id (
            id,
            user_id
          )
        )
      `)
      .eq('id', slideId)
      .single()

    if (!slide) {
      return NextResponse.json(
        { error: 'Slide não encontrado' },
        { status: 404 }
      )
    }

    const upload = slide.pptx_uploads as any
    const project = upload.projects
    
    let hasPermission = project.user_id === user.id

    if (!hasPermission) {
      const { data: collaborator } = await supabase
        .from('project_collaborators')
        .select('role')
        .eq('project_id', project.id)
        .eq('user_id', user.id)
        .in('role', ['owner', 'editor'])
        .single()
      
      if (collaborator) {
        hasPermission = true
      }
    }

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Sem permissão para excluir este slide' },
        { status: 403 }
      )
    }

    // Excluir slide
    const { error: deleteError } = await supabase
      .from('pptx_slides')
      .delete()
      .eq('id', slideId)

    if (deleteError) {
      logger.error('Erro ao excluir slide:', deleteError instanceof Error ? deleteError : new Error(String(deleteError)), { component: 'API: pptx/slides/[id]' })
      return NextResponse.json(
        { error: 'Erro ao excluir slide' },
        { status: 500 }
      )
    }

    // Atualizar contagem de slides no upload
    const { data: slideCount } = await supabase
      .from('pptx_slides')
      .select('id', { count: 'exact' })
      .eq('upload_id', slide.upload_id)

    await supabase
      .from('pptx_uploads')
      .update({ slide_count: slideCount?.length || 0 })
      .eq('id', slide.upload_id)

    // Reordenar slides restantes
    const { data: remainingSlides } = await supabase
      .from('pptx_slides')
      .select('id, slide_number')
      .eq('upload_id', slide.upload_id)
      .gt('slide_number', slide.slide_number)
      .order('slide_number')

    if (remainingSlides && remainingSlides.length > 0) {
      for (const remainingSlide of remainingSlides) {
        await supabase
          .from('pptx_slides')
          .update({ slide_number: remainingSlide.slide_number - 1 })
          .eq('id', remainingSlide.id)
      }
    }

    // Registrar no histórico
    await supabase
      .from('project_history')
      .insert({
        project_id: upload.project_id,
        user_id: user.id,
        action: 'delete',
        entity_type: 'pptx_slide',
        entity_id: slideId,
        description: `Slide ${slide.slide_number} "${slide.title}" excluído`,
        changes: {
          deleted_slide: {
            slide_number: slide.slide_number,
            title: slide.title,
            duration: slide.duration
          }
        }
      })

    return NextResponse.json({ 
      message: 'Slide excluído com sucesso' 
    })

  } catch (error) {
    logger.error('Erro ao excluir slide:', error instanceof Error ? error : new Error(String(error)), { component: 'API: pptx/slides/[id]' })
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}