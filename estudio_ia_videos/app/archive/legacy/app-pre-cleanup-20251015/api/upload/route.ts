/**
 * 📤 API de Upload de Arquivos
 * Upload seguro com validação, processamento e storage
 * 
 * Features:
 * - Validação de tipo e tamanho
 * - Upload para Supabase Storage
 * - Geração de thumbnails
 * - Progress tracking
 * - Metadata extraction
 */

import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Database } from '@/types/supabase'
import sharp from 'sharp'
import { nanoid } from 'nanoid'

// Tipos permitidos
const ALLOWED_FILE_TYPES = {
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
  'application/vnd.ms-powerpoint': '.ppt',
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
  'video/mp4': '.mp4',
  'video/webm': '.webm',
  'audio/mpeg': '.mp3',
  'audio/wav': '.wav',
}

// Tamanho máximo: 100MB
const MAX_FILE_SIZE = 100 * 1024 * 1024

interface UploadResponse {
  success: boolean
  file?: {
    id: string
    name: string
    path: string
    url: string
    size: number
    type: string
    thumbnail?: string
    metadata?: Record<string, unknown>
  }
  error?: string
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const projectId = formData.get('projectId') as string | null
    const fileType = formData.get('type') as string | null // 'presentation', 'image', 'video', 'audio'

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'Nenhum arquivo fornecido' },
        { status: 400 }
      )
    }

    // Validar tipo de arquivo
    if (!ALLOWED_FILE_TYPES[file.type as keyof typeof ALLOWED_FILE_TYPES]) {
      return NextResponse.json(
        { success: false, error: 'Tipo de arquivo não permitido' },
        { status: 400 }
      )
    }

    // Validar tamanho
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: 'Arquivo muito grande (máx. 100MB)' },
        { status: 400 }
      )
    }

    // Gerar nome único
    const fileId = nanoid()
    const fileExtension = ALLOWED_FILE_TYPES[file.type as keyof typeof ALLOWED_FILE_TYPES]
    const fileName = `${fileId}${fileExtension}`
    const filePath = `${user.id}/${fileType || 'files'}/${fileName}`

    // Converter File para Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload para Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('uploads')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json(
        { success: false, error: 'Erro ao fazer upload do arquivo' },
        { status: 500 }
      )
    }

    // Obter URL pública
    const { data: { publicUrl } } = supabase.storage
      .from('uploads')
      .getPublicUrl(filePath)

    // Gerar thumbnail se for imagem
    let thumbnailUrl: string | undefined

    if (file.type.startsWith('image/')) {
      try {
        const thumbnailBuffer = await sharp(buffer)
          .resize(300, 300, { fit: 'cover' })
          .jpeg({ quality: 80 })
          .toBuffer()

        const thumbnailPath = `${user.id}/thumbnails/${fileId}.jpg`

        const { error: thumbError } = await supabase.storage
          .from('uploads')
          .upload(thumbnailPath, thumbnailBuffer, {
            contentType: 'image/jpeg',
            upsert: false,
          })

        if (!thumbError) {
          const { data: { publicUrl: thumbUrl } } = supabase.storage
            .from('uploads')
            .getPublicUrl(thumbnailPath)
          
          thumbnailUrl = thumbUrl
        }
      } catch (thumbError) {
        console.error('Thumbnail generation error:', thumbError)
        // Continuar mesmo se falhar a geração do thumbnail
      }
    }

    // Extrair metadata
    const metadata: Record<string, unknown> = {
      originalName: file.name,
      uploadedAt: new Date().toISOString(),
      uploadedBy: user.id,
    }

    // Salvar registro no banco de dados
    const { data: fileRecord, error: dbError } = await supabase
      .from('files')
      .insert({
        id: fileId,
        user_id: user.id,
        project_id: projectId,
        name: file.name,
        path: filePath,
        url: publicUrl,
        thumbnail_url: thumbnailUrl,
        size: file.size,
        type: file.type,
        file_type: fileType,
        metadata,
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      // Cleanup: deletar arquivo do storage
      await supabase.storage.from('uploads').remove([filePath])
      if (thumbnailUrl) {
        await supabase.storage.from('uploads').remove([`${user.id}/thumbnails/${fileId}.jpg`])
      }
      
      return NextResponse.json(
        { success: false, error: 'Erro ao salvar registro do arquivo' },
        { status: 500 }
      )
    }

    // Retornar sucesso
    const response: UploadResponse = {
      success: true,
      file: {
        id: fileId,
        name: file.name,
        path: filePath,
        url: publicUrl,
        size: file.size,
        type: file.type,
        thumbnail: thumbnailUrl,
        metadata,
      },
    }

    return NextResponse.json(response, { status: 200 })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

/**
 * GET - Listar arquivos do usuário
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Parse query params
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const fileType = searchParams.get('type')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query
    let query = supabase
      .from('files')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (projectId) {
      query = query.eq('project_id', projectId)
    }

    if (fileType) {
      query = query.eq('file_type', fileType)
    }

    const { data: files, error: queryError, count } = await query
      .range(offset, offset + limit - 1)

    if (queryError) {
      console.error('Query error:', queryError)
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar arquivos' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      files,
      pagination: {
        total: count || 0,
        limit,
        offset,
      },
    })

  } catch (error) {
    console.error('Get files error:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

/**
 * DELETE - Deletar arquivo
 */
export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const fileId = searchParams.get('id')

    if (!fileId) {
      return NextResponse.json(
        { success: false, error: 'ID do arquivo não fornecido' },
        { status: 400 }
      )
    }

    // Buscar arquivo
    const { data: file, error: fetchError } = await supabase
      .from('files')
      .select('*')
      .eq('id', fileId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !file) {
      return NextResponse.json(
        { success: false, error: 'Arquivo não encontrado' },
        { status: 404 }
      )
    }

    // Deletar do storage
    const filesToDelete = [file.path]
    if (file.thumbnail_url) {
      const thumbnailPath = file.thumbnail_url.split('/uploads/')[1]
      if (thumbnailPath) {
        filesToDelete.push(thumbnailPath)
      }
    }

    const { error: storageError } = await supabase.storage
      .from('uploads')
      .remove(filesToDelete)

    if (storageError) {
      console.error('Storage delete error:', storageError)
    }

    // Deletar do banco
    const { error: dbError } = await supabase
      .from('files')
      .delete()
      .eq('id', fileId)

    if (dbError) {
      console.error('Database delete error:', dbError)
      return NextResponse.json(
        { success: false, error: 'Erro ao deletar arquivo' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Delete file error:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
