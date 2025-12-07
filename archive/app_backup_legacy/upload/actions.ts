// @ts-nocheck
// TODO: Backup - fix types
'use server'

import { Buffer } from 'node:buffer'
import { randomUUID } from 'node:crypto'

import { revalidatePath } from 'next/cache'

import { bootstrapSlidesFromPptx } from '@/lib/pptx/bootstrap'
import { getServiceRoleClient } from '@/lib/supabase'

import type { Project } from '@/lib/projects'
import type { Database } from '@/lib/supabase/types'

export type UploadActionState = {
  status: 'idle' | 'success' | 'error'
  message: string | null
  projectId?: string
  ownerId?: string
  slideCount?: number
  warnings?: string[]
}

export const initialUploadState: UploadActionState = {
  status: 'idle',
  message: null,
}

const PPTX_MIME = 'application/vnd.openxmlformats-officedocument.presentationml.presentation'

const sanitizeFilename = (filename: string) =>
  filename
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .toLowerCase()

export async function handlePptxUpload(
  _prevState: UploadActionState,
  formData: FormData
): Promise<UploadActionState> {
  const ownerIdValue = formData.get('ownerId')
  const projectNameValue = formData.get('projectName')
  const descriptionRaw = formData.get('projectDescription')
  const fileEntry = formData.get('pptx')

  const ownerId = typeof ownerIdValue === 'string' ? ownerIdValue.trim() : ''
  const projectName = typeof projectNameValue === 'string' ? projectNameValue.trim() : ''

  if (!ownerId) {
    return {
      status: 'error',
      message: 'Informe o ID do usuário (ownerId) responsável pelo projeto.',
    }
  }

  if (!projectName) {
    return {
      status: 'error',
      message: 'Defina um nome para o projeto.',
    }
  }

  if (!(fileEntry instanceof File)) {
    return {
      status: 'error',
      message: 'Selecione um arquivo PPTX para continuar.',
    }
  }

  const file = fileEntry

  if (file.size === 0) {
    return {
      status: 'error',
      message: 'O arquivo selecionado está vazio.',
    }
  }

  const maxSizeBytes = 50 * 1024 * 1024
  if (file.size > maxSizeBytes) {
    return {
      status: 'error',
      message: 'O arquivo excede o limite de 50 MB definido para o MVP.',
    }
  }

  const extension = file.name.split('.').pop()?.toLowerCase()
  if (extension !== 'pptx') {
    return {
      status: 'error',
      message: 'Apenas arquivos .pptx são aceitos no MVP.',
    }
  }

  const description = typeof descriptionRaw === 'string' ? descriptionRaw.trim() : null
  const supabase = getServiceRoleClient()
  const projectId = randomUUID()
  const storagePath = `pptx/${ownerId}/${projectId}/${Date.now()}-${sanitizeFilename(file.name)}`

  try {
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { error: uploadError } = await supabase.storage
      .from('assets')
      .upload(storagePath, buffer, {
        contentType: file.type || PPTX_MIME,
        upsert: false,
      })

    if (uploadError) {
      return {
        status: 'error',
        message: `Falha ao enviar arquivo para o Storage: ${uploadError.message}`,
      }
    }

    const insertPayload: Database['public']['Tables']['projects']['Insert'] = {
      id: projectId,
      owner_id: ownerId,
      name: projectName,
      description: description || null,
      status: 'draft',
      settings: {
        source_pptx_path: storagePath,
        original_filename: file.name,
        upload_size: file.size,
      },
    }

    const { data, error: insertError } = await supabase
      .from('projects')
      .insert(insertPayload)
      .select('*')
      .maybeSingle()

    if (insertError || !data) {
      await supabase.storage.from('assets').remove([storagePath]).catch(() => undefined)
      return {
        status: 'error',
        message: `Falha ao criar registro do projeto: ${insertError?.message ?? 'erro desconhecido'}`,
      }
    }

    const project = data as Project

    const warnings: string[] = []
    let slideCount: number | undefined

    const bootstrapResult = await bootstrapSlidesFromPptx(
      supabase,
      project.id,
      storagePath,
      project.settings,
    )

    if (!bootstrapResult.ok) {
      warnings.push(bootstrapResult.message ?? 'Não foi possível gerar slides automaticamente.')
    } else {
      slideCount = bootstrapResult.inserted
    }

    revalidatePath('/dashboard')
    revalidatePath('/editor')

    return {
      status: 'success',
      message: slideCount
        ? `Upload concluído. ${slideCount} slides foram extraídos automaticamente.`
        : 'Upload concluído. Projeto criado com sucesso.',
      projectId: project.id,
      ownerId,
      slideCount,
      warnings: warnings.length ? warnings : undefined,
    }
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Erro inesperado durante o upload.',
    }
  }
}
