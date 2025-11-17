import { GET as getStats } from '../estudio_ia_videos/app/api/v1/video-jobs/stats/route'

async function main() {
  const req = new Request('http://localhost/api/v1/video-jobs/stats', {
    headers: {
      authorization: '',
    },
  })
  const res = await getStats(req)
  console.log('Status:', res.status)
  console.log('Headers:', Object.fromEntries(res.headers.entries()))
  console.log('Body:', await res.text())
}

main().catch((err) => {
  console.error('Error calling stats route', err)
  process.exit(1)
})
