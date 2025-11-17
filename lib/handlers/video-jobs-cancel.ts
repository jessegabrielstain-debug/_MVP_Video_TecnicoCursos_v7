import { z } from 'zod'
import { VideoJobCancelSchema } from '../validation/schemas'

const CancelJobCompatSchema = z.union([
  z.object({ id: z.string().uuid() }),
  VideoJobCancelSchema
]).transform((input) => {
  if ('id' in input) return { id: input.id }
  return { id: (input as { jobId: string }).jobId }
})

export type CancelJobInput = { id: string }

export function parseCancelJobInput(json: unknown) {
  return CancelJobCompatSchema.safeParse(json)
}
