import { z } from 'zod'

export const UuidParamSchema = z.object({ id: z.string().uuid() })
export type UuidParam = z.infer<typeof UuidParamSchema>

export function parseUuidParam(params: Record<string, unknown>) {
  return UuidParamSchema.safeParse(params)
}
