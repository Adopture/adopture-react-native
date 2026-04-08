import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { EventQueue } from '../src/event-queue';
import type { AnalyticsEvent } from '../src/types';

function makeEvent(name: string): AnalyticsEvent {
  return {
    type: 'track',
    name,
    hashed_daily_id: 'daily-hash',
    hashed_monthly_id: 'monthly-hash',
    session_id: 'session-1',
    timestamp: '2026-04-08T12:00:00Z',
    properties: {},
    context: {
      os: 'ios',
      os_version: '17.0',
      app_version: '1.0.0',
      locale: 'en',
      device_type: 'phone',
      screen_width: 390,
      screen_height: 844,
    },
  };
}

describe('EventQueue', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts empty', async () => {
    const q = new EventQueue(100);
    await q.init();
    expect(q.length).toBe(0);
    expect(q.isEmpty).toBe(true);
  });

  it('adds events and tracks length', async () => {
    const q = new EventQueue(100);
    await q.init();
    await q.add(makeEvent('event-1'));
    await q.add(makeEvent('event-2'));
    expect(q.length).toBe(2);
    expect(q.isEmpty).toBe(false);
  });

  it('takes events FIFO', async () => {
    const q = new EventQueue(100);
    await q.init();
    await q.add(makeEvent('first'));
    await q.add(makeEvent('second'));
    await q.add(makeEvent('third'));

    const batch = q.take(2);
    expect(batch).toHaveLength(2);
    expect(batch[0].name).toBe('first');
    expect(batch[1].name).toBe('second');
    expect(q.length).toBe(1);
  });

  it('take returns fewer if queue is smaller than count', async () => {
    const q = new EventQueue(100);
    await q.init();
    await q.add(makeEvent('only'));
    const batch = q.take(5);
    expect(batch).toHaveLength(1);
    expect(q.isEmpty).toBe(true);
  });

  it('prunes FIFO when exceeding maxSize', async () => {
    const q = new EventQueue(3);
    await q.init();
    await q.add(makeEvent('a'));
    await q.add(makeEvent('b'));
    await q.add(makeEvent('c'));
    await q.add(makeEvent('d')); // oldest ('a') should be pruned

    expect(q.length).toBe(3);
    const all = q.take(3);
    expect(all[0].name).toBe('b');
    expect(all[1].name).toBe('c');
    expect(all[2].name).toBe('d');
  });

  it('requeues events to the front', async () => {
    const q = new EventQueue(100);
    await q.init();
    await q.add(makeEvent('existing'));

    const failed = [makeEvent('retry-1'), makeEvent('retry-2')];
    q.requeue(failed);

    expect(q.length).toBe(3);
    const all = q.take(3);
    expect(all[0].name).toBe('retry-1');
    expect(all[1].name).toBe('retry-2');
    expect(all[2].name).toBe('existing');
  });

  it('requeue prunes from end when exceeding maxSize', async () => {
    const q = new EventQueue(3);
    await q.init();
    await q.add(makeEvent('a'));
    await q.add(makeEvent('b'));
    await q.add(makeEvent('c'));

    q.requeue([makeEvent('urgent')]);
    expect(q.length).toBe(3);
    // 'c' should have been pruned from end
    const all = q.take(3);
    expect(all[0].name).toBe('urgent');
    expect(all[1].name).toBe('a');
    expect(all[2].name).toBe('b');
  });

  it('clears all events', async () => {
    const q = new EventQueue(100);
    await q.init();
    await q.add(makeEvent('a'));
    await q.add(makeEvent('b'));

    await q.clear();
    expect(q.length).toBe(0);
    expect(q.isEmpty).toBe(true);
  });
});
