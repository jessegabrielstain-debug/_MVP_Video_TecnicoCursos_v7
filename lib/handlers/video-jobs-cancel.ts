import { z } from 'zod'

export const CancelJobSchema = z.object({
  id: z.string().uuid(),
})

export type CancelJobInput = z.infer<typeof CancelJobSchema>

export function parseCancelJobInput(json: unknown) {
  return CancelJobSchema.safeParse(json)
}
