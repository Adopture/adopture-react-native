import { vi } from 'vitest';

// Mock AsyncStorage with a resettable store
const asyncStorageStore = new Map<string, string>();

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn((key: string) =>
      Promise.resolve(asyncStorageStore.get(key) ?? null),
    ),
    setItem: vi.fn((key: string, value: string) => {
      asyncStorageStore.set(key, value);
      return Promise.resolve();
    }),
    removeItem: vi.fn((key: string) => {
      asyncStorageStore.delete(key);
      return Promise.resolve();
    }),
  },
}));

// Clear storage between tests to prevent leaking state
beforeEach(() => {
  asyncStorageStore.clear();
});

// Mock react-native-get-random-values (no-op, crypto.getRandomValues exists in Node)
vi.mock('react-native-get-random-values', () => ({}));

// Mock react-native for Dimensions/Platform
vi.mock('react-native', () => ({
  Platform: { OS: 'ios', Version: '17.0' },
  Dimensions: {
    get: () => ({ width: 390, height: 844 }),
  },
  AppState: {
    currentState: 'active',
    addEventListener: vi.fn(() => ({ remove: vi.fn() })),
  },
}));
