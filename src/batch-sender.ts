import type { AdoptureConfig } from './config';
import type { EventQueue } from './event-queue';
import { log } from './logger';
import type { AnalyticsEvent, EventPayload } from './types';
import { generateUUID } from './utils';

const MAX_BATCH_SIZE = 100;
const MAX_RETRIES = 5;
const MAX_BACKOFF_MS = 30_000;

type SendResult = 'success' | 'rate_limited' | 'server_error' | 'network_error';

/** Sends batched events to the ingestion endpoint with retry logic. */
export class BatchSender {
  private readonly config: AdoptureConfig;
  private readonly queue: EventQueue;
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private netInfoUnsubscribe: (() => void) | null = null;
  private isFlushing = false;
  private wasOffline = false;

  constructor(config: AdoptureConfig, queue: EventQueue) {
    this.config = config;
    this.queue = queue;
  }

  /** Starts the periodic flush timer and optional connectivity listener. */
  start(): void {
    this.stop();

    // Debug mode sends immediately — no timer needed
    if (this.config.debug) return;

    this.flushTimer = setInterval(() => {
      this.flush().catch(() => {});
    }, this.config.flushIntervalMs);

    this.setupConnectivityListener();
  }

  /** Stops the periodic flush timer and connectivity listener. */
  stop(): void {
    if (this.flushTimer != null) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    this.netInfoUnsubscribe?.();
    this.netInfoUnsubscribe = null;
  }

  /** Flushes all queued events to the server. */
  async flush(): Promise<void> {
    if (this.isFlushing || this.queue.isEmpty) return;

    // Check connectivity if NetInfo is available
    if (await this.isOffline()) {
      log(`No network — skipping flush (${this.queue.length} events queued)`);
      this.wasOffline = true;
      return;
    }

    this.isFlushing = true;
    log(`Flush started (${this.queue.length} events in queue)`);

    try {
      while (this.queue.length > 0) {
        const batchSize = Math.min(this.queue.length, MAX_BATCH_SIZE);
        const events = this.queue.take(batchSize);

        log(`Sending batch of ${events.length} events...`);
        const result = await this.sendWithRetry(events);

        if (result === 'success') {
          log(`Batch sent successfully (${events.length} events)`);
        } else {
          log(`Batch failed: ${result} — re-queuing ${events.length} events`);
          this.queue.requeue(events);
          break;
        }
      }
    } finally {
      this.isFlushing = false;
      log(`Flush complete (${this.queue.length} events remaining)`);
    }
  }

  /** Cleans up resources. */
  dispose(): void {
    this.stop();
  }

  private async sendWithRetry(events: AnalyticsEvent[]): Promise<SendResult> {
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      const result = await this.send(events);

      if (result === 'success' || result === 'rate_limited') {
        return result;
      }

      // server_error or network_error — retry with backoff
      if (attempt < MAX_RETRIES - 1) {
        const maxMs = Math.min((1 << attempt) * 1000, MAX_BACKOFF_MS);
        const jitteredMs = Math.floor(Math.random() * maxMs);
        log(`Retry ${attempt + 1}/${MAX_RETRIES} in ${jitteredMs}ms (${result})`);
        await sleep(jitteredMs);
      }
    }

    return 'network_error';
  }

  private async send(events: AnalyticsEvent[]): Promise<SendResult> {
    const payload: EventPayload = {
      app_key: this.config.appKey,
      sdk_version: this.config.sdkVersion,
      events,
    };

    const url = `${this.config.apiEndpoint}/api/v1/events`;
    const body = JSON.stringify(payload);
    log(`Payload: ${body.length} bytes`);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': generateUUID(),
        },
        body,
      });

      log(`HTTP ${response.status} from ${url}`);

      if (response.status === 202) {
        return 'success';
      } else if (response.status === 429) {
        const retryAfter = response.headers.get('retry-after');
        const seconds = parseInt(retryAfter ?? '', 10) || 60;
        log(`Rate limited — will retry after ${seconds}s (next flush cycle)`);
        return 'rate_limited';
      } else if (response.status === 503) {
        log('Server overloaded — retry after 30s');
        await sleep(30_000);
        return 'server_error';
      } else {
        const text = await response.text().catch(() => '');
        log(`Unexpected response: ${response.status} ${text}`);
        return 'server_error';
      }
    } catch (e) {
      log(`Network error: ${e}`);
      return 'network_error';
    }
  }

  private async isOffline(): Promise<boolean> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const NetInfo = require('@react-native-community/netinfo').default;
      const state = await NetInfo.fetch();
      return state.isConnected === false;
    } catch {
      // NetInfo not installed — assume online, let fetch handle errors
      return false;
    }
  }

  private setupConnectivityListener(): void {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const NetInfo = require('@react-native-community/netinfo').default;
      this.netInfoUnsubscribe = NetInfo.addEventListener(
        (state: { isConnected: boolean | null }) => {
          const isOffline = state.isConnected === false;
          if (this.wasOffline && !isOffline) {
            log('Network restored — flushing queued events');
            this.flush().catch(() => {});
          }
          this.wasOffline = isOffline;
        },
      );
    } catch {
      // NetInfo not installed — skip connectivity monitoring
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
