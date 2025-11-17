#!/usr/bin/env ts-node
import { getVideoRenderQueue, closeBullMQ } from '../../estudio_ia_videos/app/lib/services/bullmq-service';

async function run() {
  const queue = getVideoRenderQueue();
  const jobs = await queue.getJobs(['waiting', 'active', 'failed', 'completed'], 0, 50);
  const simplified = jobs.map(j => ({ id: j.id, name: j.name }));
  console.log(JSON.stringify({ count: simplified.length, jobs: simplified }, null, 2));
  await closeBullMQ();
}

run().catch(err => {
  console.error('[inspect-queue] error', err);
  process.exitCode = 1;
});