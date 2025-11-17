import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/services'
import { z } from 'zod'
import { unlink } from 'fs/promises'
import { existsSync } from 'fs'

// Schema de validação para atualização
const updateSchema = z.object({
  status: z.enum(['uploaded', 'processing', 'completed', 'failed']).optional(),
  processing_progress: z.number().min(0).max(100).optional(),
  error_message: z.string().optional(),
  slides_data: z.array(z.object({
    slide_number: z.number(),
    title: z.string(),
    content: z.string(),
    duration: z.number().positive(),
    transition_type: z.string().optional()
  })).optional()
})

// GET - Obter detalhes de um upload específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const uploadId = params.id

    // Buscar upload com dados relacionados
    const { data: upload, error } = await supabase
      .from('pptx_uploads')
      .select(`
        *,
        projects:project_id (
          id,
          name,
          owner_id,
          collaborators,
          is_public
        ),
        pptx_slides:pptx_slides (
          id,
          slide_number,
          title,
          content,
          duration,
          transition_type,
          thumbnail_url,
          created_at
        )
      `)
      .eq('id', uploadId)
      .single()

    if (error || !upload) {
      return NextResponse.json(
        { error: 'Upload não encontrado' },
        { status: 404 }
      )
    }

    // Verificar permissões
    const project = upload.projects as Record<string, unknown>
    const hasPermission = project.owner_id === user.id || 
                         project.collaborators?.includes(user.id) ||
                         project.is_public

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Sem permissão para acessar este upload' },
        { status: 403 }
      )
    }

    // Atualizar último acesso
    await supabase
      .from('pptx_uploads')
      .update({ last_accessed_at: new Date().toISOString() })
      .eq('id', uploadId)

    return NextResponse.json({ upload })

  } catch (error) {
    console.error('Erro ao buscar upload:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// PUT - Atualizar upload (principalmente para status de processamento)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const uploadId = params.id
    const body = await request.json()

    // Validar dados
    const validatedData = updateSchema.parse(body)

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
      .eq('id', uploadId)
      .single()

    if (!upload) {
      return NextResponse.json(
        { error: 'Upload não encontrado' },
        { status: 404 }
      )
    }

    const project = upload.projects as any
    const hasPermission = project.owner_id === user.id || 
                         project.collaborators?.includes(user.id)

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Sem permissão para atualizar este upload' },
        { status: 403 }
      )
    }

    // Preparar dados para atualização
    const updateData: any = {
      ...validatedData,
      updated_at: new Date().toISOString()
    }

    // Se status mudou para completed, definir processed_at
    if (validatedData.status === 'completed' && upload.status !== 'completed') {
      updateData.processed_at = new Date().toISOString()
      
      // Se há dados de slides, contar slides
      if (validatedData.slides_data) {
        updateData.slide_count = validatedData.slides_data.length
      }
    }

    // Atualizar upload
    const { data: updatedUpload, error: updateError } = await supabase
      .from('pptx_uploads')
      .update(updateData)
      .eq('id', uploadId)
      .select()
      .single()

    if (updateError) {
      console.error('Erro ao atualizar upload:', updateError)
      return NextResponse.json(
        { error: 'Erro ao atualizar upload' },
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
        entity_type: 'pptx_upload',
        entity_id: uploadId,
        description: `Status do upload PPTX atualizado para "${validatedData.status || upload.status}"`,
        changes: validatedData
      })

    return NextResponse.json({ upload: updatedUpload })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Erro ao atualizar upload:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Excluir upload e arquivo
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const uploadId = params.id

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
      .eq('id', uploadId)
      .single()

    if (!upload) {
      return NextResponse.json(
        { error: 'Upload não encontrado' },
        { status: 404 }
      )
    }

    const project = upload.projects as any
    const hasPermission = project.owner_id === user.id || 
                         project.collaborators?.includes(user.id)

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Sem permissão para excluir este upload' },
        { status: 403 }
      )
    }

    // Excluir slides relacionados primeiro
    await supabase
      .from('pptx_slides')
      .delete()
      .eq('upload_id', uploadId)

    // Excluir upload do banco
    const { error: deleteError } = await supabase
      .from('pptx_uploads')
      .delete()
      .eq('id', uploadId)

    if (deleteError) {
      console.error('Erro ao excluir upload:', deleteError)
      return NextResponse.json(
        { error: 'Erro ao excluir upload' },
        { status: 500 }
      )
    }

    // Tentar excluir arquivo físico
    try {
      if (upload.file_path && existsSync(upload.file_path)) {
        await unlink(upload.file_path)
      }
    } catch (fileError) {
      console.warn('Erro ao excluir arquivo físico:', fileError)
      // Não falhar a operação se não conseguir excluir o arquivo
    }

    // Registrar no histórico
    await supabase
      .from('project_history')
      .insert({
        project_id: upload.project_id,
        user_id: user.id,
        action: 'delete',
        entity_type: 'pptx_upload',
        entity_id: uploadId,
        description: `Upload PPTX "${upload.original_filename}" excluído`,
        changes: {
          deleted_upload: {
            filename: upload.original_filename,
            size: upload.file_size
          }
        }
      })

    return NextResponse.json({ 
      message: 'Upload excluído com sucesso' 
    })

  } catch (error) {
    console.error('Erro ao excluir upload:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}