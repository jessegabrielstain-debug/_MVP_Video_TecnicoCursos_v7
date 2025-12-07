import { Client } from 'pg'
import { promises as fs } from 'fs'
import path from 'path'
import dotenv from 'dotenv'

function parseArgs() {
  const args = new Set(process.argv.slice(2))
  const apply = args.has('--apply')
  return { apply }
}

async function loadDatabaseUrl() {
  dotenv.config()
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL as string
  const devEnvPath = path.resolve('estudio_ia_videos', 'config', 'development.env')
  try {
    const content = await fs.readFile(devEnvPath, 'utf8')
    const line = content.split('\n').find(l => l.startsWith('DATABASE_URL='))
    if (line) return line.replace('DATABASE_URL="', '').replace('"', '').trim()
  } catch {}
  throw new Error('DATABASE_URL not found')
}

function splitSql(sql: string) {
  const lines = sql.split(/\r?\n/)
  const result: string[] = []
  let buf: string[] = []
  let inDollar = false
  for (const line of lines) {
    if (line.trim().startsWith('--')) continue
    if (line.includes('$$')) inDollar = !inDollar
    buf.push(line)
    if (!inDollar && /;\s*$/.test(line)) {
      result.push(buf.join('\n'))
      buf = []
    }
  }
  const rest = buf.join('\n').trim()
  if (rest) result.push(rest)
  return result.filter(s => s.trim().length > 0)
}

async function main() {
  const { apply } = parseArgs()
  const sqlPath = path.resolve('MANUAL_FIX_REQUIRED.sql')
  const sqlRaw = await fs.readFile(sqlPath, 'utf8')
  const statements = splitSql(sqlRaw)
  if (!apply) {
    console.log(JSON.stringify({ statementsCount: statements.length, preview: statements.slice(0, 3) }, null, 2))
    return
  }
  const url = await loadDatabaseUrl()
  const client = new Client({ connectionString: url })
  await client.connect()
  let executed = 0
  for (const stmt of statements) {
    try {
      await client.query(stmt)
      executed++
    } catch (e) {
      const m = String(e)
      const ignorable = m.includes('already exists') || m.includes('duplicate key') || m.includes('does not exist')
      if (!ignorable) throw e
    }
  }
  await client.end()
  console.log(JSON.stringify({ success: true, executed }, null, 2))
}

main().catch(e => {
  console.error(JSON.stringify({ success: false, error: String(e) }))
  process.exit(1)
})

