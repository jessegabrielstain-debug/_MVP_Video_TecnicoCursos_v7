export type JobStatus = 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled'

export type CreateJobPayload = {
  project_id: string
  slides: { title: string; content: string; order_index: number }[]
  tts_voice?: string
  quality?: 'low'|'medium'|'high'
  flow?: {
    enabled?: boolean
    bpmSource?: 'auto'|'manual'
    bpmManual?: number
    beatToleranceMs?: number
    crossfadeRatio?: number
    sidechain?: { threshold?: number; ratio?: number }
  }
}

export async function createJob(baseUrl: string, token: string, payload: CreateJobPayload) {
  const res = await fetch(new URL('/api/v1/video-jobs', baseUrl), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(payload)
  })
  return res
}

export async function listJobs(baseUrl: string, token: string, opts?: { limit?: number; status?: JobStatus }) {
  const url = new URL('/api/v1/video-jobs', baseUrl)
  if (opts?.limit) url.searchParams.set('limit', String(opts.limit))
  if (opts?.status) url.searchParams.set('status', opts.status)
  const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } })
  return res
}

export async function cancelJob(baseUrl: string, token: string, id: string) {
  const res = await fetch(new URL('/api/v1/video-jobs/cancel', baseUrl), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ id })
  })
  return res
}

export async function updateProgress(baseUrl: string, token: string, id: string, progress: number, status?: Exclude<JobStatus,'queued'|'cancelled'>) {
  const res = await fetch(new URL('/api/v1/video-jobs/progress', baseUrl), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ id, progress, status })
  })
  return res
}

export async function requeueJob(baseUrl: string, token: string, id: string) {
  const res = await fetch(new URL('/api/v1/video-jobs/requeue', baseUrl), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ id })
  })
  return res
}
