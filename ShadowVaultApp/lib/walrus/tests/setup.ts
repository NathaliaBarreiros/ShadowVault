/**
 * Test setup configuration for Walrus library tests
 * Configures Jest environment and global test utilities
 */

import '@testing-library/jest-dom';

// Mock Web Crypto API for Node.js environment
const { webcrypto } = require('crypto');

Object.defineProperty(global, 'crypto', {
  value: webcrypto,
});

// Mock TextEncoder/TextDecoder
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock localStorage for browser-dependent tests
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock fetch for API tests
global.fetch = jest.fn();

// Suppress console errors during tests unless explicitly needed
const originalError = console.error;
console.error = (...args: any[]) => {
  if (
    typeof args[0] === 'string' &&
    args[0].includes('Warning: ReactDOM.render is no longer supported')
  ) {
    return;
  }
  originalError.call(console, ...args);
};

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
  localStorageMock.getItem.mockClear();
  localStorageMock.setItem.mockClear();
  localStorageMock.removeItem.mockClear();
  localStorageMock.clear.mockClear();
  
  if (global.fetch) {
    (global.fetch as jest.Mock).mockClear();
  }
});

// Global test utilities
export const createMockVaultEntry = (overrides = {}) => ({
  name: 'Test Service',
  username: 'test@example.com',
  password: 'test-password-123',
  category: 'work',
  network: 'zircuit',
  url: 'https://example.com',
  createdAt: Date.now(),
  updatedAt: Date.now(),
  ...overrides,
});

export const createMockEncryptedData = (overrides = {}) => ({
  ciphertext: 'mock-encrypted-data',
  iv: 'mock-iv-data',
  salt: 'mock-salt-data',
  authTag: 'mock-auth-tag',
  ...overrides,
});

export const createMockWalrusBlob = (overrides = {}) => ({
  blobId: 'mock-blob-id-123',
  size: 1024,
  epochs: {
    start: 100,
    end: 110,
  },
  ...overrides,
});

export const createMockVaultMetadata = (overrides = {}) => ({
  entryId: 'entry-123',
  blobId: 'blob-123',
  name: 'Test Service',
  category: 'work',
  url: 'https://example.com',
  createdAt: Date.now(),
  updatedAt: Date.now(),
  size: 1024,
  ...overrides,
});

// Helper to wait for async operations in tests
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0));

// Helper to mock successful fetch response
export const mockFetchSuccess = (data: any) => {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: true,
    json: async () => data,
    text: async () => typeof data === 'string' ? data : JSON.stringify(data),
    arrayBuffer: async () => new ArrayBuffer(8),
  });
};

// Helper to mock failed fetch response
export const mockFetchError = (status: number, message: string) => {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: false,
    status,
    statusText: message,
    text: async () => message,
  });
};

// Helper to create a mock crypto key
export const createMockCryptoKey = async () => {
  return await crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256,
    },
    true,
    ['encrypt', 'decrypt']
  );
};

// Test timeout configuration
jest.setTimeout(30000); // 30 seconds for integration tests

// Silence React warnings in tests
const originalWarn = console.warn;
console.warn = (...args: any[]) => {
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('React.createFactory') ||
     args[0].includes('componentWillReceiveProps'))
  ) {
    return;
  }
  originalWarn.call(console, ...args);
};