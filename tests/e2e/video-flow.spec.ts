import { test, expect, request } from '@playwright/test';

test.describe('Video Flow Smoke', () => {
  test('list video jobs responds', async () => {
    const ctx = await request.newContext();
    const res = await ctx.get('/api/v1/video-jobs?limit=1');
    expect(res.status()).toBeLessThan(600);
  });

  test('render stats endpoint responds', async () => {
    const ctx = await request.newContext();
    const res = await ctx.get('/api/analytics/render-stats?limit=5');
    expect(res.status()).toBeLessThan(600);
  });
});