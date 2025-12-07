import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseForRequest, supabaseAdmin } from '@/lib/supabase/server'
import { z } from 'zod'
import { writeFile, mkdir, readFile } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limiter-real'
import PPTXProcessorReal from '@/lib/pptx/pptx-processor-real'
import { notificationManager } from '@/lib/notifications/notification-manager'

// Schema de validação para upload
const uploadSchema = z.object({
  project_id: z.string().uuid('ID do projeto inválido')
})

// Configurações de upload
const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
const ALLOWED_MIME_TYPES = [
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-powerpoint'
]

// POST - Upload de arquivo PPTX
export const POST = withRateLimit(RATE_LIMITS.UPLOAD, 'user')(async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseForRequest(request)
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Verificar se é multipart/form-data
    const contentType = request.headers.get('content-type')
    if (!contentType?.includes('multipart/form-data')) {
      return NextResponse.json(
        { error: 'Content-Type deve ser multipart/form-data' },
        { status: 400 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const projectId = formData.get('project_id') as string

    // Validar dados
    if (!file) {
      return NextResponse.json(
        { error: 'Arquivo é obrigatório' },
        { status: 400 }
      )
    }

    if (!projectId) {
      return NextResponse.json(
        { error: 'ID do projeto é obrigatório' },
        { status: 400 }
      )
    }

    // Validar projeto
    uploadSchema.parse({ project_id: projectId })

    // Verificar permissões no projeto
    const { data: project } = await supabase
      .from('projects')
      .select('user_id')
      .eq('id', projectId)
      .single()

    if (!project) {
      return NextResponse.json(
        { error: 'Projeto não encontrado' },
        { status: 404 }
      )
    }

    let hasPermission = project.user_id === user.id

    if (!hasPermission) {
      const { data: collaborator } = await supabase
        .from('project_collaborators')
        .select('permissions')
        .eq('project_id', projectId)
        .eq('user_id', user.id)
        .single()
      
      if (collaborator && (collaborator.permissions as any)?.can_edit) {
        hasPermission = true
      }
    }

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Sem permissão para fazer upload neste projeto' },
        { status: 403 }
      )
    }

    // Validar arquivo
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `Arquivo muito grande. Máximo permitido: ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      )
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipo de arquivo não permitido. Apenas arquivos PPTX são aceitos.' },
        { status: 400 }
      )
    }

    // Gerar nome único para o arquivo
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const fileExtension = file.name.split('.').pop()
    const filename = `${timestamp}_${randomString}.${fileExtension}`

    // Criar diretório de uploads se não existir
    const uploadsDir = join(process.cwd(), 'uploads', 'pptx')
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    // Salvar arquivo
    const filePath = join(uploadsDir, filename)
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Criar registro no banco
    const { data: upload, error } = await supabase
      .from('pptx_uploads')
      .insert({
        project_id: projectId,
        user_id: user.id,
        filename: filename,
        original_filename: file.name,
        file_path: filePath,
        file_size: file.size,
        mime_type: file.type,
        status: 'uploaded'
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar registro de upload:', error)
      return NextResponse.json(
        { error: 'Erro ao salvar informações do upload' },
        { status: 500 }
      )
    }

    // Registrar no histórico
    await supabase
      .from('project_history')
      .insert({
        project_id: projectId,
        user_id: user.id,
        action: 'create',
        entity_type: 'pptx_upload',
        entity_id: upload.id,
        description: `Arquivo PPTX "${file.name}" enviado`,
        changes: {
          uploaded_file: {
            filename: file.name,
            size: file.size,
            type: file.type
          }
        }
      })

    // Notificação: upload iniciado
    const roomId = `project:${projectId}:uploads`
    notificationManager.sendNotification({
      id: `upload_${upload.id}_started_${Date.now()}`,
      type: 'upload_started',
      title: 'Upload iniciado',
      message: `Arquivo ${file.name} enviado, iniciando processamento`,
      priority: 'low',
      timestamp: Date.now(),
      userId: user.id,
      roomId,
      data: {
        uploadId: upload.id,
        filename: file.name,
        projectId
      }
    })

    // Iniciar processamento assíncrono (simulado)
    // Em produção, isso seria uma fila de processamento
    processPPTXAsync(upload.id, filePath, projectId)

    return NextResponse.json({
      upload_id: upload.id,
      filename: (upload as any).filename,
      original_filename: upload.original_filename,
      file_size: (upload as any).file_size,
      status: upload.status,
      message: 'Upload realizado com sucesso. Processamento iniciado.'
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Erro no upload de PPTX:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
})

// GET - Listar uploads de PPTX de um projeto
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseForRequest(request)
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('project_id')
    const status = searchParams.get('status')

    if (!projectId) {
      return NextResponse.json(
        { error: 'ID do projeto é obrigatório' },
        { status: 400 }
      )
    }

    // Verificar permissões no projeto
    const { data: project } = await supabase
      .from('projects')
      .select('user_id, is_public')
      .eq('id', projectId)
      .single()

    if (!project) {
      return NextResponse.json(
        { error: 'Projeto não encontrado' },
        { status: 404 }
      )
    }

    let hasPermission = project.user_id === user.id || project.is_public

    if (!hasPermission) {
      const { data: collaborator } = await supabase
        .from('project_collaborators')
        .select('user_id')
        .eq('project_id', projectId)
        .eq('user_id', user.id)
        .single()
      
      if (collaborator) hasPermission = true
    }

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Sem permissão para acessar este projeto' },
        { status: 403 }
      )
    }

    // Buscar uploads
    let query = supabase
      .from('pptx_uploads')
      .select(`
        *,
        pptx_slides:pptx_slides(count)
      `)
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    const { data: uploads, error } = await query

    if (error) {
      console.error('Erro ao buscar uploads:', error)
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      )
    }

    return NextResponse.json({ uploads: uploads || [] })

  } catch (error) {
    console.error('Erro na API de uploads PPTX:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// Função para processar PPTX assincronamente (simulada)
async function processPPTXAsync(uploadId: string, filePath: string, projectId: string) {
  try {
    const supabase = supabaseAdmin
    // Definir sala do projeto para notificações
    const roomId = `project:${projectId}:uploads`

    // Atualizar status para processando
    // Note: using (supabase as any) because processing_progress may not be in generated types
    await (supabase as any)
      .from('pptx_uploads')
      .update({ 
        status: 'processing',
        processing_progress: 10
      })
      .eq('id', uploadId)

    // Notificação: preparando/processing inicial
    notificationManager.sendNotification({
      id: `upload_${uploadId}_processing_start_${Date.now()}`,
      type: 'video_processing',
      title: 'Processando arquivo',
      message: 'Analisando e extraindo slides do PPTX...',
      priority: 'medium',
      timestamp: Date.now(),
      roomId,
      data: {
        uploadId,
        phase: 'processing',
        progress: 10,
        total: 100,
        percentage: 10
      }
    })

    // Ler arquivo para buffer
    const buffer = await readFile(filePath)

    // Extrair dados reais do PPTX
    const extraction = await PPTXProcessorReal.extract(buffer)
    if (!extraction.success) {
      const errorMessage = typeof extraction.error === 'string' ? extraction.error : 'Falha ao extrair dados do PPTX'
      throw new Error(errorMessage)
    }

    // Atualizar progresso após extração inicial
    await (supabase as any)
      .from('pptx_uploads')
      .update({ processing_progress: 50 })
      .eq('id', uploadId)

    // Notificação: extração concluída
    notificationManager.sendNotification({
      id: `upload_${uploadId}_processing_mid_${Date.now()}`,
      type: 'upload_progress',
      title: 'Extração de slides concluída',
      message: 'Gerando thumbnails e salvando slides...',
      priority: 'medium',
      timestamp: Date.now(),
      roomId: roomId || '',
      data: {
        uploadId,
        phase: 'processing',
        progress: 50,
        total: 100,
        percentage: 50,
        slideCount: extraction.slides.length
      }
    })

    // Obter project_id do upload
    const { data: upload } = await supabase
      .from('pptx_uploads')
      .select('project_id')
      .eq('id', uploadId)
      .single()

    // Inserir slides no banco
    let previewUrl: string | null = null
    if (upload) {
      const slidesData = extraction.slides.map((slide, idx) => ({
        upload_id: uploadId,
        project_id: upload.project_id,
        slide_number: slide.slideNumber,
        title: slide.title,
        content: slide.content,
        notes: slide.notes,
        image_url: slide.images?.[0] || null,
        thumbnail_url: null as string | null, // será preenchido para o primeiro slide
        background_color: null,
        duration: slide.duration,
        transition_type: 'fade',
        transition_duration: 0.5,
        audio_url: null,
        tts_text: null,
        voice_settings: {},
        animations: slide.animations || [],
        effects: [],
        metadata: {
          layout: slide.layout,
          shapes: slide.shapes,
          textBlocks: slide.textBlocks,
          images: slide.images,
        },
      }))

      // Gerar thumbnail do primeiro slide e salvar URL
      previewUrl = await PPTXProcessorReal.generateThumbnail(buffer, projectId)

      if (previewUrl && slidesData.length > 0) {
        slidesData[0].thumbnail_url = previewUrl
      }

      await supabase
        .from('pptx_slides')
        .insert(slidesData)
    }

    // Finalizar processamento
    await (supabase as any)
      .from('pptx_uploads')
      .update({
        status: 'completed',
        processing_progress: 100,
        slide_count: extraction.slides.length,
        slides_data: extraction.slides,
        metadata: extraction.metadata,
        preview_url: previewUrl,
        processed_at: new Date().toISOString()
      })
      .eq('id', uploadId)

    // Notificação: upload completo
    notificationManager.sendNotification({
      id: `upload_${uploadId}_complete_${Date.now()}`,
      type: 'upload_complete',
      title: 'Processamento concluído',
      message: 'Seu PPTX foi processado com sucesso!',
      priority: 'low',
      timestamp: Date.now(),
      roomId,
      persistent: true,
      data: {
        uploadId,
        phase: 'complete',
        progress: 100,
        total: 100,
        percentage: 100,
        slideCount: extraction.slides.length,
        previewUrl
      }
    })

  } catch (error) {
    console.error('Erro no processamento de PPTX:', error)

    // Marcar como falha
    const supabase = supabaseAdmin
    await (supabase as any)
      .from('pptx_uploads')
      .update({
        status: 'failed',
        error_message: 'Erro durante o processamento do arquivo'
      })
      .eq('id', uploadId)

    // Notificação: erro
    notificationManager.sendNotification({
      id: `upload_${uploadId}_error_${Date.now()}`,
      type: 'upload_error',
      title: 'Erro no processamento',
      message: 'Ocorreu um erro durante o processamento do PPTX.',
      priority: 'high',
      timestamp: Date.now(),
      roomId: `project:${projectId}:uploads`,
      persistent: true,
      data: {
        uploadId,
        phase: 'error'
      }
    })
  }
}
