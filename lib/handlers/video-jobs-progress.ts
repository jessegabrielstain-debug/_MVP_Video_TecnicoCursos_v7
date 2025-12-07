import { z } from 'zod'
import { JobStatusEnum, VideoJobProgressSchema } from '../validation/schemas'

const progressStatusAllowList = new Set(['processing', 'completed', 'failed', 'queued', 'cancelled'] as const)

const UpdateProgressSchema = z.preprocess((value: unknown) => {
  if (typeof value === 'object' && value !== null) {
    const record = value as Record<string, unknown> & { id?: unknown; job_id?: unknown }
    if (!('jobId' in record)) {
      if (record.id) return { ...record, jobId: record.id }
      if (record.job_id) return { ...record, jobId: record.job_id }
    }
  }
  return value
}, VideoJobProgressSchema.pick({ jobId: true, progress: true }).extend({
  status: JobStatusEnum.optional(),
}).refine(data => !data.status || progressStatusAllowList.has(data.status), {
  path: ['status'],
  message: 'Status inválido para atualização de progresso',
}))

export type UpdateProgressInput = z.infer<typeof UpdateProgressSchema>

export function parseUpdateProgress(json: unknown) {
  return UpdateProgressSchema.safeParse(json)
}
