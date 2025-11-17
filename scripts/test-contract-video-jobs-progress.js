import assert from 'node:assert/strict'
import { z } from 'zod'

const AllowedStatus = z.enum(['processing','completed','failed'])
const UpdateProgressSchema = z.object({
  id: z.string().uuid(),
  progress: z.coerce.number().min(0).max(100),
  status: AllowedStatus.optional(),
})

function testInvalidProgress() {
  const res = UpdateProgressSchema.safeParse({ id: '00000000-0000-4000-8000-000000000000', progress: 101 })
  assert.equal(res.success, false)
}

function testValidProcessing() {
  const res = UpdateProgressSchema.safeParse({ id: '00000000-0000-4000-8000-000000000000', progress: 40, status: 'processing' })
  assert.equal(res.success, true)
}

function testValidCompleted() {
  const res = UpdateProgressSchema.safeParse({ id: '00000000-0000-4000-8000-000000000000', progress: 100, status: 'completed' })
  assert.equal(res.success, true)
}

function main() {
  testInvalidProgress();
  testValidProcessing();
  testValidCompleted();
  console.log('[contract] video-jobs-progress: OK')
}

main();
