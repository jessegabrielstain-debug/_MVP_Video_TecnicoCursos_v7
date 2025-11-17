import assert from 'node:assert/strict'
import { parseVideoJobInput } from '../lib/handlers/video-jobs'

function testInvalid() {
  const payload = { project_id: 'not-a-uuid', slides: [] } // invalid uuid and empty slides
  const result = parseVideoJobInput(payload)
  assert.equal(result.ok, false, 'Expected invalid payload to fail')
  if (!result.ok) {
    assert.ok(result.issues.length >= 2, 'Expected at least two issues')
  }
}

function uuidv4() {
  // Simple UUID v4 generator for test purposes
  return '00000000-0000-4000-8000-000000000000'
}

function testValid() {
  const payload = {
    project_id: uuidv4(),
    slides: [
      { title: 'Intro', content: 'Bem-vindo', order_index: 0 },
      { title: 'Conteúdo', content: 'Detalhes', order_index: 1 }
    ],
    tts_voice: 'br-Female',
    quality: 'high' as const
  }
  const result = parseVideoJobInput(payload)
  assert.equal(result.ok, true, 'Expected valid payload to pass')
  if (result.ok) {
    assert.equal(result.data.slides.length, 2, 'Slides length must be 2')
    assert.equal(result.data.quality, 'high')
  }
}

function main() {
  testInvalid()
  testValid()
  console.log('[contract] video-jobs: OK')
}

main()
