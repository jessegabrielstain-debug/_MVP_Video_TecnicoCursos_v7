import {
  Queue,
  QueueEvents,
  Worker,
  type JobsOptions,
  type Processor,
  type QueueOptions,
  type QueueEventsOptions,
  type WorkerOptions,
  Job
} from 'bullmq'
import { getQueueConfig } from './config'
import type { RenderTaskPayload, RenderTaskResult } from './types'
import { videoRenderPipeline } from '@/lib/video-render-pipeline'

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
  
  // Check for mock mode
  if (redisUrl === 'redis://mock:6379') {
    return { host: 'mock', port: 6379 }
  }

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

  const { queueName, redisUrl } = getQueueConfig()
  
  if (redisUrl === 'redis://mock:6379') {
    // Return a mock queue object that satisfies the interface partially
    // @deprecated-any: Mock object for development without Redis
    console.warn('⚠️ Using MOCK RenderQueue (No Redis configured)')
    cachedQueue = {
      add: async (name: string, data: RenderTaskPayload) => {
        const jobId = data.jobId || `mock-job-${Date.now()}`;
        console.log('MOCK Queue: Adding job', name, jobId)
        
        // In Real Implementation with Postgres Worker (scripts/render-worker.js),
        // we do NOT want to trigger the Node.js pipeline here, as it would cause double execution.
        // The worker will pick up the job from the database.
        console.log('MOCK Queue: Job added. Waiting for Postgres Worker to pick it up from DB.');
        
        return {
          id: jobId,
          name,
          data: { ...data, jobId },
          getState: async () => 'active',
          remove: async () => {},
        } as unknown as Job<RenderTaskPayload, RenderTaskResult>
      },
      getJob: async (jobId: string) => null,
      close: async () => {},
      // Add other methods as needed by the app, returning safe defaults
    } as unknown as Queue<RenderTaskPayload, RenderTaskResult>
    
    return cachedQueue
  }

  cachedQueue = new Queue<RenderTaskPayload, RenderTaskResult>(queueName, buildQueueOptions(options))
  return cachedQueue
}

export function createRenderQueueEvents(options?: QueueEventsOptions): RenderQueueEvents {
  const { queueName, redisUrl } = getQueueConfig()
  
  if (redisUrl === 'redis://mock:6379') {
     return {
       on: () => {},
       close: async () => {},
     } as unknown as QueueEvents
  }

  const connection = buildConnection()

  return new QueueEvents(queueName, {
    ...options,
    connection: options?.connection ?? connection,
  })
}

export function createRenderWorker(
  processor: Processor<RenderTaskPayload, RenderTaskResult>,
  options?: Omit<WorkerOptions, 'connection'> & { connection?: WorkerOptions['connection'] },
) {
  const { queueName, redisUrl } = getQueueConfig()
  
  if (redisUrl === 'redis://mock:6379') {
    return {
      on: () => {},
      close: async () => {},
      run: async () => {},
    } as unknown as Worker<RenderTaskPayload, RenderTaskResult>
  }

  const connection = buildConnection()

  return new Worker<RenderTaskPayload, RenderTaskResult>(queueName, processor, {
    ...options,
    connection: options?.connection ?? connection,
  })
}

export type RenderQueue = Queue<RenderTaskPayload, RenderTaskResult>
export type RenderQueueWorker = Worker<RenderTaskPayload, RenderTaskResult>
export type RenderQueueEvents = QueueEvents

export async function addVideoJob(data: RenderTaskPayload) {
  const queue = getRenderQueue();
  return queue.add('render-video', data);
}

export async function getVideoJobStatus(jobId: string) {
  const queue = getRenderQueue();
  const job = await queue.getJob(jobId);
  return job ? await job.getState() : null;
}

// Aliases and helpers for tests
export const createRenderQueue = () => getRenderQueue();

export async function addRenderJob(queue: Queue<RenderTaskPayload, RenderTaskResult>, data: RenderTaskPayload) {
  // Map test data to RenderTaskPayload if needed
  // For now assume data is compatible or just pass it
  return queue.add('render-job', data);
}

export async function getJobStatus(queue: Queue<RenderTaskPayload, RenderTaskResult>, jobId: string) {
  const job = await queue.getJob(jobId);
  if (!job) return null;
  const state = await job.getState();
  return {
    status: state,
    data: job.data
  };
}

export async function cancelJob(queue: Queue<RenderTaskPayload, RenderTaskResult>, jobId: string) {
  const job = await queue.getJob(jobId);
  if (job) {
    await job.remove();
    return true;
  }
  return false;
}

// Re-export para compatibilidade
export { getRenderQueue as RenderQueue };
