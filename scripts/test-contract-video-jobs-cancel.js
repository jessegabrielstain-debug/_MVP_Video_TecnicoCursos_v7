import assert from 'node:assert/strict'
import { z } from 'zod'

const CancelJobSchema = z.object({ id: z.string().uuid() })

function testInvalid() {
  const res = CancelJobSchema.safeParse({ id: 'abc' })
  assert.equal(res.success, false)
}

function testMissing() {
  const res = CancelJobSchema.safeParse({ })
  assert.equal(res.success, false)
}

function testValid() {
  const res = CancelJobSchema.safeParse({ id: '00000000-0000-4000-8000-000000000000' })
  assert.equal(res.success, true)
}

function main() {
  testInvalid();
  testMissing();
  testValid();
  console.log('[contract] video-jobs-cancel: OK')
}

main();
