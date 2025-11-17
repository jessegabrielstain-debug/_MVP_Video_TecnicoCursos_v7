import { z } from 'zod'

export const StatusSchema = z.enum(['queued','processing','completed','failed','cancelled'])

export const VideoJobsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  status: StatusSchema.optional(),
})

export type VideoJobsQuery = z.infer<typeof VideoJobsQuerySchema>

export function parseVideoJobsQuery(input: Record<string, string | string[] | undefined>) {
  // Normalize to single string values
  const norm: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(input)) {
    norm[k] = Array.isArray(v) ? v[0] : v
  }
  return VideoJobsQuerySchema.safeParse(norm)
}
