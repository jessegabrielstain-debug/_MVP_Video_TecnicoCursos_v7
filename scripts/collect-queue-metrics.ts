#!/usr/bin/env ts-node
import { getQueueMetrics, closeBullMQ } from '../estudio_ia_videos/app/lib/services/bullmq-service';

async function main() {
  try {
    const metrics = await getQueueMetrics();
    console.log(JSON.stringify({ ts: new Date().toISOString(), ...metrics }));
  } catch (err) {
    console.error('[collect-queue-metrics] error', err);
    process.exitCode = 1;
  } finally {
    await closeBullMQ();
  }
}

main();