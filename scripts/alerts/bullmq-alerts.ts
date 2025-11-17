#!/usr/bin/env ts-node
import https from 'https';
import { getQueueMetrics, closeBullMQ } from '../../estudio_ia_videos/app/lib/services/bullmq-service';

function postSlack(webhook: string, message: string) {
  const data = JSON.stringify({ text: message });
  const url = new URL(webhook);
  const opts: https.RequestOptions = {
    method: 'POST', hostname: url.hostname, path: url.pathname + url.search, headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
  };
  return new Promise<void>((resolve, reject) => {
    const req = https.request(opts, res => { res.on('data', () => {}); res.on('end', () => resolve()); });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function main() {
  const webhook = process.env.SLACK_WEBHOOK_URL;
  if (!webhook) {
    console.error('SLACK_WEBHOOK_URL ausente');
    return;
  }
  const thresholds = {
    waiting: parseInt(process.env.BULLMQ_ALERT_WAITING || '100', 10),
    failed: parseInt(process.env.BULLMQ_ALERT_FAILED || '10', 10),
  };
  try {
    const m = await getQueueMetrics();
    const alerts: string[] = [];
    if (m.waiting >= thresholds.waiting) alerts.push(`Fila alta: waiting=${m.waiting} (>= ${thresholds.waiting})`);
    if (m.failed >= thresholds.failed) alerts.push(`Jobs falhos: failed=${m.failed} (>= ${thresholds.failed})`);
    if (alerts.length) {
      const text = `BullMQ Alertas:\n${alerts.join('\n')}\nTotal=${m.total}`;
      await postSlack(webhook, text);
      console.log('[bullmq-alerts] alerta enviado');
    } else {
      console.log('[bullmq-alerts] sem alertas');
    }
  } catch (err) {
    console.error('[bullmq-alerts] erro', err);
    process.exitCode = 1;
  } finally {
    await closeBullMQ();
  }
}

main();