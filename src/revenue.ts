import type { RevenueData } from './types';

const CURRENCY_REGEX = /^[A-Z]{3}$/;

/** Validates revenue data. Throws on invalid input. */
export function validateRevenueData(data: RevenueData): void {
  if (!data.product_id || data.product_id.length > 200) {
    throw new Error('product_id must be between 1 and 200 characters.');
  }
  if (data.price < 0) {
    throw new Error('price must be >= 0.');
  }
  if (!CURRENCY_REGEX.test(data.currency)) {
    throw new Error(
      'currency must be a 3-letter uppercase ISO 4217 code (e.g., "USD").',
    );
  }
  if (data.quantity != null && (data.quantity < 1 || data.quantity > 1000)) {
    throw new Error('quantity must be between 1 and 1000.');
  }
}
