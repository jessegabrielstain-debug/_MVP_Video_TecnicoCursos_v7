import { VideoJobCancelSchema } from '../validation/schemas'

const CancelJobCompatSchema = VideoJobCancelSchema.transform(input => ({
  id: input.jobId,
  reason: input.reason,
}))

export type CancelJobInput = { id: string; reason?: string }

export function parseCancelJobInput(json: unknown) {
  return CancelJobCompatSchema.safeParse(json)
}
