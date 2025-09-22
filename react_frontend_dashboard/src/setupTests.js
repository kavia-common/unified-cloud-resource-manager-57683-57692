import '@testing-library/jest-dom';

// Mock Supabase environment variables
process.env.REACT_APP_SUPABASE_URL = 'http://localhost:8000';
process.env.REACT_APP_SUPABASE_KEY = 'test-anon-key';

// Mock window.crypto for JWT decoding
Object.defineProperty(global.self, 'crypto', {
  value: {
    subtle: {
      digest: () => Promise.resolve(new ArrayBuffer(32)),
    },
    getRandomValues: () => new Uint8Array(32),
  },
});

// Mock fetch
global.fetch = jest.fn(() => Promise.resolve({
  ok: true,
  json: () => Promise.resolve({}),
}));
