/**
 * Testes para Tree Shaking Utilities
 * @jest-environment node
 */

import { 
  pure, 
  conditionalImport, 
  deadCodeElimination, 
  bundleAnalyzer,
  featureSplitting,
  DEFAULT_TREE_SHAKING_CONFIG
} from '../../../lib/performance/tree-shaking';

describe('Pure function decorator', () => {
  it('should mark function as pure', () => {
    const testFunction = pure((x: number) => x * 2);
    
    expect((testFunction as any).__PURE__).toBe(true);
    expect(testFunction(5)).toBe(10);
  });

  it('should not affect function behavior', () => {
    const originalFn = (a: number, b: number) => a + b;
    const pureFn = pure(originalFn);
    
    expect(pureFn(3, 4)).toBe(7);
    expect(pureFn.length).toBe(2); // Same arity
  });
});

describe('Conditional imports', () => {
  it('should import module when condition is true', async () => {
    const mockModule = { default: 'test-module' };
    const importFn = jest.fn(() => Promise.resolve(mockModule));
    
    const result = await conditionalImport.if(true, importFn);
    
    expect(result).toBe(mockModule);
    expect(importFn).toHaveBeenCalledTimes(1);
  });

  it('should not import module when condition is false', async () => {
    const importFn = jest.fn(() => Promise.resolve({ default: 'test' }));
    
    const result = await conditionalImport.if(false, importFn);
    
    expect(result).toBeNull();
    expect(importFn).not.toHaveBeenCalled();
  });

  describe('Environment-based imports', () => {
    const originalNodeEnv = process.env.NODE_ENV;

    afterEach(() => {
      process.env.NODE_ENV = originalNodeEnv;
    });

    it('should import in development when using dev()', async () => {
      process.env.NODE_ENV = 'development';
      const importFn = jest.fn(() => Promise.resolve({ default: 'dev-module' }));
      
      const result = await conditionalImport.dev(importFn);
      
      expect(result).toEqual({ default: 'dev-module' });
      expect(importFn).toHaveBeenCalled();
    });

    it('should not import in production when using dev()', async () => {
      process.env.NODE_ENV = 'production';
      const importFn = jest.fn();
      
      const result = await conditionalImport.dev(importFn);
      
      expect(result).toBeNull();
      expect(importFn).not.toHaveBeenCalled();
    });

    it('should import in production when using prod()', async () => {
      process.env.NODE_ENV = 'production';
      const importFn = jest.fn(() => Promise.resolve({ default: 'prod-module' }));
      
      const result = await conditionalImport.prod(importFn);
      
      expect(result).toEqual({ default: 'prod-module' });
      expect(importFn).toHaveBeenCalled();
    });
  });

  describe('Platform-based imports', () => {
    const originalWindow = global.window;

    afterEach(() => {
      global.window = originalWindow;
    });

    it('should import for browser when window exists', async () => {
      global.window = {} as any;
      const importFn = jest.fn(() => Promise.resolve({ default: 'browser-module' }));
      
      const result = await conditionalImport.browser(importFn);
      
      expect(result).toEqual({ default: 'browser-module' });
      expect(importFn).toHaveBeenCalled();
    });

    it('should import for server when window does not exist', async () => {
      delete (global as any).window;
      const importFn = jest.fn(() => Promise.resolve({ default: 'server-module' }));
      
      const result = await conditionalImport.server(importFn);
      
      expect(result).toEqual({ default: 'server-module' });
      expect(importFn).toHaveBeenCalled();
    });
  });
});

describe('Dead code elimination', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalConsoleLog = console.log;

  beforeEach(() => {
    console.log = jest.fn();
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    console.log = originalConsoleLog;
  });

  describe('debugLog', () => {
    it('should log in development', () => {
      process.env.NODE_ENV = 'development';
      
      deadCodeElimination.debugLog('test message', 123);
      
      expect(console.log).toHaveBeenCalledWith('test message', 123);
    });

    it('should not log in production', () => {
      process.env.NODE_ENV = 'production';
      
      deadCodeElimination.debugLog('test message');
      
      expect(console.log).not.toHaveBeenCalled();
    });
  });

  describe('devOnly', () => {
    it('should execute function in development', () => {
      process.env.NODE_ENV = 'development';
      const mockFn = jest.fn(() => 'dev-result');
      
      const result = deadCodeElimination.devOnly(mockFn);
      
      expect(result).toBe('dev-result');
      expect(mockFn).toHaveBeenCalled();
    });

    it('should not execute function in production', () => {
      process.env.NODE_ENV = 'production';
      const mockFn = jest.fn();
      
      const result = deadCodeElimination.devOnly(mockFn);
      
      expect(result).toBeUndefined();
      expect(mockFn).not.toHaveBeenCalled();
    });
  });

  describe('assert', () => {
    it('should pass for true conditions in development', () => {
      process.env.NODE_ENV = 'development';
      
      expect(() => {
        deadCodeElimination.assert(true, 'Should not throw');
      }).not.toThrow();
    });

    it('should throw for false conditions in development', () => {
      process.env.NODE_ENV = 'development';
      
      expect(() => {
        deadCodeElimination.assert(false, 'Custom error message');
      }).toThrow('Custom error message');
    });

    it('should not throw in production regardless of condition', () => {
      process.env.NODE_ENV = 'production';
      
      expect(() => {
        deadCodeElimination.assert(false, 'Should not throw in production');
      }).not.toThrow();
    });
  });
});

describe('Bundle analyzer', () => {
  beforeEach(() => {
    // Mock performance.now
    global.performance = {
      now: jest.fn(() => Date.now())
    } as any;
  });

  it('should log import size', async () => {
    const mockModule = { default: 'test', helper: () => {} };
    const modulePromise = Promise.resolve(mockModule);
    
    const result = await bundleAnalyzer.logImportSize('test-module', modulePromise);
    
    expect(result).toBe(mockModule);
  });

  it('should measure dynamic import performance', async () => {
    const mockModule = { default: () => {}, utils: {} };
    const importFn = jest.fn(() => Promise.resolve(mockModule));
    
    const result = await bundleAnalyzer.measureDynamicImport('test-module', importFn);
    
    expect(result.module).toBe(mockModule);
    expect(result.metrics).toEqual({
      loadTime: expect.any(Number),
      estimatedSize: expect.any(Number)
    });
    expect(importFn).toHaveBeenCalled();
  });

  it('should handle import failures in measurement', async () => {
    const importError = new Error('Import failed');
    const importFn = jest.fn(() => Promise.reject(importError));
    
    await expect(
      bundleAnalyzer.measureDynamicImport('failing-module', importFn)
    ).rejects.toThrow('Import failed');
  });
});

describe('Feature splitting', () => {
  it('should load feature successfully', async () => {
    const mockFeature = { init: jest.fn(), render: jest.fn() };
    const importFn = jest.fn(() => Promise.resolve({ default: mockFeature }));
    
    const result = await featureSplitting.loadFeature('test-feature', importFn);
    
    expect(result).toBe(mockFeature);
    expect(importFn).toHaveBeenCalled();
  });

  it('should use fallback when feature fails to load', async () => {
    const fallbackFeature = { init: jest.fn(), render: jest.fn() };
    const importFn = jest.fn(() => Promise.reject(new Error('Network error')));
    
    const result = await featureSplitting.loadFeature(
      'failing-feature', 
      importFn, 
      fallbackFeature
    );
    
    expect(result).toBe(fallbackFeature);
  });

  it('should throw error when no fallback is provided', async () => {
    const importFn = jest.fn(() => Promise.reject(new Error('Network error')));
    
    await expect(
      featureSplitting.loadFeature('failing-feature', importFn)
    ).rejects.toThrow('Network error');
  });

  it('should preload features with delay', async () => {
    const features = [
      { name: 'feature1', importFn: jest.fn(() => Promise.resolve({})) },
      { name: 'feature2', importFn: jest.fn(() => Promise.resolve({})) },
      { name: 'feature3', importFn: jest.fn(() => Promise.resolve({})) }
    ];
    
    featureSplitting.preloadFeatures(features);
    
    // Aguardar um momento para execução assíncrona
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // O primeiro import deve ser chamado
    expect(features[0].importFn).toHaveBeenCalled();
    
    // Aguardar delays para outros imports
    await new Promise(resolve => setTimeout(resolve, 700)); // 500ms + buffer maior
    
    expect(features[1].importFn).toHaveBeenCalled();
    
    await new Promise(resolve => setTimeout(resolve, 700)); // 500ms + buffer maior
    
    expect(features[2].importFn).toHaveBeenCalled();
  });
});

describe('Tree shaking configuration', () => {
  it('should have default configuration', () => {
    expect(DEFAULT_TREE_SHAKING_CONFIG).toEqual({
      analyzeUnusedImports: true,
      analyzeDeadCode: true,
      generateReport: true,
      excludePatterns: [
        'node_modules',
        '__tests__',
        '.test.',
        '.spec.',
        'coverage',
        'dist',
        'build'
      ]
    });
  });
});