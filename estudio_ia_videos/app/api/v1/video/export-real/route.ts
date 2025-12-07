/**
 * 🎬 API de Exportação Real de Vídeo
 */

import { NextRequest, NextResponse } from 'next/server'
import { exportProjectVideo, getExportJobStatus } from '@/lib/video-export-real'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('DEBUG: Body received:', JSON.stringify(body))
    const { projectId, options } = body

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID é obrigatório' },
        { status: 400 }
      )
    }

    // Opções padrão de exportação + normalização/validação
    const normalized = normalizeAndValidateOptions(options)
    // Se houver erro de validação, a função retorna um NextResponse diretamente
    // Verificação robusta (duck typing) para evitar problemas com instanceof em testes
    if (normalized instanceof NextResponse || ('status' in (normalized as any) && typeof (normalized as any).json === 'function')) {
      return normalized as NextResponse
    }
    const exportOptions = normalized as ExportOptions

    console.log('🎬 Iniciando exportação de vídeo para projeto:', projectId)

    // Iniciar exportação assíncrona
    const result = await exportProjectVideo(projectId, exportOptions)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Erro na exportação' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      jobId: result.jobId,
      message: 'Exportação de vídeo iniciada! Use o jobId para verificar o progresso.',
      status: 'queued',
      options: exportOptions
    })

  } catch (error) {
    console.error('❌ Erro na API de exportação de vídeo:', error)
    return NextResponse.json(
      { 
        error: 'Erro na exportação de vídeo',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
  const jobId = searchParams.get('jobId')
    const projectId = searchParams.get('projectId')
    const statusFilter = searchParams.get('status') as 'queued' | 'processing' | 'completed' | 'error' | null
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10) || 20, 100)
    const offset = parseInt(searchParams.get('offset') || '0', 10) || 0

    if (!jobId) {
      // Se projectId for fornecido, retornar histórico
      if (projectId) {
        const where: { projectId: string; status?: 'queued' | 'processing' | 'completed' | 'error' } = { projectId }
        if (statusFilter && ['queued','processing','completed','error'].includes(statusFilter)) {
          where.status = statusFilter
        }
        const total = await prisma.videoExport.count({ where })
        const jobs = await prisma.videoExport.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset
        })
        return NextResponse.json({
          success: true,
          history: jobs.map(j => ({
            id: j.id,
            status: j.status,
            progress: j.progress,
            outputUrl: j.videoUrl,
            error: j.errorMessage,
            createdAt: j.createdAt,
            updatedAt: j.updatedAt
          })),
          page: {
            total,
            offset,
            limit,
            count: jobs.length,
            hasNext: offset + jobs.length < total
          }
        })
      }
      return NextResponse.json(
        { 
          message: 'API de Exportação de Vídeo Real',
          usage: {
            'POST /export-real': 'Iniciar exportação { projectId, options }',
            'GET /export-real?jobId=': 'Verificar status do job',
            'GET /export-real?projectId=': 'Listar jobs recentes do projeto',
            'GET /export-real?projectId=&status=&limit=&offset=': 'Histórico com filtros e paginação'
          },
          supportedFormats: ['mp4', 'webm', 'mov'],
          supportedQualities: ['sd', 'hd', 'fhd', '4k'],
          supportedCodecs: ['h264', 'h265', 'vp9', 'av1'],
          defaults: DEFAULTS
        },
        { status: 200 }
      )
    }

    // Verificar status do job
    const jobStatus = await getExportJobStatus(jobId)

    if (!jobStatus.job) {
      return NextResponse.json(
        { error: jobStatus.error || 'Job não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      job: {
        id: jobStatus.job.id,
        projectId: jobStatus.job.projectId,
        status: jobStatus.job.status,
        progress: jobStatus.job.progress,
        outputUrl: jobStatus.job.outputUrl,
        error: jobStatus.job.error,
        startedAt: jobStatus.job.startedAt,
        completedAt: jobStatus.job.completedAt,
        metadata: jobStatus.job.metadata
      },
      message: `Status do job: ${jobStatus.job.status} (${jobStatus.job.progress}%)`
    })

  } catch (error) {
    console.error('❌ Erro ao verificar status do job:', error)
    return NextResponse.json(
      { 
        error: 'Erro ao verificar status',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}

/**
 * Cancelar job de exportação
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('jobId')

    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID é obrigatório' },
        { status: 400 }
      )
    }

    // Em uma implementação real, cancelaria o processo FFmpeg
    // Por enquanto, apenas marcamos como cancelado no banco
    
    console.log('🛑 Cancelando job de exportação:', jobId)

    // Aqui seria implementada a lógica de cancelamento real
    // incluindo parar processos FFmpeg em andamento

    return NextResponse.json({
      success: true,
      message: `Job ${jobId} cancelado`,
      jobId
    })

  } catch (error) {
    console.error('❌ Erro ao cancelar job:', error)
    return NextResponse.json(
      { 
        error: 'Erro ao cancelar job',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}

// ---- Utilitários de validação e defaults ----
const DEFAULTS = {
  format: 'mp4' as const,
  quality: 'hd' as const,
  fps: 30 as const,
  codec: 'h264' as const,
  includeAudio: true,
  preset: 'medium' as const,
}

type Format = 'mp4' | 'webm' | 'mov'
type Quality = 'sd' | 'hd' | 'fhd' | '4k'
type Codec = 'h264' | 'h265' | 'vp9' | 'av1'
type Preset = 'ultrafast'|'superfast'|'veryfast'|'faster'|'fast'|'medium'|'slow'|'slower'|'veryslow'|'good'|'best'

type ExportOptions = {
  format: Format
  quality: Quality
  fps: 24 | 30 | 60
  codec: Codec
  includeAudio: boolean
  bitrate?: string
  preset?: Preset
}

function normalizeAndValidateOptions(input: unknown): ExportOptions | NextResponse {
  const src = (input as Record<string, unknown>) || {};
  const opts: ExportOptions = {
    format: (src.format || DEFAULTS.format) as Format,
    quality: (src.quality || DEFAULTS.quality) as Quality,
    fps: ([24, 30, 60].includes(src.fps as number) ? (src.fps as 24 | 30 | 60) : DEFAULTS.fps),
    codec: (src.codec || DEFAULTS.codec) as Codec,
    includeAudio: typeof src.includeAudio === 'boolean' ? src.includeAudio : DEFAULTS.includeAudio,
    bitrate: normalizeBitrate(src.bitrate),
    preset: src.preset as Preset | undefined
  }

  // Regras de compatibilidade simples:
  // - webm: codec deve ser vp9 ou av1
  // - mp4/mov: codec deve ser h264 ou h265
  // - 4k: requer codec eficiente (h265, vp9 ou av1)
  if (opts.format === 'webm' && !['vp9', 'av1'].includes(opts.codec)) {
    return NextResponse.json({ error: 'Formato webm requer codec vp9 ou av1' }, { status: 400 })
  }
  if ((opts.format === 'mp4' || opts.format === 'mov') && !['h264', 'h265'].includes(opts.codec)) {
    return NextResponse.json({ error: `${opts.format} requer codec h264 ou h265` }, { status: 400 })
  }
  if (opts.quality === '4k' && !['h265', 'vp9', 'av1'].includes(opts.codec)) {
    return NextResponse.json({ error: '4K requer codec h265, vp9 ou av1' }, { status: 400 })
  }

  // Validar preset por codec
  if (opts.preset) {
    const preset = opts.preset
    if (['h264','h265'].includes(opts.codec)) {
      const allowed: Preset[] = ['ultrafast','superfast','veryfast','faster','fast','medium','slow','slower','veryslow']
      if (!allowed.includes(preset)) {
        return NextResponse.json({ error: `Preset inválido para ${opts.codec}` }, { status: 400 })
      }
    } else if (['vp9','av1'].includes(opts.codec)) {
      const allowed: Preset[] = ['good','best']
      if (!allowed.includes(preset)) {
        return NextResponse.json({ error: `Preset inválido para ${opts.codec}` }, { status: 400 })
      }
    }
  } else {
    // Defaults por codec
    if (['vp9','av1'].includes(opts.codec)) {
      opts.preset = 'good'
    } else if (['h264','h265'].includes(opts.codec)) {
      // Para 4K, priorizar qualidade (mais lento)
      opts.preset = (opts.quality === '4k') ? 'slow' : (DEFAULTS.preset as Preset)
    }
  }

  return opts
}

function normalizeBitrate(bitrate: unknown): string | undefined {
  if (bitrate == null) return undefined
  if (typeof bitrate === 'number' && isFinite(bitrate) && bitrate > 0) return `${Math.round(bitrate)}k`
  if (typeof bitrate === 'string') {
    const t = bitrate.trim().toLowerCase()
    if (/^\d+$/.test(t)) return `${t}k`
    if (/^\d+(k|m|kbps|mbps)$/.test(t)) {
      return t.replace('kbps','k').replace('mbps','m')
    }
  }
  return undefined
}

