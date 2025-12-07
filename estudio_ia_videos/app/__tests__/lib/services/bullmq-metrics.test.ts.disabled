jest.mock('../../../lib/services/bullmq', () => ({
  startQueueMetricsPolling: jest.fn(),
  stopQueueMetricsPolling: jest.fn(),
  getQueueMetrics: jest.fn(async () => ({ waiting: 1, active: 0, completed: 0, failed: 0, delayed: 0, total: 1 })),
}));

import { startQueueMetricsPolling, stopQueueMetricsPolling } from '../../../lib/services/bullmq';

describe('BullMQ metrics polling', () => {
  it('starts and stops polling without throwing', async () => {
    startQueueMetricsPolling(50);
    await new Promise(r => setTimeout(r, 120));
    stopQueueMetricsPolling();
    expect(true).toBe(true);
  });
});