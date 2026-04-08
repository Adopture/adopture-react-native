import { describe, expect, it } from 'vitest';

import { validateRevenueData } from '../src/revenue';
import type { RevenueData } from '../src/types';

function validRevenue(overrides: Partial<RevenueData> = {}): RevenueData {
  return {
    event_type: 'INITIAL_PURCHASE',
    product_id: 'com.app.premium',
    price: 9.99,
    currency: 'USD',
    ...overrides,
  };
}

describe('validateRevenueData', () => {
  it('accepts valid revenue data', () => {
    expect(() => validateRevenueData(validRevenue())).not.toThrow();
  });

  it('accepts price of 0 (free trial)', () => {
    expect(() => validateRevenueData(validRevenue({ price: 0 }))).not.toThrow();
  });

  it('rejects empty product_id', () => {
    expect(() => validateRevenueData(validRevenue({ product_id: '' }))).toThrow(
      'product_id',
    );
  });

  it('rejects product_id longer than 200 chars', () => {
    expect(() =>
      validateRevenueData(validRevenue({ product_id: 'x'.repeat(201) })),
    ).toThrow('product_id');
  });

  it('rejects negative price', () => {
    expect(() =>
      validateRevenueData(validRevenue({ price: -1 })),
    ).toThrow('price');
  });

  it('rejects lowercase currency', () => {
    expect(() =>
      validateRevenueData(validRevenue({ currency: 'usd' })),
    ).toThrow('currency');
  });

  it('rejects invalid currency format', () => {
    expect(() =>
      validateRevenueData(validRevenue({ currency: 'US' })),
    ).toThrow('currency');
    expect(() =>
      validateRevenueData(validRevenue({ currency: 'USDX' })),
    ).toThrow('currency');
  });

  it('accepts valid quantity', () => {
    expect(() =>
      validateRevenueData(validRevenue({ quantity: 1 })),
    ).not.toThrow();
    expect(() =>
      validateRevenueData(validRevenue({ quantity: 1000 })),
    ).not.toThrow();
  });

  it('rejects quantity < 1', () => {
    expect(() =>
      validateRevenueData(validRevenue({ quantity: 0 })),
    ).toThrow('quantity');
  });

  it('rejects quantity > 1000', () => {
    expect(() =>
      validateRevenueData(validRevenue({ quantity: 1001 })),
    ).toThrow('quantity');
  });
});
