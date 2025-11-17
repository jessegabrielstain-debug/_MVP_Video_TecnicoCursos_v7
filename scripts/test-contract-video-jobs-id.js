import assert from 'node:assert/strict'
import { z } from 'zod'

const UuidParamSchema = z.object({ id: z.string().uuid() })

function testInvalid() {
  const res = UuidParamSchema.safeParse({ id: 'abc' })
  assert.equal(res.success, false)
}

function testValid() {
  const res = UuidParamSchema.safeParse({ id: '00000000-0000-4000-8000-000000000000' })
  assert.equal(res.success, true)
}

function main() {
  testInvalid();
  testValid();
  console.log('[contract] video-jobs-id: OK')
}

main();
