import { randomUUID } from 'node:crypto'

type JobStatus = 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled'

type MockJob = {
  id: string
  user_id: string
  project_id: string
  status: JobStatus
  progress: number
  attempts: number
  duration_ms: number | null
  render_settings: Record<string, unknown>
  created_at: string
  updated_at: string
  completed_at: string | null
}

type Store = Map<string, MockJob[]>

type GlobalWithStore = typeof globalThis & {
  __mock_render_jobs__?: Store
}

const getStore = (): Store => {
  const g = globalThis as GlobalWithStore
  if (!g.__mock_render_jobs__) {
    g.__mock_render_jobs__ = new Map<string, MockJob[]>()
  }
  return g.__mock_render_jobs__
}

const hasSupabaseConfig = () => Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

export const shouldUseMockRenderJobs = () => {
  if (process.env.USE_MOCK_RENDER_JOBS === 'true') {
    return true
  }
  return !hasSupabaseConfig()
}

export const getMockUserId = (req?: Request) => {
  const explicit = req?.headers.get('x-mock-user')?.trim()
  return explicit && explicit.length > 0 ? explicit : 'mock-user'
}

const createJob = (userId: string, partial: Partial<MockJob>): MockJob => {
  const now = new Date().toISOString()
  return {
    id: randomUUID(),
    user_id: userId,
    project_id: partial.project_id ?? randomUUID(),
    status: partial.status ?? 'queued',
    progress: partial.progress ?? 0,
    attempts: partial.attempts ?? 1,
    duration_ms: partial.duration_ms ?? (partial.status === 'completed' ? 42000 : null),
    render_settings: partial.render_settings ?? { slides: 4, quality: 'medium', tts_voice: 'br-Female' },
    created_at: partial.created_at ?? now,
    updated_at: partial.updated_at ?? now,
    completed_at: partial.completed_at ?? (partial.status === 'completed' ? now : null),
  }
}

const generateSeedJobs = (userId: string): MockJob[] => {
  const now = Date.now()
  return [
    createJob(userId, {
      status: 'completed',
      progress: 100,
      duration_ms: 38000,
      created_at: new Date(now - 30 * 60 * 1000).toISOString(),
      completed_at: new Date(now - 25 * 60 * 1000).toISOString(),
      render_settings: { slides: 12, quality: 'high', tts_voice: 'br-Male' },
    }),
    createJob(userId, {
      status: 'completed',
      progress: 100,
      duration_ms: 52000,
      created_at: new Date(now - 90 * 60 * 1000).toISOString(),
      completed_at: new Date(now - 88 * 60 * 1000).toISOString(),
      render_settings: { slides: 9, quality: 'medium' },
    }),
    createJob(userId, {
      status: 'processing',
      progress: 65,
      duration_ms: null,
      created_at: new Date(now - 5 * 60 * 1000).toISOString(),
      render_settings: { slides: 6, quality: 'medium' },
    }),
    createJob(userId, {
      status: 'queued',
      progress: 0,
      duration_ms: null,
      created_at: new Date(now - 2 * 60 * 1000).toISOString(),
      render_settings: { slides: 3, quality: 'low' },
    }),
    createJob(userId, {
      status: 'failed',
      progress: 35,
      duration_ms: null,
      created_at: new Date(now - 3 * 60 * 60 * 1000).toISOString(),
      render_settings: { slides: 8, quality: 'high' },
    }),
  ]
}

const ensureUserJobs = (userId: string): MockJob[] => {
  const store = getStore()
  if (!store.has(userId)) {
    store.set(userId, generateSeedJobs(userId))
  }
  return store.get(userId) as MockJob[]
}

const toJobResponse = (job: MockJob) => ({
  id: job.id,
  status: job.status,
  project_id: job.project_id,
  created_at: job.created_at,
  progress: job.progress,
  attempts: job.attempts,
  duration_ms: job.duration_ms,
  settings: job.render_settings,
})

export const insertMockJob = (
  userId: string,
  payload: { project_id: string; slides: Array<{ order_index: number }>; quality?: string; tts_voice?: string }
) => {
  const jobs = ensureUserJobs(userId)
  const job = createJob(userId, {
    project_id: payload.project_id,
    status: 'queued',
    progress: 0,
    attempts: 1,
    duration_ms: null,
    render_settings: {
      slides: payload.slides.length,
      quality: payload.quality ?? 'medium',
      tts_voice: payload.tts_voice ?? 'br-Female',
    },
  })
  jobs.unshift(job)
  return toJobResponse(job)
}

export const listMockJobs = (userId: string, opts: { limit: number; status?: string }) => {
  const jobs = ensureUserJobs(userId)
  const filtered = opts.status ? jobs.filter((job) => job.status === opts.status) : jobs
  return filtered.slice(0, opts.limit).map(toJobResponse)
}

export const computeMockStats = (userId: string) => {
  const jobs = ensureUserJobs(userId)
  const counts = jobs.reduce<Record<string, number>>((acc, job) => {
    acc[job.status] = (acc[job.status] || 0) + 1
    return acc
  }, {})

  const completed = jobs.filter((job) => job.status === 'completed')
  const now = Date.now()
  const jobsCompletedLast60m = completed.filter((job) => {
    if (!job.completed_at) return false
    return now - new Date(job.completed_at).getTime() <= 60 * 60 * 1000
  }).length
  const durations = completed.map((job) => job.duration_ms ?? 0)
  const avgDuration = durations.length ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0
  const sorted = durations.slice().sort((a, b) => a - b)
  const pct = (p: number) => {
    if (!sorted.length) return 0
    const idx = Math.min(sorted.length - 1, Math.floor(p * (sorted.length - 1)))
    return sorted[idx]
  }

  return {
    totals: { total_jobs: jobs.length },
    by_status: {
      queued: counts['queued'] || 0,
      processing: counts['processing'] || 0,
      completed: counts['completed'] || 0,
      failed: counts['failed'] || 0,
      cancelled: counts['cancelled'] || 0,
      other: 0,
    },
    throughput: {
      window_minutes: 60,
      jobs_completed_last_60m: jobsCompletedLast60m,
      jobs_per_min: Number(((jobsCompletedLast60m || 0) / 60).toFixed(3)),
    },
    performance: {
      avg_duration_ms: avgDuration,
      p50_ms: pct(0.5),
      p90_ms: pct(0.9),
      p95_ms: pct(0.95),
    },
  }
}
