import fetch from 'node-fetch'

async function main() {
  const baseUrl = process.env.BASE_URL || 'http://127.0.0.1:3331'
  const url = `${baseUrl.replace(/\/$/, '')}/api/v1/video-jobs`
  const payload = {
    project_id: '00000000-0000-4000-8000-000000000000',
    slides: [{ title: 'Test', content: 'Test', order_index: 0 }],
    quality: 'low',
  }

  for (let i = 1; i <= 31; i += 1) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    })
    console.log(`req #${i} -> status=${res.status}`)
    if (res.status === 429) {
      console.log('hit rate limit, stopping')
      break
    }
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
}

main().catch((err) => {
  console.error('dev-rate-limit-http failed', err)
  process.exit(1)
})
