import dotenv from 'dotenv'

dotenv.config()

const required: string[] = []

const byProvider: Record<string, string[]> = {
  s3: ['AWS_REGION', 'AWS_S3_BUCKET'],
  supabase: ['SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_URL'],
  local: []
}

const provider = (process.env.STORAGE_PROVIDER || 'local').toLowerCase()
const missing = new Set<string>()

for (const key of required) {
  if (!process.env[key]) missing.add(key)
}

for (const key of byProvider[provider] || []) {
  if (!process.env[key] && !process.env[`NEXT_PUBLIC_${key}`]) missing.add(key)
}

if (missing.size) {
  console.error(JSON.stringify({ ok: false, provider, missing: Array.from(missing) }))
  process.exit(1)
} else {
  console.log(JSON.stringify({ ok: true, provider }))
}
