import { POST } from '../estudio_ia_videos/app/api/v1/video-jobs/route'

process.env.USE_MOCK_RENDER_JOBS = process.env.USE_MOCK_RENDER_JOBS ?? 'true'

async function main() {
  const payload = {
    project_id: '00000000-0000-4000-8000-000000000000',
    slides: [{ title: 'Test', content: 'Test', order_index: 0 }],
    quality: 'low',
  }

  for (let i = 1; i <= 31; i += 1) {
    const req = new Request('http://localhost/api/v1/video-jobs', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    const res = await POST(req)
    const body = await res.json()
    console.log(`req #${i} -> status=${res.status}`, body)
    if (res.status === 429) {
      break
    }
  }
}

main().catch((err) => {
  console.error('dev-rate-limit-check failed', err)
  process.exit(1)
})
