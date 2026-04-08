/**
 * SDK types — must stay in sync with packages/shared/src/types/index.ts.
 *
 * These types are intentionally duplicated (not imported from @adopture/shared)
 * because this SDK is published to npm and cannot have a runtime dependency on
 * the monorepo's shared package. When updating backend schemas, update these
 * types to match.
 */

/** Event types matching the backend schema. */
export type EventType = 'track' | 'screen' | 'revenue';

/** Device context attached to every event. */
export interface EventContext {
  os: string;
  os_version: string;
  app_version: string;
  locale: string;
  device_type: string;
  screen_width: number;
  screen_height: number;
}

/** A single analytics event matching the backend SDKEvent schema. */
export interface AnalyticsEvent {
  type: EventType;
  name: string;
  hashed_daily_id: string;
  hashed_monthly_id: string;
  hashed_retention_id?: string;
  session_id: string;
  timestamp: string;
  properties: Record<string, string>;
  context: EventContext;
  user_id?: string;
  revenue?: RevenueData;
}

/** Batch payload sent to POST /api/v1/events. */
export interface EventPayload {
  app_key: string;
  sdk_version: string;
  events: AnalyticsEvent[];
}

/** Revenue event types matching the backend revenue_events schema. */
export type RevenueEventType =
  | 'INITIAL_PURCHASE'
  | 'RENEWAL'
  | 'NON_RENEWING_PURCHASE'
  | 'CANCELLATION'
  | 'REFUND'
  | 'TRIAL_STARTED'
  | 'TRIAL_CONVERTED';

/** Store where the purchase was made. */
export type Store = 'APP_STORE' | 'PLAY_STORE' | 'STRIPE' | 'OTHER';

/** Revenue tracking data attached to a revenue event. */
export interface RevenueData {
  event_type: RevenueEventType;
  product_id: string;
  price: number;
  currency: string;
  quantity?: number;
  transaction_id?: string;
  store?: Store;
  is_trial?: boolean;
  is_trial_conversion?: boolean;
  period_type?: '' | 'TRIAL' | 'INTRO' | 'NORMAL';
  expiration_at?: string;
}

/** Options for Adopture.init(). */
export interface AdoptureInitOptions {
  /** App key for authentication (format: ak_ + 24 alphanumeric chars). */
  appKey: string;
  /** Override the API endpoint URL. Default: https://api.adopture.com */
  apiEndpoint?: string;
  /** Enable debug mode (logs events, sends immediately). Default: false. */
  debug?: boolean;
  /** Automatically capture lifecycle events and sessions. Default: true. */
  autoCapture?: boolean;
  /** Flush interval in milliseconds. Default: 30000. */
  flushIntervalMs?: number;
  /** Flush when this many events are queued. Default: 20. */
  flushAt?: number;
  /** Maximum number of events to store locally. Default: 1000. */
  maxQueueSize?: number;
  /** Hash user IDs before sending. Default: true. */
  hashUserIds?: boolean;
  /** App version string. Auto-detected from Expo if available. */
  appVersion?: string;
}

/** Options for trackPurchase / trackOneTimePurchase. */
export interface PurchaseOptions {
  productId: string;
  price: number;
  currency: string;
  transactionId?: string;
  store?: Store;
}

/** Options for trackRenewal. */
export interface RenewalOptions {
  productId: string;
  price: number;
  currency: string;
  transactionId?: string;
  store?: Store;
  expirationAt?: string;
}

/** Options for trackTrialStarted. */
export interface TrialOptions {
  productId: string;
  store?: Store;
  expirationAt?: string;
}

/** Options for trackTrialConverted. */
export interface TrialConvertedOptions {
  productId: string;
  price: number;
  currency: string;
  transactionId?: string;
  store?: Store;
}

/** Options for trackCancellation. */
export interface CancellationOptions {
  productId: string;
  store?: Store;
}

/** Options for trackRefund. */
export interface RefundOptions {
  productId: string;
  price: number;
  currency: string;
  transactionId?: string;
  store?: Store;
}
