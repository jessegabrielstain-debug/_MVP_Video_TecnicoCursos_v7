import { z } from 'zod'
import { VideoJobRetrySchema } from '../validation/schemas'

const RequeueJobCompatSchema = z.union([
  z.object({ id: z.string().uuid() }),
  VideoJobRetrySchema
]).transform((input) => {
  if ('id' in input) return { id: input.id }
  return { id: (input as { jobId: string }).jobId }
})

export type RequeueJobInput = { id: string }
export function parseRequeueJob(json: unknown) {
  return RequeueJobCompatSchema.safeParse(json)
}
