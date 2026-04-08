import type { AdoptureInitOptions } from './types';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore -- JSON import works in both Metro and bundled builds
import pkg from '../package.json' with { type: 'json' };

const SDK_VERSION: string = pkg.version;

const APP_KEY_REGEX = /^ak_[A-Za-z0-9]{24}$/;

/** The default API endpoint URL. */
export const DEFAULT_API_ENDPOINT = 'https://api.adopture.com';

/** Resolved and validated SDK configuration. */
export interface AdoptureConfig {
  readonly appKey: string;
  readonly apiEndpoint: string;
  readonly debug: boolean;
  readonly autoCapture: boolean;
  readonly flushIntervalMs: number;
  readonly flushAt: number;
  readonly maxQueueSize: number;
  readonly hashUserIds: boolean;
  readonly sdkVersion: string;
  readonly appVersion: string;
}

/** Creates a validated config from init options. Throws on invalid input. */
export function createConfig(options: AdoptureInitOptions): AdoptureConfig {
  const config: AdoptureConfig = {
    appKey: options.appKey,
    apiEndpoint: options.apiEndpoint ?? DEFAULT_API_ENDPOINT,
    debug: options.debug ?? false,
    autoCapture: options.autoCapture ?? true,
    flushIntervalMs: options.flushIntervalMs ?? 30_000,
    flushAt: options.flushAt ?? 20,
    maxQueueSize: options.maxQueueSize ?? 1000,
    hashUserIds: options.hashUserIds ?? true,
    sdkVersion: SDK_VERSION,
    appVersion: options.appVersion ?? '',
  };

  validateConfig(config);
  return config;
}

/** Validates configuration. Throws on invalid input. */
export function validateConfig(config: AdoptureConfig): void {
  if (!APP_KEY_REGEX.test(config.appKey)) {
    throw new Error(
      'Invalid appKey format. Expected: ak_ followed by 24 alphanumeric characters.',
    );
  }
  if (config.flushAt < 1 || config.flushAt > 100) {
    throw new Error('flushAt must be between 1 and 100.');
  }
  if (config.maxQueueSize < 1) {
    throw new Error('maxQueueSize must be at least 1.');
  }
}
