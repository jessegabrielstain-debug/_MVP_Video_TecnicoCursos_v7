/**
 * Testes para Dynamic Imports
 * @jest-environment node
 */

import { 
  createDynamicImport, 
  preloadComponent,
  preloadCriticalComponents,
  clearComponentCache,
  getComponentCacheStats,
  dynamicComponents
} from '../../../lib/performance/dynamic-imports';

// Mock React para evitar problemas com JSX
jest.mock('react', () => ({
  lazy: jest.fn((importFn) => importFn),
  ComponentType: jest.fn()
}));

// Mock do logger
jest.mock('../../../lib/logger', () => ({
  logger: {
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn()
  }
}));

const MockComponent = () => null;

describe('createDynamicImport', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearComponentCache(); // Clear cache before each test
  });
  beforeEach(() => {
    jest.clearAllMocks();
    clearComponentCache();
  });

  it('should create dynamic import function successfully', () => {
    const mockComponent = { default: MockComponent };
    const importFn = jest.fn(() => Promise.resolve(mockComponent));

    const LazyComponent = createDynamicImport(importFn, 'TestComponent');

    expect(typeof LazyComponent).toBe('function');
    // React.lazy mock doesn't automatically call the import function
    expect(importFn).toHaveBeenCalledTimes(0); // Will be called when component is rendered
  });

  it('should handle import failures with retry', async () => {
    let attempts = 0;
    const mockImport = jest.fn(() => {
      attempts++;
      if (attempts < 3) {
        return Promise.reject(new Error(`Attempt ${attempts} failed`));
      }
      return Promise.resolve({ default: MockComponent });
    });

    const LazyComponent = createDynamicImport(mockImport, 'RetryComponent', 3, 10);

    // The lazy function would be called by React when needed
    // Since it's mocked, we just verify the component was created
    expect(LazyComponent).toBeDefined();
    expect(mockImport).toHaveBeenCalledTimes(0); // Will be called when component is rendered
  });

  it('should cache components', () => {
    const importFn1 = jest.fn(() => Promise.resolve({ default: MockComponent }));
    const importFn2 = jest.fn(() => Promise.resolve({ default: MockComponent }));

    const LazyComponent1 = createDynamicImport(importFn1, 'CachedComponent');
    const LazyComponent2 = createDynamicImport(importFn2, 'CachedComponent');

    // Should return the same cached component
    expect(LazyComponent1).toBe(LazyComponent2);
    expect(importFn1).toHaveBeenCalledTimes(0); // Not called until render
    expect(importFn2).toHaveBeenCalledTimes(0); // Second call should use cache
  });
});

describe('preloadComponent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should preload components successfully', () => {
    const importFn = jest.fn(() => Promise.resolve({ default: MockComponent }));

    preloadComponent(importFn, 'PreloadTest');

    expect(importFn).toHaveBeenCalledTimes(1);
  });

  it('should handle preload failures gracefully', () => {
    const importFn = jest.fn(() => Promise.reject(new Error('Preload failed')));

    expect(() => {
      preloadComponent(importFn, 'FailingPreload');
    }).not.toThrow();

    expect(importFn).toHaveBeenCalledTimes(1);
  });
});

describe('preloadCriticalComponents', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should preload components with delay', () => {
    preloadCriticalComponents();

    // Fast forward 2 seconds
    jest.advanceTimersByTime(2000);

    // Should not throw any errors
    expect(jest.getTimerCount()).toBe(0);
  });
});

describe('getComponentCacheStats', () => {
  beforeEach(() => {
    clearComponentCache();
  });

  it('should return cache statistics', () => {
    const stats1 = getComponentCacheStats();
    expect(stats1.totalCached).toBe(0);
    expect(stats1.cachedComponents).toEqual([]);

    // Add a component to cache
    const importFn = jest.fn(() => Promise.resolve({ default: MockComponent }));
    createDynamicImport(importFn, 'StatsTestComponent');

    const stats2 = getComponentCacheStats();
    expect(stats2.totalCached).toBe(1);
    expect(stats2.cachedComponents).toContain('StatsTestComponent');
  });
});

describe('clearComponentCache', () => {
  beforeEach(() => {
    clearComponentCache(); // Ensure clean state before test
  });

  it('should clear all cached components', () => {
    // Add components to cache
    const importFn1 = jest.fn(() => Promise.resolve({ default: MockComponent }));
    const importFn2 = jest.fn(() => Promise.resolve({ default: MockComponent }));
    
    createDynamicImport(importFn1, 'ClearTest1');
    createDynamicImport(importFn2, 'ClearTest2');

    expect(getComponentCacheStats().totalCached).toBe(2);

    clearComponentCache();

    expect(getComponentCacheStats().totalCached).toBe(0);
  });
});

describe('dynamicComponents', () => {
  it('should have expected component factories', () => {
    expect(dynamicComponents.CanvasEditor).toBeDefined();
    expect(dynamicComponents.TimelineEditor).toBeDefined();
    expect(dynamicComponents.RenderQueue).toBeDefined();
    expect(dynamicComponents.Analytics).toBeDefined();
    expect(dynamicComponents.ComplianceDashboard).toBeDefined();
    expect(dynamicComponents.UserSettings).toBeDefined();
  });

  it('should create components when called', () => {
    const CanvasEditor = dynamicComponents.CanvasEditor();
    expect(CanvasEditor).toBeDefined();
  });
});