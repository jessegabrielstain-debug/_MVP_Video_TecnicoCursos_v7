import type { z } from 'zod'
import { VideoJobsListQuerySchema } from '../validation/schemas'

export type VideoJobsQuery = z.infer<typeof VideoJobsListQuerySchema>

export function parseVideoJobsQuery(input: Record<string, string | string[] | undefined>) {
  const normalized: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(input)) {
    normalized[key] = Array.isArray(value) ? value[0] : value
  }
  return VideoJobsListQuerySchema.safeParse(normalized)
}
