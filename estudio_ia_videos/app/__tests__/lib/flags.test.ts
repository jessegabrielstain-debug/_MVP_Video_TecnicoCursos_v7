import { loadFlags } from '../../lib/flags';

describe('Feature flags', () => {
  test('defaults are false', () => {
    const f = loadFlags({});
    expect(f.enableAdvancedAnalytics).toBe(false);
    expect(f.enableVideoPreview).toBe(false);
    expect(f.enableBetaEditor).toBe(false);
  });
  test('true values parsed', () => {
    const f = loadFlags({ FLAG_ENABLE_ADVANCED_ANALYTICS: 'true', FLAG_ENABLE_VIDEO_PREVIEW: '1', FLAG_ENABLE_BETA_EDITOR: 'on' } as any);
    expect(Object.values(f).every(v => v === true)).toBe(true);
  });
  test('invalid values fallback to defaults', () => {
    const f = loadFlags({ FLAG_ENABLE_ADVANCED_ANALYTICS: 'x' } as any);
    expect(f.enableAdvancedAnalytics).toBe(false);
  });
});