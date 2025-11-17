import { z } from 'zod'
import { StatusSchema } from './video-jobs-query'

const AllowedStatus = z.enum(['processing','completed','failed'])
export const UpdateProgressSchema = z.object({
  id: z.string().uuid(),
  progress: z.coerce.number().min(0).max(100),
  status: AllowedStatus.optional(),
})

export type UpdateProgressInput = z.infer<typeof UpdateProgressSchema>

export function parseUpdateProgress(json: unknown) {
  return UpdateProgressSchema.safeParse(json)
}
