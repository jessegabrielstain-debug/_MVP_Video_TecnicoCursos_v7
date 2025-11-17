import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock WebSocket
const WebSocketMock = {
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3
};

global.WebSocket = WebSocketMock as any;

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock as any;

// Mock IndexedDB
const indexedDBMock = {
  open: vi.fn(() => ({
    onsuccess: null,
    onerror: null,
    result: {
      transaction: vi.fn(() => ({
        objectStore: vi.fn(() => ({
          add: vi.fn(),
          get: vi.fn(),
          put: vi.fn(),
          delete: vi.fn(),
          getAll: vi.fn()
        })),
      })),
    },
  })),
};
global.indexedDB = indexedDBMock as any;

// Mock File API
global.File = class File {
  constructor(public chunks: any[], public name: string, public options?: any) {}
  get size() { return this.chunks.reduce((acc, chunk) => acc + chunk.length, 0); }
  get type() { return this.options?.type || ''; }
} as any;

global.FileReader = class FileReader {
  readAsText = vi.fn();
  readAsDataURL = vi.fn();
  result = '';
  onload = null;
  onerror = null;
} as any;

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: any) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});