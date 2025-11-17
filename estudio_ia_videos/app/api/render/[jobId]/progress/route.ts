import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { z } from 'zod'
import { createRenderQueueEvents } from '@/lib/queue/render-queue'

const paramsSchema = z.object({
  id: z.string().uuid('ID do job inválido'),
})

function sseHeaders() {
  return {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  }
}

export async function GET(request: NextRequest, ctx: { params: { id?: string } }) {
  const parsed = paramsSchema.safeParse(ctx.params)
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: 'Parâmetros inválidos' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const jobId = parsed.data.id
  const supabase = createRouteHandlerClient({ cookies })
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Não autorizado' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const { data: job, error: jobError } = await supabase
    .from('render_jobs')
    .select('id, user_id, status, progress, current_stage, status_message, video_url, error')
    .eq('id', jobId)
    .single()

  if (jobError || !job) {
    return new Response(JSON.stringify({ error: 'Job não encontrado' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  if (job.user_id !== user.id) {
    return new Response(JSON.stringify({ error: 'Sem acesso a este job' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const queueEvents = createRenderQueueEvents()
  const encoder = new TextEncoder()

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (event: string, payload: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\n`))
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`))
      }

      send('init', {
        status: job.status,
        progress: job.progress,
        stage: job.current_stage,
        message: job.status_message,
        videoUrl: job.video_url,
        error: job.error,
      })

      const onProgress = ({ id: evtJobId, data, progress }: { id: string; data?: unknown; progress: number }) => {
        if (evtJobId !== jobId) return
        send('progress', {
          progress,
          data,
          timestamp: Date.now(),
        })
      }

      const onCompleted = ({ id: evtJobId, returnvalue }: { id: string; returnvalue?: { videoUrl?: string } }) => {
        if (evtJobId !== jobId) return
        send('complete', {
          videoUrl: returnvalue?.videoUrl ?? null,
          timestamp: Date.now(),
        })
      }

      const onFailed = ({ id: evtJobId, failedReason }: { id: string; failedReason?: string }) => {
        if (evtJobId !== jobId) return
        send('failed', {
          error: failedReason ?? 'Renderização falhou',
          timestamp: Date.now(),
        })
      }

      queueEvents.on('progress', onProgress)
      queueEvents.on('completed', onCompleted)
      queueEvents.on('failed', onFailed)

      const keepAlive = setInterval(() => {
        controller.enqueue(encoder.encode(': keep-alive\n\n'))
      }, 15_000)

      const close = () => {
        clearInterval(keepAlive)
        queueEvents.removeListener('progress', onProgress)
        queueEvents.removeListener('completed', onCompleted)
        queueEvents.removeListener('failed', onFailed)
        queueEvents.close().catch(() => undefined)
        controller.close()
      }

      request.signal.addEventListener('abort', close)
    },
    cancel() {
      queueEvents.close().catch(() => undefined)
    },
  })

  return new Response(stream, {
    status: 200,
    headers: sseHeaders(),
  })
}