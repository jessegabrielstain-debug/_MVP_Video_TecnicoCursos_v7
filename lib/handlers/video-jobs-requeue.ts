import { z } from 'zod'

export const RequeueJobSchema = z.object({ id: z.string().uuid() })
export type RequeueJobInput = z.infer<typeof RequeueJobSchema>
export function parseRequeueJob(json: unknown) {
  return RequeueJobSchema.safeParse(json)
}
