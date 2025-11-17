import assert from 'node:assert/strict'
import { z } from 'zod'

const SlideInputSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  order_index: z.number().int().nonnegative(),
})

const VideoJobInputSchema = z.object({
  project_id: z.string().uuid(),
  slides: z.array(SlideInputSchema).min(1),
  tts_voice: z.string().optional(),
  quality: z.enum(['low', 'medium', 'high']).default('medium'),
})

function testInvalid() {
  const payload = { project_id: 'not-a-uuid', slides: [] }
  const res = VideoJobInputSchema.safeParse(payload)
  assert.equal(res.success, false, 'Expected invalid payload to fail')
  if (!res.success) {
    assert.ok(res.error.issues.length >= 2, 'Expected at least two issues')
  }
}

function uuidv4() {
  return '00000000-0000-4000-8000-000000000000'
}

function testValid() {
  const payload = {
    project_id: uuidv4(),
    slides: [
      { title: 'Intro', content: 'Bem-vindo', order_index: 0 },
      { title: 'Conteúdo', content: 'Detalhes', order_index: 1 },
    ],
    tts_voice: 'br-Female',
    quality: 'high',
  }
  const res = VideoJobInputSchema.safeParse(payload)
  assert.equal(res.success, true, 'Expected valid payload to pass')
  if (res.success) {
    assert.equal(res.data.slides.length, 2, 'Slides length must be 2')
    assert.equal(res.data.quality, 'high')
  }
}

function main() {
  testInvalid()
  testValid()
  console.log('[contract] video-jobs: OK')
}

main()
