import { describe, expect, it } from 'vitest';

import { formatScreenName } from '../src/navigation';

describe('formatScreenName', () => {
  it('converts / to home', () => {
    expect(formatScreenName('/')).toBe('home');
  });

  it('converts empty string to home', () => {
    expect(formatScreenName('')).toBe('home');
  });

  it('strips leading slash', () => {
    expect(formatScreenName('/settings')).toBe('settings');
  });

  it('preserves path without leading slash', () => {
    expect(formatScreenName('settings')).toBe('settings');
  });

  it('strips query params', () => {
    expect(formatScreenName('/settings?tab=privacy')).toBe('settings');
  });

  it('strips fragment', () => {
    expect(formatScreenName('/docs#section-1')).toBe('docs');
  });

  it('strips trailing slash', () => {
    expect(formatScreenName('/shopping-list/')).toBe('shopping-list');
  });

  it('preserves multi-segment paths', () => {
    expect(formatScreenName('/app/settings')).toBe('app/settings');
  });

  it('normalizes UUID-like segments to detail', () => {
    expect(formatScreenName('/users/a1b2c3d4e5f6g7h8i9j0')).toBe(
      'users/detail',
    );
  });

  it('normalizes UUID with dashes to detail', () => {
    expect(
      formatScreenName('/orders/550e8400-e29b-41d4-a716-446655440000'),
    ).toBe('orders/detail');
  });

  it('does not normalize short IDs', () => {
    expect(formatScreenName('/users/123')).toBe('users/123');
  });

  it('normalizes only non-first segments', () => {
    // First segment is never treated as an ID even if long
    expect(
      formatScreenName('/a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6'),
    ).toBe('a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6');
  });

  it('handles complex paths with query + fragment + trailing slash', () => {
    expect(formatScreenName('/shop/items/?sort=price#top')).toBe('shop/items');
  });
});
