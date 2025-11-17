import { appendFileSync } from 'node:fs'

export interface RateLimitResult {
  allowed: boolean
  retryAfterSec: number
}

export interface RateLimitBucket {
  windowStart: number
  lastRequest: number
  count: number
  blockedUntil: number
}

type Store = Map<string, RateLimitBucket>

type ProcessWithStore = NodeJS.Process & {
  __app_rate_limit_store__?: Store
}

type GlobalWithStore = typeof globalThis & {
  __app_rate_limit_store__?: Store
}

const logRateLimitEvent = (event: Record<string, unknown>) => {
  const logPath = process.env.RATE_LIMIT_DEBUG_LOG
  if (!logPath) return
  try {
    appendFileSync(logPath, `${JSON.stringify({ ts: Date.now(), ...event })}\n`, { encoding: 'utf-8' })
  } catch (err) {
    if (process.env.DEBUG_RATE_LIMIT === 'true') {
      console.error('[rate-limit] debug log failed', err)
    }
  }
}

const getStore = (): Store => {
  const proc = globalThis.process as ProcessWithStore | undefined
  if (proc) {
    if (!proc.__app_rate_limit_store__) {
      proc.__app_rate_limit_store__ = new Map<string, RateLimitBucket>()
    }
    return proc.__app_rate_limit_store__
  }

  const g = globalThis as GlobalWithStore
  if (!g.__app_rate_limit_store__) {
    g.__app_rate_limit_store__ = new Map<string, RateLimitBucket>()
  }
  return g.__app_rate_limit_store__
}

export function checkRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const store = getStore()
  const now = Date.now()
  let bucket = store.get(key)
  const idle = bucket ? now - bucket.lastRequest : 0

  if (!bucket || (idle >= windowMs && now >= (bucket.blockedUntil || 0))) {
    const newBucket: RateLimitBucket = { windowStart: now, lastRequest: now, count: 1, blockedUntil: 0 }
    store.set(key, newBucket)
    if (process.env.DEBUG_RATE_LIMIT === 'true') {
      console.info('[rate-limit] reset', { key, limit, windowMs, idle })
    }
    logRateLimitEvent({ type: 'reset', key, limit, windowMs, idle })
    return { allowed: true, retryAfterSec: 0 }
  }

  bucket = store.get(key) as RateLimitBucket

  if (bucket.blockedUntil && now < bucket.blockedUntil) {
    const retryAfterSec = Math.max(0, Math.ceil((bucket.blockedUntil - now) / 1000))
    if (process.env.DEBUG_RATE_LIMIT === 'true') {
      console.info('[rate-limit] still-blocked', { key, retryAfterSec })
    }
    logRateLimitEvent({ type: 'blocked', key, count: bucket.count, limit, retryAfterSec })
    bucket.lastRequest = now
    return { allowed: false, retryAfterSec }
  }

  if (bucket.count >= limit) {
    bucket.blockedUntil = bucket.windowStart + windowMs
    if (bucket.blockedUntil <= now) {
      bucket.blockedUntil = now + windowMs
    }
    const retryAfterSec = Math.max(0, Math.ceil((bucket.blockedUntil - now) / 1000))
    if (process.env.DEBUG_RATE_LIMIT === 'true') {
      console.info('[rate-limit] blocked', { key, count: bucket.count, limit, retryAfterSec })
    }
    logRateLimitEvent({ type: 'blocked', key, count: bucket.count, limit, retryAfterSec })
    bucket.lastRequest = now
    return { allowed: false, retryAfterSec }
  }

  bucket.count += 1
  bucket.lastRequest = now
  if (process.env.DEBUG_RATE_LIMIT === 'true') {
    console.info('[rate-limit] allowed', { key, count: bucket.count, limit, idle })
  }
  logRateLimitEvent({ type: 'allowed', key, count: bucket.count, limit, idle })
  return { allowed: true, retryAfterSec: 0 }
}

export function inspectRateLimit(key: string): RateLimitBucket | undefined {
  return getStore().get(key)
}
