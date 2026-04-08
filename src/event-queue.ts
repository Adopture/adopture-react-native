import AsyncStorage from '@react-native-async-storage/async-storage';

import type { AnalyticsEvent } from './types';

const STORAGE_KEY = '@adopture/event_queue';

/** Manages event queuing with in-memory list backed by AsyncStorage. */
export class EventQueue {
  private events: AnalyticsEvent[] = [];
  private readonly maxSize: number;
  private persistTimer: ReturnType<typeof setTimeout> | null = null;
  private initialized = false;

  constructor(maxSize = 1000) {
    this.maxSize = maxSize;
  }

  /** Loads persisted events from AsyncStorage. */
  async init(): Promise<void> {
    if (this.initialized) return;

    try {
      const json = await AsyncStorage.getItem(STORAGE_KEY);
      if (json != null) {
        const parsed = JSON.parse(json) as AnalyticsEvent[];
        this.events = parsed.slice(0, this.maxSize);
      }
    } catch {
      // Corrupted data — start fresh
      this.events = [];
    }

    this.initialized = true;
  }

  /** Adds an event to the queue with debounced persistence. */
  async add(event: AnalyticsEvent): Promise<void> {
    this.events.push(event);

    // Prune FIFO if over limit
    while (this.events.length > this.maxSize) {
      this.events.shift();
    }

    this.schedulePersist();
  }

  /** Removes and returns up to `count` events from the front of the queue. */
  take(count: number): AnalyticsEvent[] {
    const batch = this.events.splice(0, count);
    this.persistNow();
    return batch;
  }

  /** Re-adds events to the front of the queue (for retry after failed send). */
  requeue(events: AnalyticsEvent[]): void {
    this.events.unshift(...events);
    // Prune from end if over limit after requeue
    while (this.events.length > this.maxSize) {
      this.events.pop();
    }
  }

  /** Clears all events from memory and storage. */
  async clear(): Promise<void> {
    this.events = [];
    this.cancelPendingPersist();
    await AsyncStorage.removeItem(STORAGE_KEY);
  }

  get length(): number {
    return this.events.length;
  }

  get isEmpty(): boolean {
    return this.events.length === 0;
  }

  /** Debounced persistence — coalesces rapid writes (100ms). */
  private schedulePersist(): void {
    if (this.persistTimer != null) return;
    this.persistTimer = setTimeout(() => {
      this.persistTimer = null;
      this.persistNow();
    }, 100);
  }

  private cancelPendingPersist(): void {
    if (this.persistTimer != null) {
      clearTimeout(this.persistTimer);
      this.persistTimer = null;
    }
  }

  private persistNow(): void {
    this.cancelPendingPersist();
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this.events)).catch(() => {
      // Swallow persistence errors — events are still in memory
    });
  }
}
