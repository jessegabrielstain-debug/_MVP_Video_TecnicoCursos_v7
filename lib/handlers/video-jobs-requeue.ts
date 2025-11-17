import { z } from 'zod'
import { VideoJobRequeueSchema } from '../validation/schemas'

const RequeueJobCompatSchema = z.preprocess((value: unknown) => {
  if (typeof value === 'object' && value !== null) {
    const record = value as Record<string, unknown> & { id?: unknown; job_id?: unknown }
    if (!('jobId' in record)) {
      if (record.id) return { ...record, jobId: record.id }
      if (record.job_id) return { ...record, jobId: record.job_id }
    }
  }
  return value
}, VideoJobRequeueSchema)

export type RequeueJobInput = z.infer<typeof RequeueJobCompatSchema>

export function parseRequeueJob(json: unknown) {
  return RequeueJobCompatSchema.safeParse(json)
}
