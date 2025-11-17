import { startQueueMetricsPolling, stopQueueMetricsPolling } from '../../../estudio_ia_videos/app/lib/services/bullmq-service';

jest.mock('../../../estudio_ia_videos/app/lib/services/bullmq-service', () => {
  const original = jest.requireActual('../../../estudio_ia_videos/app/lib/services/bullmq-service');
  return {
    ...original,
    getQueueMetrics: jest.fn(async () => ({ waiting: 1, active: 0, completed: 0, failed: 0, delayed: 0, total: 1 })),
  };
});

describe('BullMQ metrics polling', () => {
  it('starts and stops polling without throwing', async () => {
    startQueueMetricsPolling(50);
    await new Promise(r => setTimeout(r, 120));
    stopQueueMetricsPolling();
    expect(true).toBe(true);
  });
});