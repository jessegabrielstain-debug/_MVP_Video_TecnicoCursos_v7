import {
  Queue,
  QueueEvents,
  Worker,
  type JobsOptions,
  type Processor,
  type QueueOptions,
  type QueueEventsOptions,
  type WorkerOptions,
} from 'bullmq'
import { getQueueConfig } from './config'
import type { RenderTaskPayload, RenderTaskResult } from './types'

const defaultJobOptions: JobsOptions = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 5_000,
  },
  removeOnComplete: 100,
  removeOnFail: 200,
}

let cachedQueue: Queue<RenderTaskPayload, RenderTaskResult> | null = null

function buildConnection(): QueueOptions['connection'] {
  const { redisUrl } = getQueueConfig()
  const connectionUrl = new URL(redisUrl)

  const connection: QueueOptions['connection'] = {
    host: connectionUrl.hostname,
    port: Number(connectionUrl.port || 6379),
    password: connectionUrl.password || undefined,
    username: connectionUrl.username || undefined,
    db: connectionUrl.pathname ? Number(connectionUrl.pathname.replace('/', '') || '0') : undefined,
  }

  if (connectionUrl.protocol === 'rediss:') {
    // Enable TLS when using secure Redis providers (e.g., Upstash)
    ;(connection as Record<string, unknown>).tls = {
      rejectUnauthorized: false,
    }
  }

  return connection
}

function buildQueueOptions(options?: QueueOptions): QueueOptions {
  const connection = buildConnection()
  const baseOptions: QueueOptions = {
    connection,
    defaultJobOptions,
  }

  const merged = { ...baseOptions, ...options } as QueueOptions
  merged.connection = merged.connection ?? connection
  merged.defaultJobOptions = merged.defaultJobOptions ?? defaultJobOptions

  return merged
}

export function getRenderQueue(options?: QueueOptions) {
  if (cachedQueue) {
    return cachedQueue
  }

  const { queueName } = getQueueConfig()
  cachedQueue = new Queue<RenderTaskPayload, RenderTaskResult>(queueName, buildQueueOptions(options))
  return cachedQueue
}

export function createRenderQueueEvents(options?: QueueEventsOptions): RenderQueueEvents {
  const { queueName } = getQueueConfig()
  const connection = buildConnection()

  return new QueueEvents(queueName, {
    ...options,
    connection: options?.connection ?? connection,
  })
}

export function createRenderWorker(
  processor: Processor<RenderTaskPayload, RenderTaskResult>,
  options?: WorkerOptions,
) {
  const { queueName } = getQueueConfig()
  const connection = buildConnection()

  return new Worker<RenderTaskPayload, RenderTaskResult>(queueName, processor, {
    ...options,
    connection: options?.connection ?? connection,
  })
}

export type RenderQueue = Queue<RenderTaskPayload, RenderTaskResult>
export type RenderQueueWorker = Worker<RenderTaskPayload, RenderTaskResult>
export type RenderQueueEvents = QueueEvents
