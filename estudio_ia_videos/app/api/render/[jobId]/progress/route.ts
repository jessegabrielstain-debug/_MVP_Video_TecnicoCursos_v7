import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { z } from 'zod'
import { createRenderQueueEvents } from '@/lib/queue/render-queue'
import type { Database } from '@/lib/supabase/types'
import type { 
  RenderJobWithProject, 
  RenderProgressData, 
  RenderCompleteData
} from '@/types/database'

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
  const cookieStore = cookies()
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )
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
    .select('id, project_id, status, progress, output_url, error_message, projects(user_id)')
    .eq('id', jobId)
    .single()

  if (jobError || !job) {
    return new Response(JSON.stringify({ error: 'Job não encontrado' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Type the job with project relation
  const typedJob = job as unknown as RenderJobWithProject
  const projectUserId = typedJob.projects?.user_id
  if (projectUserId !== user.id) {
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
        status: typedJob.status,
        progress: typedJob.progress,
        stage: null,
        message: null,
        videoUrl: typedJob.output_url,
        error: typedJob.error_message,
      })

      // BullMQ event callbacks - typed internally, use generic handler for registration
      // Note: BullMQ QueueEvents typing is complex, we use explicit typing for the handler logic
      const onProgress = (args: { jobId: string; data: unknown }, _id: string) => {
        if (args.jobId !== jobId) return
        const progressData = args.data as RenderProgressData
        const progress = typeof progressData?.progress === 'number' ? progressData.progress : 0
        send('progress', {
          progress,
          data: args.data,
          timestamp: Date.now(),
        })
      }

      const onCompleted = (args: { jobId: string; returnvalue: unknown }, _id: string) => {
        if (args.jobId !== jobId) return
        const completeData = args.returnvalue as RenderCompleteData
        send('complete', {
          videoUrl: completeData?.videoUrl ?? null,
          timestamp: Date.now(),
        })
      }

      const onFailed = (args: { jobId: string; failedReason: string }, _id: string) => {
        if (args.jobId !== jobId) return
        send('failed', {
          error: args.failedReason ?? 'Renderização falhou',
          timestamp: Date.now(),
        })
      }

      // BullMQ QueueEvents requires generic listener type - use type assertion for compatibility
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      queueEvents.on('progress', onProgress as any)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      queueEvents.on('completed', onCompleted as any)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      queueEvents.on('failed', onFailed as any)

      const keepAlive = setInterval(() => {
        controller.enqueue(encoder.encode(': keep-alive\n\n'))
      }, 15_000)

      const close = () => {
        clearInterval(keepAlive)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        queueEvents.removeListener('progress', onProgress as any)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        queueEvents.removeListener('completed', onCompleted as any)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        queueEvents.removeListener('failed', onFailed as any)
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