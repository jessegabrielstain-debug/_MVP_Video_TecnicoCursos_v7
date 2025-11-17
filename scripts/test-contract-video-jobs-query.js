import assert from 'node:assert/strict'
import { z } from 'zod'

const StatusSchema = z.enum(['queued','processing','completed','failed','cancelled'])
const VideoJobsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  status: StatusSchema.optional(),
})

function testValidDefault() {
  const res = VideoJobsQuerySchema.safeParse({ })
  assert.equal(res.success, true)
  if (res.success) assert.equal(res.data.limit, 20)
}

function testValidCustom() {
  const res = VideoJobsQuerySchema.safeParse({ limit: '10', status: 'queued' })
  assert.equal(res.success, true)
  if (res.success) {
    assert.equal(res.data.limit, 10)
    assert.equal(res.data.status, 'queued')
  }
}

function testInvalidLimit() {
  const res = VideoJobsQuerySchema.safeParse({ limit: '0' })
  assert.equal(res.success, false)
}

function testInvalidStatus() {
  const res = VideoJobsQuerySchema.safeParse({ status: 'other' })
  assert.equal(res.success, false)
}

function main() {
  testValidDefault();
  testValidCustom();
  testInvalidLimit();
  testInvalidStatus();
  console.log('[contract] video-jobs-query: OK')
}

main();
